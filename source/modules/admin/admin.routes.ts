import { FastifyPluginAsync } from "fastify";
import { HttpResponse } from "../../core/http/response";
import { authGuard } from "../../core/auth/auth.guard";
import { RouteGuardService } from "../../core/auth/abac-rbac/route-guard.service";
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
            const { email, password, rememberMe, location } = request.body as {
                email: string;
                password: string;
                rememberMe: boolean,
                location: {
                    city: string;
                    region: string;
                    country: string;
                } | null,
            };
            const userAgent = request.headers['user-agent']
            const ip = request.ip

            const data = await authService.login(email, password, rememberMe, location, userAgent, ip)

            console.log(data)

            if (typeof data === "string") {
                return reply.send(HttpResponse.unauthorized(data));
            }

            return reply.send(HttpResponse.ok(data));
        }
    );

    //LOGOUT
    fastify.get("/logout", async (request) => {
        return await authService.logout(request)
    })

    // ME
    fastify.get(
        "/me",
        { preHandler: authGuard },
        async (request, reply) => {
            if (request.admin?.id == undefined) {
                return reply.send(HttpResponse.unauthorized("Unauthorized"));
            }

            const data = await adminController.adminById(request.admin?.id)
            return reply.send(HttpResponse.ok(data));
        }
    );

    // ✨ NOVA ROTA: Verifica se pode acessar uma rota
    fastify.post(
        "/check-route",
        { preHandler: authGuard },
        async (request, reply) => {
            if (!request.admin) {
                return reply.send(HttpResponse.unauthorized("Unauthorized"));
            }

            const { pathname } = request.body as { pathname: string };

            if (!pathname) {
                return reply.send(HttpResponse.badRequest("pathname is required"));
            }

            // Verifica se tem permissão para acessar a rota
            const canAccess = RouteGuardService.canAccessRoute(
                pathname,
                request.admin.role.permissions,
                request.admin.type === "SERVER"
            );

            return reply.send(
                HttpResponse.ok({
                    canAccess,
                    pathname
                })
            );
        }
    );
};

export default routes;