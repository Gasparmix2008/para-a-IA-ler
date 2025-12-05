import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
import AdminMiddleware from "../controllers/AdminMiddwares";
const prisma = new PrismaClient();


export async function AuthMiddlewareAdminVerifyTrue(Request: FastifyRequest, Reply: FastifyReply) {
    // busca o usuário | existe cookies de login
    const session = await new AdminMiddleware().User(Request, Reply)
    // extrai usuário
    const user = session?.user;
    if (!user) return Reply.redirect("/server/admin/login");

    // se usuário logado, mas verificado
    if (!user.verify) return Reply.redirect("/server/admin/verify");

    // usuário passou em todas as verificações → permite continuar
}

export async function AuthMiddlewareAdminVerifyFalse(Request: FastifyRequest, Reply: FastifyReply) {
    // busca o usuário | existe cookies de login
    const session = await new AdminMiddleware().User(Request, Reply)
    // extrai usuário
    const user = session?.user;
    if (!user) return Reply.redirect("/server/admin/login");

    // se usuário logado, mas NÃO verificado
    if (user.verify) return Reply.redirect("/business/servers/list");

    // usuário passou em todas as verificações → permite continuar
}
