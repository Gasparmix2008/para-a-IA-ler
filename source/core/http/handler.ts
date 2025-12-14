// core/http/handler/errorHandler.ts
import { FastifyInstance } from "fastify";
import { HttpError } from "./error";

export function registerErrorHandler(app: FastifyInstance) {
    app.setErrorHandler((error, _, reply) => {
        if (error instanceof HttpError) {
            return reply.status(error.statusCode).send({
                status: "error",
                message: error.message,
            });
        }

        console.error("Erro interno:", error);

        return reply.status(500).send({
            status: "error",
            message: "Erro interno no servidor",
        });
    });
}
