// source/plugins/socketio.ts

import fp from "fastify-plugin";
import { Server as SocketIOServer } from "socket.io";
import { FastifyInstance } from "fastify";

declare module "fastify" {
    interface FastifyInstance {
        io: SocketIOServer;
    }
}

async function socketioPlugin(fastify: FastifyInstance) {
    // Cria instância do Socket.IO
    const io = new SocketIOServer(fastify.server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ["websocket", "polling"],
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Decora a instância do Fastify com io
    fastify.decorate("io", io);

    // Log quando o plugin for registrado
    fastify.log.info("Socket.IO plugin registrado");

    // Cleanup ao desligar
    fastify.addHook("onClose", async (instance) => {
        instance.log.info("Fechando conexões Socket.IO...");
        io.close();
    });
}

export default fp(socketioPlugin, {
    name: "socketio"
});