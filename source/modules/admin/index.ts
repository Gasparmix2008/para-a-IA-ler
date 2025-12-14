// source/modules/products/index.ts
import { FastifyPluginAsync } from "fastify";
import routes from "./admin.routes";


const admin: FastifyPluginAsync = async (fastify) => {
    fastify.register(routes, { prefix: "/" });
};


export default admin;