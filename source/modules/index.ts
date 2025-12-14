// source/modules/index.ts
import { FastifyPluginAsync } from "fastify";
import admin from "./admin";

const modules: FastifyPluginAsync = async (fastify) => {
    fastify.register(admin, { prefix: "/admin" });

    // registrar outros módulos aqui
    // podemos chamar com -> /api/products, /api/business, /api/customer, etc.
};


export default modules;