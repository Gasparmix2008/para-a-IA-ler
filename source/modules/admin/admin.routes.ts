import { FastifyPluginAsync } from "fastify";
import { HttpResponse } from "../../core/http/response";
import { authGuard } from "../../core/auth/auth.guard";
const AdminController = await import("./admin.controller");
const AuthService = await import("../../core/auth/auth.service");

const routes: FastifyPluginAsync = async (fastify) => {
    const adminController = new AdminController.default();
    const authService = new AuthService.default()

    // =====================================================
    // 📦 ROTAS
    // =====================================================

    // LOGIN
    fastify.post(
        "/login",
        async (request, reply) => {
            const { email, password, rememberMe } = request.body as { email: string; password: string, rememberMe: boolean };
            const userAgent = request.headers['user-agent']
            const ip = request.ip

            const data = await authService.login(email, password, rememberMe, userAgent, ip)

            console.log(data)

            if (typeof data === "string") {
                return reply.send(HttpResponse.unauthorized(data));
            }

            return reply.send(HttpResponse.ok(data));
        }
    );

    // CREATE

    // ME
    fastify.get("/me", { preHandler: authGuard }, async (request, reply) => {
        if (request.admin?.id == undefined)
            return "Unauthorized";
        const data = await adminController.adminById(request.admin?.id)
        return data;
    })
};

export default routes;