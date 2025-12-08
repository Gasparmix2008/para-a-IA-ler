import jwt from "jsonwebtoken";
import BusinessRegistry from "../core/BusinessRegistry";

const SECRET = process.env.JWT_SECRET;

export default function adminSocket(io: any, socket: any) {
  socket.on("admin:register", ({ token }) => {
    try {
      const decoded: any = jwt.verify(token, SECRET);

      const { port, email } = decoded;
      if (!port || !email) {
        console.log("Token inválido, faltando dados.");
        return;
      }

      // Registra admin no BusinessRegistry
      BusinessRegistry.addAdmin(port, socket.id, { user: email });
    } catch (error) {
      console.log("JWT inválido:", error.message);
    }
  });

  socket.on("admin:event", ({ port, type, data }) => {
    const business = BusinessRegistry.get(port);
    if (!business) return;

    for (const socketId of business.admins.values()) {
      io.to(socketId).emit(type, data);
    }
  });
}
