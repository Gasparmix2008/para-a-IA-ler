// src/routes/client.ts
import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { AuthMiddlewareAdminVerifyTrue } from "../middlewares/AdminForServerVerify";
import BusinessController from "../controllers/Business";
import { ServerController, runningSites } from "../controllers/Servers";
import Machine from "../controllers/Machine";
import { getCpuHistory, updateMonitor } from "../monitor/ProcessMonitor";
import ejs from "ejs";
import path from "path";

setInterval(updateMonitor, 5000);


// ⬇️ EXPORTAR FUNÇÕES AQUI

export default async function (app: FastifyInstance) {

    app.get("/list", { preHandler: AuthMiddlewareAdminVerifyTrue }, async (Request, Reply) => {
        const Many = await new BusinessController().Many()
        const file = path.join(process.cwd(), "src/views", "listServer.ejs");
        const html = await ejs.renderFile(file, { Many, runningSites, domain: await new Machine().getAutoHost() });

        Reply.type("text/html").send(html);
    })

    app.get("/open/:port", { preHandler: AuthMiddlewareAdminVerifyTrue }, async (Request, Reply) => {
        const { port } = Request.params as { port: number }
        const ip = await new Machine().getAutoHost()
        const business = await new BusinessController().SearchPort(port)
        if (business == null) return Reply.redirect("/business/servers/list")
        const { linkDynamic } = await new ServerController().startSite(business.businessName, ip, business.port) as { linkDynamic: string }



        Reply.redirect(linkDynamic || "/business/servers/list")

    })

    app.get("/stop/:port", { preHandler: AuthMiddlewareAdminVerifyTrue }, async (Request, Reply) => {
        // tipando params
        const params = Request.params as { port: string };
        const port = Number(params.port); // converter para number

        new ServerController().stopSite(port);
        Reply.redirect("/business/servers/list")
    })

    app.get("/stop/all", { preHandler: AuthMiddlewareAdminVerifyTrue }, async (Request, Reply) => {
        new ServerController().stopAllSites();
        Reply.redirect("/business/servers/list")
    })

    app.get("/getUsage", { preHandler: AuthMiddlewareAdminVerifyTrue }, async (Request, Reply) => {
        const result = runningSites.map(site => ({
            businessName: site.businessName,
            port: site.port,
            cpu: site.cpu ?? 0,
            ram: site.ram ?? 0,
            cpuHistory: getCpuHistory(site.port),
        }));
        Reply.send(result);
    })
}