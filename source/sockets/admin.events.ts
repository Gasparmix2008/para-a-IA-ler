// source/sockets/admin.event.ts

import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { BusinessRegistry } from "../core/BusinessRegistry";

const SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AdminRegisterPayload {
    token: string;
}

interface AdminEventPayload {
    port: string;
    event: string;
    type: string;
    data: any;
}

/**
 * Registra eventos relacionados aos administradores
 */
export function registerAdminEvents(io: Server, socket: Socket) {
    /**
     * Registra um administrador na empresa
     */
    socket.on("admin:register", ({ token }: AdminRegisterPayload) => {
        try {
            const decoded: any = jwt.verify(token, SECRET);
            const { port, email } = decoded;

            if (!port || !email) {
                console.warn("Token inválido para admin:register - faltando dados:", { port, email });
                socket.emit("admin:register:error", {
                    message: "Token inválido, faltando dados necessários"
                });
                return;
            }

            // Registra admin no BusinessRegistry
            BusinessRegistry.addAdmin(port, socket.id, { user: email });

            console.log(`Admin registrado: ${email} -> empresa ${port} (socket: ${socket.id})`);

            // Confirma registro
            socket.emit("admin:register:success", {
                port,
                email,
                socketId: socket.id
            });

        } catch (error: any) {
            console.error("Erro ao registrar admin:", error.message);
            socket.emit("admin:register:error", {
                message: "Token JWT inválido"
            });
        }
    });

    /**
     * Envia evento para todos os admins da empresa
     */
    socket.on("admin:event", ({ port, type, data }: AdminEventPayload) => {
        if (!port || !type) {
            console.warn("admin:event - parâmetros inválidos:", { port, type });
            return;
        }

        const business = BusinessRegistry.get(port);
        if (!business) {
            console.warn(`admin:event - empresa não encontrada: ${port}`);
            return;
        }

        console.log(`Broadcasting admin event: ${type} para empresa ${port}`);

        // Envia para todos os admins da empresa
        for (const socketId of business.admins.keys()) {
            io.to(socketId).emit(type, data);
        }
    });

    /**
     * Broadcast para todos os admins
     */
    socket.on("admin:broadcast", ({ port, event, data }: AdminEventPayload) => {
        if (!port || !event) {
            console.warn("admin:broadcast - parâmetros inválidos");
            return;
        }

        const business = BusinessRegistry.get(port);
        if (!business) return;

        for (const socketId of business.admins.keys()) {
            io.to(socketId).emit(event, data);
        }
    });

    /**
     * Requisição de status/informações da empresa
     */
    socket.on("admin:get-status", ({ port }: { port: string }) => {
        const business = BusinessRegistry.get(port);

        if (!business) {
            socket.emit("admin:status", {
                connected: false,
                message: "Empresa não encontrada"
            });
            return;
        }

        socket.emit("admin:status", {
            connected: true,
            port,
            adminsCount: business.admins.size,
            clientsCount: business.clients.size
        });
    });
}