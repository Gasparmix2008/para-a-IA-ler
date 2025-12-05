import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default class AdminMiddleware {
    public async User(Request: FastifyRequest, Reply?: unknown) {
        const sessionCookie = Request.cookies.session;
        if (!sessionCookie) return null;

        const { valid, value } = Request.unsignCookie(sessionCookie);
        if (!valid) return null;

        const session = await prisma.session.findUnique({
            where: { uuid: value },
            include: { user: true }
        });

        return session || null;
    }
}
