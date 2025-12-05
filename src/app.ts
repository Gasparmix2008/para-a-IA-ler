// app.ts
import fastify from "fastify";
import fastifyFormbody from "@fastify/formbody";
import fastifyCookie from "@fastify/cookie";
import fastifyIO from "fastify-socket.io";

import CryptographyController from "./controllers/Cryptography";
import { AdminForServer } from "@prisma/client";
import registerSocketHandlers from "./sockets";
import SocketEmitterController from "./controllers/SocketEmitterController";

// IMPORTS DAS ROTAS - SÍNCRONOS
import routeInspector from "./plugins/route-inspector";
import client from "./routes/client";
import adminForServer from "./routes/adminForServer";
import business from "./routes/business";
import adminForBusiness from "./routes/adminForBusiness";
import servers from "./routes/servers";

let socketEmitter: SocketEmitterController;

// FUNCTIONS
function generateLetters() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

function generateNumber() {
  const numbers = "123456789";
  return numbers[Math.floor(Math.random() * numbers.length)];
}

function generateCodeSecret(amount: number) {
  let result = "";
  for (let i = 0; i < amount; i++) {
    result += Math.random() < 0.5 ? generateLetters() : generateNumber();
  }
  return result;
}

export const codeSecret = generateCodeSecret(9);

// EXTEND FASTIFY TYPES
declare module "fastify" {
  interface FastifyRequest {
    user?: AdminForServer;
  }
}

// CREATE INSTANCE - Apenas UMA vez
const app = fastify();

// REGISTER PLUGINS
app.register(fastifyFormbody);

app.register(fastifyIO, {
  cors: { 
    origin: ["*"],
    credentials: true 
  }
});

app.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || "SUPER HIPER MEGA CHAVE SECRETA FODAAAA",
});

// ROUTES
app.get("/", (_, reply) => reply.redirect("/server/admin/login"));

app.register(routeInspector);
app.register(client, { prefix: "/client" });
app.register(adminForServer, { prefix: "/server/admin" });
app.register(business, { prefix: "/business" });
app.register(adminForBusiness, { prefix: "/business/admin" });
app.register(servers, { prefix: "/business/servers" });

// SOCKET HANDLERS - Registra APÓS plugins
app.after(() => {
  if (app.io) {
    registerSocketHandlers(app.io);
    socketEmitter = new SocketEmitterController(app.io);
    console.log("✅ Socket.IO handlers registrados");
  } else {
    console.error("❌ app.io não está disponível!");
  }
});

// EXPORT
export default app;
export { socketEmitter };