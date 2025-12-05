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

  async VerifyUser(phone: string, customerName: string, businessId: string) {
    let user = await prisma.user.findUnique({
      where: { phone },
      include: {
        tickets: {
          where: { businessId },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          customerName,
          businessId
        },
        include: {
          tickets: {
            where: { businessId }
          }
        }
      });
    }

    for (const ticket of user.tickets) {
      if (!Array.isArray(ticket.items)) {
        ticket.items = []; // garante array
        continue;
      }

      ticket.items = await Promise.all(
        ticket.items.map(async (item: any) => {
          const product = await prisma.product.findUnique({
            where: { id: item.id }
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

  async SendToAdmin(ticket: any, port: string) {
    socketEmitter.sendToAdmins(port, "admin:new-ticket", ticket);
  }

  async Products(businessId: string) {
    return prisma.product.findMany({
      where: { businessId },
      include: { category: true }
    })
  }

  async Tickets(businessId: string) {
    return prisma.ticket.findMany({
      where: { businessId },
      include: { 
        user: true
      }
    })
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
