// plugins/routes-list.ts
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import ejs from "ejs";
import path from "path";
import { AuthMiddlewareAdminVerifyTrue } from "../middlewares/AdminForServerVerify";

export default fp(async (app: FastifyInstance) => {
  const routes: { method: string; url: string }[] = [];

  app.addHook("onRoute", (route) => {
    const methods = Array.isArray(route.method) ? route.method : [route.method];

    for (const method of methods) {
      if (method !== "HEAD") {
        routes.push({ method, url: route.path });
      }
    }
  });

  app.get("/help", { preHandler: AuthMiddlewareAdminVerifyTrue }, async (_, reply) => {
    const file = path.join(process.cwd(), "src/views", "routes.ejs");
    const html = await ejs.renderFile(file, { routes });

    reply.type("text/html").send(html);
  });
});
