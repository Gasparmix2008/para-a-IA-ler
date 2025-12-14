import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { FastifyInstance } from "fastify";

export async function registerSecurity(fastify: FastifyInstance) {
  await fastify.register(cors);
  await fastify.register(helmet);
}
