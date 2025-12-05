import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
import AdminMiddleware from "../controllers/AdminMiddwares";
const prisma = new PrismaClient();


export async function AdminForServerLoggedTrue(Request: FastifyRequest, Reply: FastifyReply) {
  const session = await new AdminMiddleware().User(Request);

  if (session) {
    return Reply.redirect("/business/servers/list"); // página do painel
  }
  // se não está logado → segue
}

export async function AdminForServerLoggedFalse(Request: FastifyRequest, Reply: FastifyReply) {
  const session = await new AdminMiddleware().User(Request);

  if (!session) {
    return Reply.redirect("/business/servers/list"); // página do painel
  }
  
  // se está logado → segue
}