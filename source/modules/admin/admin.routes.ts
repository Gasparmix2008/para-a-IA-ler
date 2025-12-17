// ===============================================
// admin.routes.ts
// ===============================================

import { FastifyPluginAsync } from "fastify";
import { HttpResponse } from "../../core/http/response";
import { authGuard } from "../../core/auth/auth.guard";
import { RouteGuardService } from "../../core/auth/abac-rbac/route-guard.service";
import { MenuService } from "../../config/frontend/menu/menu.service";

const AdminController = await import("./admin.controller");
const AuthService = await import("../../core/auth/auth.service");

// ===============================================
// TYPES
// ===============================================

interface LoginBody {
    email: string;
    password: string;
    rememberMe?: boolean;
    location?: {
        city: string;
        region: string;
        country: string;
    } | null;
}

interface CheckRouteBody {
    pathname: string;
}

// ===============================================
// ROUTES
// ===============================================

const routes: FastifyPluginAsync = async (fastify) => {
    const adminController = new AdminController.default();
    const authService = new AuthService.default();

    // =====================================================
    // 🔓 PUBLIC ROUTES
    // =====================================================

    /**
     * POST /api/admin/login
     * Login com menu dinâmico e validações
     */
    fastify.post("/login", async (request, reply) => {
        try {
            const body = request.body as LoginBody;
            const { email, password, rememberMe = false, location = null } = body;

            // Validações básicas
            if (!email || !password) {
                return reply.send(
                    HttpResponse.badRequest("Email e senha são obrigatórios")
                );
            }

            // Info da requisição
            const userAgent = request.headers["user-agent"] || "unknown";
            const ip = request.ip;

            // Login
            const result = await authService.login(
                email,
                password,
                rememberMe,
                location,
                userAgent,
                ip
            );

            // Se retornou erro
            if ("error" in result) {
                return reply.send(HttpResponse.unauthorized(result.error));
            }

            // Sucesso - retorna com menu já filtrado
            return reply.send(HttpResponse.ok(result));
        } catch (error) {
            console.error("Login error:", error);
            return reply.send(
                HttpResponse.internalServerError("Erro ao realizar login")
            );
        }
    });

    // =====================================================
    // 🔒 PROTECTED ROUTES
    // =====================================================

    /**
     * GET /api/admin/logout
     * Logout com invalidação de sessão
     */
    fastify.get(
        "/logout",
        { preHandler: authGuard },
        async (request, reply) => {
            try {
                const result = await authService.logout(request);
                return reply.send(result);
            } catch (error) {
                console.error("Logout error:", error);
                return reply.send(
                    HttpResponse.internalServerError("Erro ao fazer logout")
                );
            }
        }
    );

    /**
     * GET /api/admin/me
     * Retorna dados do admin autenticado com menu
     */
    fastify.get(
        "/me",
        { preHandler: authGuard },
        async (request, reply) => {
            try {
                if (!request.admin?.id) {
                    return reply.send(HttpResponse.unauthorized("Não autenticado"));
                }

                // Busca dados completos do admin
                const admin = await adminController.adminById(request.admin.id);

                if (!admin) {
                    return reply.send(HttpResponse.notFound("Admin não encontrado"));
                }

                // Gera menu dinâmico baseado nas permissions
                const isServerAdmin = request.admin.type === "SERVER";
                const menu = MenuService.buildMenu(
                    admin.role.permissions,
                    isServerAdmin,
                    true // debug: false em produção
                );

                // Retorna dados + menu
                return reply.send(
                    HttpResponse.ok({
                        id: admin.id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role.name,
                        permissions: admin.role.permissions,
                        menu
                    })
                );
            } catch (error) {
                console.error("Me error:", error);
                return reply.send(
                    HttpResponse.internalServerError("Erro ao buscar dados")
                );
            }
        }
    );

    /**
     * POST /api/admin/check-route
     * Verifica se admin pode acessar uma rota específica
     * Usado pelo middleware do Next.js
     */
    fastify.post(
        "/check-route",
        { preHandler: authGuard },
        async (request, reply) => {
            try {
                if (!request.admin) {
                    return reply.send(HttpResponse.unauthorized("Não autenticado"));
                }

                const body = request.body as CheckRouteBody;
                const { pathname } = body;

                if (!pathname) {
                    return reply.send(
                        HttpResponse.badRequest("pathname é obrigatório")
                    );
                }

                // Debug em desenvolvimento
                const isDevMode = process.env.NODE_ENV === "development";

                if (isDevMode) {
                    console.log("\n🔍 CHECK ROUTE DEBUG:");
                    console.log("- Admin:", request.admin.email);
                    console.log("- Type:", request.admin.type);
                    console.log("- Pathname:", pathname);
                    console.log("- Permissions:", request.admin.role.permissions.length);
                }

                // Verifica se tem permissão para acessar a rota
                const isServerAdmin = request.admin.type === "SERVER";
                const canAccess = RouteGuardService.canAccessRoute(
                    pathname,
                    request.admin.role.permissions,
                    isServerAdmin,
                    isDevMode // debug apenas em dev
                );

                if (isDevMode) {
                    console.log("- Result:", canAccess ? "✅ ALLOWED" : "❌ DENIED");
                }

                // Se não tem acesso, retorna 403
                if (!canAccess) {
                    return reply.send(
                        HttpResponse.forbidden(
                            `Você não tem permissão para acessar ${pathname}`
                        )
                    );
                }

                // Sucesso
                return reply.send(
                    HttpResponse.ok({
                        canAccess: true,
                        pathname,
                        admin: {
                            name: request.admin.name,
                            email: request.admin.email
                        }
                    })
                );
            } catch (error) {
                console.error("Check route error:", error);
                return reply.send(
                    HttpResponse.internalServerError("Erro ao verificar rota")
                );
            }
        }
    );

    /**
     * GET /api/admin/menu
     * Retorna apenas o menu filtrado (útil para refresh)
     */
    fastify.get(
        "/menu",
        { preHandler: authGuard },
        async (request, reply) => {
            try {
                if (!request.admin) {
                    return reply.send(HttpResponse.unauthorized("Não autenticado"));
                }

                const isServerAdmin = request.admin.type === "SERVER";
                const menu = MenuService.buildMenu(
                    request.admin.role.permissions,
                    isServerAdmin,
                    false
                );

                return reply.send(HttpResponse.ok({ menu }));
            } catch (error) {
                console.error("Menu error:", error);
                return reply.send(
                    HttpResponse.internalServerError("Erro ao buscar menu")
                );
            }
        }
    );

    /**
     * GET /api/admin/permissions
     * Lista todas as permissions do admin (útil para debug)
     */
    fastify.get(
        "/permissions",
        { preHandler: authGuard },
        async (request, reply) => {
            try {
                if (!request.admin) {
                    return reply.send(HttpResponse.unauthorized("Não autenticado"));
                }

                // Agrupa permissions por resource
                const grouped = request.admin.role.permissions.reduce((acc, p) => {
                    if (!acc[p.resource]) {
                        acc[p.resource] = [];
                    }
                    acc[p.resource].push(p.action);
                    return acc;
                }, {} as Record<string, string[]>);

                return reply.send(
                    HttpResponse.ok({
                        role: request.admin.role.name || "N/A",
                        isServerAdmin: request.admin.type === "SERVER",
                        permissions: request.admin.role.permissions,
                        grouped
                    })
                );
            } catch (error) {
                console.error("Permissions error:", error);
                return reply.send(
                    HttpResponse.internalServerError("Erro ao buscar permissões")
                );
            }
        }
    );
};

export default routes;