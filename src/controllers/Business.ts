import { PrismaClient } from "@prisma/client";
import { ServerController } from "./Servers";
import Machine from "./Machine";
import GeneratorNginx from "./Nginx";
const prisma = new PrismaClient();
import crypto, { verify } from "crypto"
import { socketEmitter } from "../app";

export interface TicketPayload {
  total: number;
  id: string;
  customerName: string;
  customerPhone: string;
  businessId: string;
  items: {
    id: number;
    quantity: number;
  }[];
}


export default class BusinessController {
  async Create(businessName: string, cnpj: string = "not informed", domain?: string) {
    domain ? (domain).toLowerCase().replace(/[' ]/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "") : domain = (`${businessName}.${process.env.DOMAIN}`).toLowerCase().replace(/[' ]/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const port = await new Machine().getFreePort() as number
    const secret = crypto.randomBytes(32).toString("hex")
    await new GeneratorNginx().createNginxServer(domain, port);
    const business = await prisma.business.create({
      data: {
        businessName,
        cnpj,
        domain,
        secret,
        port
      },
    });

    return new ServerController().createNewSite(business.businessName, business.port)

  }

  async Search(businessName: string, cnpj: string) {
    return prisma.business.findMany({
      where: {
        OR: [
          { businessName: { contains: businessName, } },
        ]
      }
    })
  }

  async Count() {
    return await prisma.business.count();
  }

  async Many() {
    return await prisma.business.findMany();
  }

  async SearchPort(port: number) {
    return await prisma.business.findUnique({
      where: { port: Number(port) }
    })
  }

  async SearchId(businessId: string) {
    return await prisma.business.findUnique({
      where: { id: businessId }
    })
  }

  async SearchLastPortNumber() {
    const result = await prisma.business.findFirst({
      orderBy: { port: 'desc' },
      select: { port: true }
    });

    return result?.port ?? 0;
  }

  async ValidationKey(port: number, timestamp: string, signature: string) {
    // Busca pelo subservidor/empresa pela porta
    const business = await prisma.business.findUnique({
      where: { port }
    });

    if (!business || !business.secret) return { code: false };

    // Previne replay attack — timestamp não pode ser muito antigo (ex.: 1 min)
    const diff = Math.abs(Date.now() - Number(timestamp));
    if (diff > 60 * 1000) {
      console.warn("⛔ Timestamp inválido ou expirado.");
      return { code: false };
    }

    // Gera a assinatura esperada
    const expectedSignature = crypto
      .createHmac("sha256", business.secret)
      .update(`${port}:${timestamp}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return { code: false };
    }
    return { code: true, data: business };
  }

  async ValidationHMAC(port: number, timestamp: string, signature: string) {
    const business = await prisma.business.findUnique({
      where: { port },
      include: { settings: true }
    });

    if (!business || !business.secret) return null;

    const expectedSignature = crypto
      .createHmac("sha256", business.secret)
      .update(`${port}:${timestamp}`)
      .digest("hex");

    return expectedSignature === signature ? business : null;
  }

  async VerifyUser(
    customerPhone: string,
    customerName: string,
    businessId: string
  ) {
    // Busca o usuário existente
    let user = await prisma.user.findUnique({
      where: { phone: customerPhone },
      include: {
        tickets: {
          where: { businessId },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Caso não exista, cria
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: customerPhone,
          customerName,
          businessId,
        },
        include: {
          tickets: {
            where: { businessId },
          },
        },
      });
    }

    // Caso exista e o nome seja diferente → faz UPDATE
    else if (user.customerName !== customerName) {
      user = await prisma.user.update({
        where: { phone: customerPhone },
        data: { customerName },
        include: {
          tickets: {
            where: { businessId },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }

    // Garante que todos os itens sejam enriquecidos com o product
    for (const ticket of user.tickets) {
      if (!Array.isArray(ticket.items)) {
        ticket.items = [];
        continue;
      }

      ticket.items = await Promise.all(
        ticket.items.map(async (item: any) => {
          const product = await prisma.product.findUnique({
            where: { id: item.id },
          });

          return { ...item, product };
        })
      );
    }

    return user;
  }


  async CreateTicket(ticket: TicketPayload, businessId: string) {
    const user = await this.VerifyUser(
      ticket.customerPhone,
      ticket.customerName,
      businessId
    );

    if (!user) return;

    // Buscar itens reais no banco
    const products = await Promise.all(
      ticket.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: String(item.id) },
        });

        if (!product) throw new Error(`Produto ID ${item.id} não encontrado`);

        return {
          id: product.id,
          name: product.productName,
          price: product.price,
          quantity: item.quantity,
        };
      })
    );

    // Calcular total com base no preço real do banco
    const total = products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Criar ticket
    const newTicket = await prisma.ticket.create({
      data: {
        user: { connect: { id: user.id } },
        business: { connect: { id: businessId } },
        items: products, // agora contém name, price e quantity corretos
        total,
        status: "pending",
      },
      include: { user: true }
    });

    const port = await this.SearchId(businessId)

    this.SendToAdmin(newTicket, port.id);

    return newTicket;
  }

  async SearchUser(customerPhone: string) {
    return prisma.user.findUnique({
      where: { phone: customerPhone },
      omit: { id: true, businessId: true, createdAt: true, phone: true }
    })
  }

  async SendToAdmin(ticket: any, port: string) {
    socketEmitter.sendToAdmins(port, "admin:new-ticket", ticket);
  }

  async Products(businessId: string) {
    return prisma.product.findMany({
      where: { businessId },
      include: { category: true }
    })
  }

  async Tickets(businessId: string, { page, limit, date, status }) {
    const skip = (page - 1) * limit;

    // Construir filtro de data corretamente
    let dateFilter = {};
    if (date) {
      const [year, month, day] = date.split("-").map(Number);

      const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };
    }


    // Buscar tickets com paginação e filtros
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          businessId,
          ...dateFilter,
          ...(status ? { status } : {})
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              customerName: true
            }
          }
        }
      }),
      // Contar total para paginação
      prisma.ticket.count({
        where: {
          businessId,
          ...dateFilter,
          ...(status ? { status } : {})
        }
      })
    ]);

    return {
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async UpdateTicket(business: any, ticketId: string, status: string) {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId, businessId: business.id },
      data: { status },
      include: { user: true }
    })


    this.SendToClient(ticket, ticket.user.phone, business.port)
    return ticket
  }

  async SendToClient(ticket: any, customerPhone: string, port: string) {
    socketEmitter.sendToClient(port, customerPhone, "client:update-status", ticket);
  }

  async Information(businessId: string) {
    try {
      return await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          settings: true,
          categories: true,
          products: {
            include: {
              category: true,
            },
          },
        },
      });
    } catch (err) {
      console.error("Erro ao buscar informações do negócio:", err);
      return null;
    }
  }

  async SettingsRegister(businessId: string, address: string, availableTimes: string, deliveryFee: string, bannerURL: string) {
    return await prisma.businessSettings.upsert({
      where: { businessId },
      update: {
        data: {
          address,
          availableTimes,
          deliveryFee,
          bannerURL,
        },
      },
      create: {
        businessId,
        data: {
          address,
          availableTimes,
          deliveryFee,
          bannerURL,
        },
      },
    });

  }
}
