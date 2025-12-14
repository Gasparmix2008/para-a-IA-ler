// source/sockets/customer.event.ts

import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { BusinessRegistry } from "../core/BusinessRegistry";

const SECRET = process.env.JWT_SECRET || "your-secret-key";

interface CustomerRegisterPayload {
  token: string;
}

interface CustomerNotifyPayload {
  token: string;
  event: string;
  data: any;
}

/**
 * Registra eventos relacionados aos clientes
 */
export function registerCustomerEvents(io: Server, socket: Socket) {
  /**
   * Registra um cliente na empresa
   */
  socket.on("client:register", ({ token }: CustomerRegisterPayload) => {
    try {
      console.log("Tentando registrar cliente com token:", token);
      
      const decoded: any = jwt.verify(token, SECRET);
      console.log("Token decodificado:", decoded);

      const { port, customerPhone } = decoded;

      if (!port || !customerPhone) {
        console.warn("Token inválido para client:register - faltando dados:", { port, customerPhone });
        socket.emit("client:register:error", { 
          message: "Token inválido, faltando dados necessários" 
        });
        return;
      }

      // Registra cliente no BusinessRegistry
      BusinessRegistry.addClient(port, customerPhone, socket.id);

      console.log(`Cliente registrado: ${customerPhone} -> empresa ${port} (socket: ${socket.id})`);

      // Confirma registro
      socket.emit("client:register:success", { 
        port, 
        customerPhone,
        socketId: socket.id 
      });

    } catch (error: any) {
      console.error("Erro ao registrar cliente:", error.message);
      socket.emit("client:register:error", { 
        message: "Token JWT inválido" 
      });
    }
  });

  /**
   * Notifica um cliente específico
   */
  socket.on("client:notify", ({ token, event, data }: CustomerNotifyPayload) => {
    try {
      const decoded: any = jwt.verify(token, SECRET);
      const { port, phone } = decoded;

      if (!port || !phone) {
        console.warn("Token inválido para client:notify - faltando dados");
        return;
      }

      const business = BusinessRegistry.get(port);
      if (!business) {
        console.warn(`client:notify - empresa não encontrada: ${port}`);
        return;
      }

      const clientSocketId = business.clients.get(phone);
      if (clientSocketId) {
        console.log(`Notificando cliente ${phone} com evento: ${event}`);
        io.to(clientSocketId).emit(event, data);
      } else {
        console.warn(`client:notify - socket do cliente não encontrado: ${phone}`);
      }

    } catch (error: any) {
      console.error("Erro ao notificar cliente:", error.message);
    }
  });

  /**
   * Cliente envia mensagem/evento
   */
  socket.on("client:send-message", ({ token, message, data }: any) => {
    try {
      const decoded: any = jwt.verify(token, SECRET);
      const { port, customerPhone } = decoded;

      if (!port || !customerPhone) return;

      console.log(`Mensagem recebida do cliente ${customerPhone}:`, message);

      // Notifica os admins sobre a mensagem do cliente
      const business = BusinessRegistry.get(port);
      if (!business) return;

      for (const adminSocketId of business.admins.keys()) {
        io.to(adminSocketId).emit("admin:client-message", {
          customerPhone,
          message,
          data,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error: any) {
      console.error("Erro ao processar mensagem do cliente:", error.message);
    }
  });

  /**
   * Cliente atualiza status (online/offline, digitando, etc)
   */
  socket.on("client:update-status", ({ token, status }: any) => {
    try {
      const decoded: any = jwt.verify(token, SECRET);
      const { port, customerPhone } = decoded;

      if (!port || !customerPhone) return;

      const business = BusinessRegistry.get(port);
      if (!business) return;

      // Notifica admins sobre mudança de status
      for (const adminSocketId of business.admins.keys()) {
        io.to(adminSocketId).emit("admin:client-status-update", {
          customerPhone,
          status,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error: any) {
      console.error("Erro ao atualizar status do cliente:", error.message);
    }
  });

  /**
   * Requisição de status do cliente
   */
  socket.on("client:get-status", ({ token }: { token: string }) => {
    try {
      const decoded: any = jwt.verify(token, SECRET);
      const { port, customerPhone } = decoded;

      const business = BusinessRegistry.get(port);
      
      if (!business) {
        socket.emit("client:status", { 
          connected: false,
          message: "Empresa não encontrada" 
        });
        return;
      }

      const isConnected = business.clients.has(customerPhone);

      socket.emit("client:status", {
        connected: isConnected,
        port,
        customerPhone
      });

    } catch (error: any) {
      socket.emit("client:status", { 
        connected: false,
        message: "Token inválido" 
      });
    }
  });
}