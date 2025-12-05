import jwt from "jsonwebtoken";
import BusinessRegistry from "../core/BusinessRegistry";

const SECRET = process.env.JWT_SECRET;

export default function clientSocket(io: any, socket: any) {
  // Registrar cliente usando JWT
  socket.on("client:register", ({ token }) => {
    try {
      console.log(token)
      const decoded: any = jwt.verify(token, SECRET);
      console.log(decoded)
      const { port, customerPhone } = decoded;
      if (!port || !customerPhone) {
        console.log("Token inválido para client:register");
        return;
      }

      BusinessRegistry.addClient(port, customerPhone, socket.id);

      console.log(`Cliente registrado: ${customerPhone} -> empresa ${port}`);

    } catch (err) {
      console.log("JWT inválido no client:register:", err.message);
    }
  });

  // Notificar cliente
  socket.on("client:notify", ({ token, event, data }) => {
    try {
      const decoded: any = jwt.verify(token, SECRET);

      const { port, phone } = decoded;
      if (!port || !phone) {
        console.log("Token inválido para client:notify");
        return;
      }

      const business = BusinessRegistry.get(port);
      if (!business) return;

      const clientSocket = business.clients.get(phone);
      if (clientSocket) {
        io.to(clientSocket).emit(event, data);
      }

    } catch (err) {
      console.log("JWT inválido no client:notify:", err.message);
    }
  });
}
