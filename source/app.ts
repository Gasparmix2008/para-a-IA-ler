// source/app.ts
// Usa a instância criada no config/fastify.ts
import { createFastifyInstance } from "./config/fastify";

import fastifyCors from "@fastify/cors";
import cookie from '@fastify/cookie'

// Plugins internos
import prismaPlugin from "./plugins/prisma";
/* import rbacPlugin from "./plugins/rbac"; */
import socketioPlugin from "./plugins/socketio";
import multipart from "./plugins/multipart";

// Módulos principais da aplicação (rotas)
import modules from "./modules";

// =====================================================
// INICIALIZAÇÃO DO SOCKETS
// =====================================================
import { initializeSocket, socketEmitter } from "./sockets";

// =====================================================
// 🚀 Instância principal do Fastify
// =====================================================
const app = createFastifyInstance(); // logger já vem daqui

// =====================================================
// TRATAMENTO GLOBAL DE ERROS
// =====================================================
import { registerErrorHandler } from "./core/http/handler";
registerErrorHandler(app);

// ======================================================
// 🔐 Configurações Globais
// ======================================================

// Libera CORS (frontend → backend)
app.register(fastifyCors, {
  origin: "*", // frontend
});

// Registra o Prisma Client (singleton)
app.register(prismaPlugin);

// Integra Socket.IO ao Fastify
app.register(socketioPlugin);

// Suporte a multipart/form-data (upload de arquivos)
app.register(multipart);

// FastifyCookies
app.register(cookie, {
  hook: "onRequest",
})

// =====================================================
// 🔌 Inicializa Sistema de Sockets após registro do plugin
// =====================================================
app.ready().then(() => {
  if (app.io) {
    initializeSocket(app.io);
    app.log.info("Sistema de Socket.IO inicializado com sucesso");
  } else {
    app.log.warn("Socket.IO não foi encontrado - verifique o plugin socketio");
  }
});

// =====================================================
// 📦 Registro dos módulos (todas as rotas da API)
// =====================================================
app.register(modules, { prefix: "/api" });

// =====================================================
// 🏭 Criar empresa automaticamente (somente DEV)
// =====================================================
/* import { BusinessController } from "./modules/business/business.controller";
new BusinessController().create("Starbucks") */


// =====================================================
// 🩺 Rota básica de health check
// =====================================================
app.get("/ping", async () => ({ status: "pong" }));
app.get('/test-ip', async (request) => {
  return {
    ip: request.ip,
    headers: request.headers
  }
})

// =====================================================
// 📤 Exporta a instância e o socketEmitter para uso global
// =====================================================
export { socketEmitter };
export default app;