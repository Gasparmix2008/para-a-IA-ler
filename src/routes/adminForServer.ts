// src/routes/client.ts
import { FastifyInstance } from "fastify";
import { ApiReply, Status } from "../controllers/APIReply";
import AdminForServerController from "../controllers/AdminForServer";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { FastifyRequest, FastifyReply } from "fastify";
import AdminMiddleware from "../controllers/AdminMiddwares";
import { AdminForServerLoggedTrue, AdminForServerLoggedFalse } from "../middlewares/AdminForServerLogged"
import { AuthMiddlewareAdminVerifyFalse } from "../middlewares/AdminForServerVerify";
const prisma = new PrismaClient();

import ejs from "ejs";
import path from "path";

interface adminForServer {
    adminname: string;
    email: string;
    password: string;
}

const codeUsed: any = []

export default async function (app: FastifyInstance) {
    app.get("/register", { preHandler: AdminForServerLoggedFalse }, async (Request: FastifyRequest, Reply: FastifyReply) => {
        const file = path.join(process.cwd(), "src/views", "registerAdminForServer.ejs");
        const html = await ejs.renderFile(file);
        Reply.type("text/html").send(html);
    });

    app.post("/register/auth", { preHandler: AdminForServerLoggedFalse }, async (Request, Reply) => {
        const { adminname, email, password } = Request.body as adminForServer;

        if (!password) return Reply.redirect("/admin/server/register");

        const user = await new AdminForServerController().Create(Request, Reply, adminname, email, password);
        const sessionActive = await new AdminMiddleware().User(Request, Reply)
        if (sessionActive) return Reply.redirect("/business/servers/list");


        // ⭐ cria uuid de sessão no banco
        const session = await prisma.session.create({
            data: {
                uuid: randomUUID(),
                userId: user.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
            }
        });


        // ⭐ salva uuid da sessão no cookie
        Reply.setCookie("session", session.uuid, {
            path: "/",
            maxAge: 60 * 60, // 1h
            httpOnly: true,
            secure: false, // true apenas em HTTPS
            sameSite: "lax",
            signed: true
        });

        return Reply.redirect("/server/admin/verify");
    });

    app.get("/login", { preHandler: AdminForServerLoggedTrue }, async (Request, Reply) => {
        const file = path.join(process.cwd(), "src/views", "loginAdminForServer.ejs");
        const html = await ejs.renderFile(file);
        Reply.type("text/html").send(html);
    });

    app.post("/login/auth", { preHandler: AdminForServerLoggedTrue }, async (Request, Reply) => {
        const { email, password } = Request.body as { email: string, password: string } 
        const user = await new AdminForServerController().Login(email, password)
        if (!user) return Reply.redirect("/server/admin/register")
        // ⭐ cria uuid de sessão no banco
        const session = await prisma.session.create({
            data: {
                uuid: randomUUID(),
                userId: user.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
            }
        });

        // ⭐ salva uuid da sessão no cookie
        Reply.setCookie("session", session.uuid, {
            path: "/",
            maxAge: 60 * 60, // 1h
            httpOnly: true,
            secure: false, // true apenas em HTTPS
            sameSite: "lax",
            signed: true
        });

        return user ? Reply.redirect("/business/servers/list") : Reply.redirect("/server/admin/register")
    });

    app.get("/verify", { preHandler: AuthMiddlewareAdminVerifyFalse }, async (Request, Reply) => {
        const file = path.join(process.cwd(), "src/views", "verifyAdminForServer.ejs");
        const html = await ejs.renderFile(file);
        Reply.type("text/html").send(html);
    })

    app.post("/verify/auth", { preHandler: AuthMiddlewareAdminVerifyFalse }, async (Request: FastifyRequest, Reply: FastifyReply) => {
        const session = (await new AdminMiddleware().User(Request, Reply))
        const { code } = Request.body as { code: string };
        if (!session || !code) return Reply.redirect("/server/admin/verifya");
        const user = session.user


        // verifica se o código já foi usado antes
        if (codeUsed.includes(code)) {
            return Reply.redirect("/server/admin/verifyb");
        }

        const isValid = await new AdminForServerController().Verify(user.id, code);

        if (!isValid) {
            return Reply.redirect("/server/admin/verifyc");
        }

        // marca o código como usado
        codeUsed.push(code);

        return Reply.redirect("/business/servers/list");
    });

}
