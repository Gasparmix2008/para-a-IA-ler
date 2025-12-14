// source/sockets/index.ts

import { Server, Socket } from "socket.io";
import { BusinessRegistry } from "../core/BusinessRegistry";
import { registerAdminEvents } from "./admin.events";
import { registerCustomerEvents } from "./customer.events";
import { registerBusinessEvents } from "./business.events";

export class SocketEmitter {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Envia evento para todos os admins de uma empresa
   */
  sendToAdmins(port: string, event: string, data: any) {
    const key = String(port ?? '').trim();
    console.log('Trying to get business for port:', JSON.stringify(port));
    const business = BusinessRegistry.get(key);
    console.log('Business found?', !!business);
    
    if (!business) {
      console.warn(`[sendToAdmins] business not found for port="${key}" — admins not notified`, { event, data });
      return;
    }

    for (const socketId of business.admins.keys()) {
      console.log('[emit]', event, '->', socketId);
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Envia evento para um cliente específico
   */
  sendToClient(port: string, phone: string, event: string, data: any) {
    const business = BusinessRegistry.get(port);
    if (!business) {
      console.warn(`[sendToClient] business not found for port="${port}"`);
      return;
    }

    const socketId = business.clients.get(phone);
    if (socketId) {
      console.log('[emit]', event, '->', socketId, `(client: ${phone})`);
      this.io.to(socketId).emit(event, data);
    } else {
      console.warn(`[sendToClient] client socket not found for phone="${phone}"`);
    }
  }

  /**
   * Broadcast para todos os sockets de uma empresa
   */
  broadcastToBusiness(port: string, event: string, data: any) {
    const business = BusinessRegistry.get(port);
    if (!business) return;

    // Envia para todos os admins
    for (const socketId of business.admins.keys()) {
      this.io.to(socketId).emit(event, data);
    }

    // Envia para todos os clientes
    for (const socketId of business.clients.values()) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

export let socketEmitter: SocketEmitter;

/**
 * Inicializa o sistema de Socket.IO
 */
export function initializeSocket(io: Server) {
  socketEmitter = new SocketEmitter(io);

  io.on("connection", (socket: Socket) => {
    console.log("Socket conectado:", socket.id);

    // Registra todos os eventos
    registerAdminEvents(io, socket);
    registerCustomerEvents(io, socket);
    registerBusinessEvents(io, socket);

    // Handler de desconexão
    socket.on("disconnect", () => {
      BusinessRegistry.remove(socket.id);
      console.log("Socket desconectado:", socket.id);
    });
  });

  console.log("Sistema de Socket.IO inicializado");
  return socketEmitter;
}