// source/plugins/prisma.ts
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";


declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}

export default fp(async (fastify, opts) => {
    const prisma = new PrismaClient();
    await prisma.$connect();


    fastify.decorate("prisma", prisma);


    fastify.addHook("onClose", async () => {
        await prisma.$disconnect();
    });
});