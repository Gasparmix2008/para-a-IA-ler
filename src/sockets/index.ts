import adminSocket from "./adminSocket";
import clientSocket from "./clientSocket";
import { BusinessRegistry } from "../core/BusinessRegistry";

export default function registerSocketHandlers(io: any) {
  io.on("connection", (socket: any) => {
    console.log("Socket conectado:", socket.id);

    adminSocket(io, socket);
    clientSocket(io, socket);

    socket.on("disconnect", () => {
      BusinessRegistry.remove(socket.id);
      console.log("Socket desconectado:", socket.id);
    });
  });
}
