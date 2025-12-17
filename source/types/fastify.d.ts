// ===============================================
// types/fastify.d.ts
// ===============================================

import "fastify";
import { Admin, Session, AdminType } from "@prisma/client";

// ===============================================
// CUSTOM TYPES
// ===============================================

export interface RolePermission {
  id: string;
  resource: string;
  action: string;
  attributes: any;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface AdminWithPermissions extends Admin {
  role: {
    name: string;
    permissions: RolePermission[];
  };
}

export interface RequestContext {
  field?: string;
  resourceBusinessId?: string;
  value?: number;
  tenantId?: string;
  [key: string]: any; // Para campos extras do ABAC
}

// ===============================================
// FASTIFY MODULE AUGMENTATION
// ===============================================

declare module "fastify" {
  interface FastifyRequest {
    /**
     * Admin autenticado (preenchido pelo authGuard)
     */
    admin?: AdminWithPermissions;

    /**
     * Sessão ativa do admin
     */
    session?: Session;

    /**
     * Contexto da requisição (útil para ABAC)
     */
    context?: RequestContext;

    /**
     * Helper: verifica se é SERVER admin
     */
    isServerAdmin?: boolean;

    /**
     * Helper: verifica se tem uma permission específica
     */
    hasPermission?: (resource: string, action: string) => boolean;
  }

  interface FastifyReply {
    /**
     * Helper: seta cookie de autenticação
     */
    setAuthCookie?: (token: string, maxAge?: number) => FastifyReply;

    /**
     * Helper: remove cookie de autenticação
     */
    clearAuthCookie?: () => FastifyReply;
  }
}

// ===============================================
// HELPER FUNCTIONS (para usar nos guards)
// ===============================================

/**
 * Extrai e valida o token do header Authorization ou cookie
 */
export function extractToken(request: any): string | null {
  // Tenta pegar do header Authorization
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Tenta pegar do cookie
  const cookieHeader = request.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Verifica se admin tem uma permission específica
 */
export function hasPermission(
  admin: AdminWithPermissions,
  resource: string,
  action: string
): boolean {
  // SERVER admin tem tudo
  if (admin.type === "SERVER") return true;

  return admin.role.permissions.some(p => {
    const resourceMatch = p.resource.toUpperCase() === resource.toUpperCase();
    const actionMatch = p.action.toUpperCase() === action.toUpperCase();
    const hasManage = p.action.toUpperCase() === "MANAGE";

    return resourceMatch && (actionMatch || hasManage);
  });
}

// ===============================================
// EXEMPLOS DE USO
// ===============================================

/*
// ==========================================
// NO AUTH GUARD
// ==========================================
import { FastifyRequest, FastifyReply } from "fastify";
import { extractToken, hasPermission } from "./types/fastify";

export async function authGuard(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const token = extractToken(request);

    if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
    }

    // Busca admin pelo token...
    const admin = await getAdminFromToken(token);

    if (!admin) {
        return reply.status(401).send({ error: "Invalid token" });
    }

    // Anexa admin na request
    request.admin = admin;
    request.isServerAdmin = admin.type === "SERVER";
    request.hasPermission = (resource, action) => hasPermission(admin, resource, action);
}

// ==========================================
// NAS ROTAS
// ==========================================
fastify.get(
    "/api/products",
    { preHandler: authGuard },
    async (request, reply) => {
        // Acesso direto ao admin tipado
        if (!request.admin) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        // Helper isServerAdmin
        if (request.isServerAdmin) {
            console.log("SERVER ADMIN detected!");
        }

        // Helper hasPermission
        if (!request.hasPermission?.("PRODUCT", "VIEW")) {
            return reply.status(403).send({ error: "Forbidden" });
        }

        // Acesso às permissions
        console.log(request.admin.role.permissions);

        // Seu código aqui...
    }
);

// ==========================================
// MIDDLEWARE DE PERMISSÃO
// ==========================================
export function requirePermission(resource: string, action: string) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.admin) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        if (!hasPermission(request.admin, resource, action)) {
            return reply.status(403).send({
                error: "Forbidden",
                message: `Required permission: ${resource}/${action}`
            });
        }
    };
}

// Uso:
fastify.get(
    "/api/products",
    {
        preHandler: [
            authGuard,
            requirePermission("PRODUCT", "VIEW")
        ]
    },
    async (request, reply) => {
        // Já passou pelas validações
    }
);

// ==========================================
// HELPERS DE COOKIE (opcional)
// ==========================================
import { FastifyInstance } from "fastify";

export function registerHelpers(app: FastifyInstance) {
    app.decorateReply("setAuthCookie", function (token: string, maxAge = 86400) {
        return this.setCookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge,
            path: "/"
        });
    });

    app.decorateReply("clearAuthCookie", function () {
        return this.clearCookie("token", { path: "/" });
    });
}

// No server.ts:
registerHelpers(app);

// Nas rotas:
reply.setAuthCookie(token, 7 * 24 * 60 * 60); // 7 dias
reply.clearAuthCookie();
*/