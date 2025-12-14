// source/sockets/business.event.ts

import { Server, Socket } from "socket.io";
import { BusinessRegistry } from "../core/BusinessRegistry";

interface BusinessBroadcastPayload {
    port: string;
    event: string;
    data: any;
}

interface BusinessTargetPayload {
    port: string;
    target: "admins" | "clients" | "all";
    event: string;
    data: any;
}

/**
 * Registra eventos relacionados ao negócio/empresa como um todo
 */
export function registerBusinessEvents(io: Server, socket: Socket) {
    /**
     * Broadcast geral para toda a empresa (admins + clientes)
     */
    socket.on("business:broadcast", ({ port, event, data }: BusinessBroadcastPayload) => {
        if (!port || !event) {
            console.warn("business:broadcast - parâmetros inválidos");
            return;
        }

        const business = BusinessRegistry.get(port);
        if (!business) {
            console.warn(`business:broadcast - empresa não encontrada: ${port}`);
            return;
        }

        console.log(`Broadcasting para empresa ${port}: ${event}`);

        // Envia para todos os admins
        for (const socketId of business.admins.keys()) {
            io.to(socketId).emit(event, data);
        }

        // Envia para todos os clientes
        for (const socketId of business.clients.values()) {
            io.to(socketId).emit(event, data);
        }
    });

    /**
     * Broadcast direcionado (apenas admins, apenas clientes, ou todos)
     */
    socket.on("business:targeted-broadcast", ({ port, target, event, data }: BusinessTargetPayload) => {
        if (!port || !target || !event) {
            console.warn("business:targeted-broadcast - parâmetros inválidos");
            return;
        }

        const business = BusinessRegistry.get(port);
        if (!business) return;

        console.log(`Targeted broadcast para ${target} na empresa ${port}: ${event}`);

        if (target === "admins" || target === "all") {
            for (const socketId of business.admins.keys()) {
                io.to(socketId).emit(event, data);
            }
        }

        if (target === "clients" || target === "all") {
            for (const socketId of business.clients.values()) {
                io.to(socketId).emit(event, data);
            }
        }
    });

    /**
     * Obtém informações sobre a empresa
     */
    socket.on("business:get-info", ({ port }: { port: string }) => {
        const business = BusinessRegistry.get(port);

        if (!business) {
            socket.emit("business:info", {
                exists: false,
                message: "Empresa não encontrada"
            });
            return;
        }

        // Coleta informações dos admins
        const admins = Array.from(business.admins.entries()).map(([socketId, info]) => ({
            socketId,
            user: info.user,
            connectedAt: info.connectedAt
        }));

        // Coleta informações dos clientes
        const clients = Array.from(business.clients.entries()).map(([phone, socketId]) => ({
            phone,
            socketId
        }));

        socket.emit("business:info", {
            exists: true,
            port,
            admins,
            clients,
            stats: {
                adminsCount: business.admins.size,
                clientsCount: business.clients.size,
                totalConnections: business.admins.size + business.clients.size
            }
        });
    });

    /**
     * Lista todas as empresas registradas (útil para debug/admin)
     */
    socket.on("business:list-all", () => {
        const allBusinesses = BusinessRegistry.listAll();

        const businessList = allBusinesses.map(([port, business]) => ({
            port,
            adminsCount: business.admins.size,
            clientsCount: business.clients.size
        }));

        socket.emit("business:list", {
            businesses: businessList,
            total: businessList.length
        });
    });

    /**
     * Notificação de novo ticket para admins
     */
    socket.on("business:new-ticket", ({ port, ticket }: any) => {
        if (!port || !ticket) return;

        const business = BusinessRegistry.get(port);
        if (!business) return;

        console.log(`Novo ticket na empresa ${port}:`, ticket.id);

        // Notifica todos os admins
        for (const socketId of business.admins.keys()) {
            io.to(socketId).emit("admin:new-ticket", ticket);
        }
    });

    /**
     * Atualização de ticket
     */
    socket.on("business:ticket-update", ({ port, ticket, customerPhone }: any) => {
        if (!port || !ticket) return;

        const business = BusinessRegistry.get(port);
        if (!business) return;

        console.log(`Atualização de ticket na empresa ${port}:`, ticket.id);

        // Notifica admins
        for (const socketId of business.admins.keys()) {
            io.to(socketId).emit("admin:ticket-update", ticket);
        }

        // Notifica o cliente específico se houver
        if (customerPhone) {
            const clientSocketId = business.clients.get(customerPhone);
            if (clientSocketId) {
                io.to(clientSocketId).emit("client:update-status", ticket);
            }
        }
    });

    /**
     * Ping/healthcheck da empresa
     */
    socket.on("business:ping", ({ port }: { port: string }) => {
        const business = BusinessRegistry.get(port);

        socket.emit("business:pong", {
            port,
            exists: !!business,
            timestamp: new Date().toISOString()
        });
    });
}