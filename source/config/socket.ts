import { Server } from "socket.io";
import { FastifyInstance } from "fastify";

export function socketConfig(fastify: FastifyInstance) {
  const io = new Server(fastify.server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("Socket conectado:", socket.id);
  });

  return io;
}
