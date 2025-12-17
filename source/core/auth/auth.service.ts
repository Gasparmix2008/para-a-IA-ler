// ===============================================
// auth.service.ts
// ===============================================

import { addDays } from "date-fns";
import crypto from "crypto";
import Bcrypt from "bcrypt";
import {
  PrismaClient,
  PermissionAction,
  Resource,
  SessionOwnerType,
  AdminType
} from "@prisma/client";

import { JwtService } from "./jwt.service";
import { MenuService } from "../../config/frontend/menu/menu.service";
import { RouteGuardService } from "./abac-rbac/route-guard.service";
import { FastifyRequest } from "fastify";
import { HttpResponse } from "../http/response";

const prisma = new PrismaClient();

// ===============================================
// TYPES
// ===============================================

interface LoginLocation {
  city: string;
  region: string;
  country: string;
}

interface LoginResponse {
  admin: {
    id: string;
    name: string;
    email: string;
    type: AdminType;
    role: string;
    permissions: {
      resource: Resource;
      action: PermissionAction;
      attributes: any;
    }[];
    menu: any[];
  };
  token: string;
  redirect: string;
}

// ===============================================
// AUTH SERVICE
// ===============================================

export default class AuthService {
  /**
   * Login de admin com sessão e menu dinâmico
   */
  async login(
    email: string,
    password: string,
    rememberMe = false,
    location: LoginLocation | null,
    agent = "unknown",
    ip?: string
  ): Promise<LoginResponse | { error: string }> {
    const days = rememberMe ? 7 : 1;
    const expiresAt = addDays(new Date(), days);
    const rawToken = crypto.randomUUID();

    // ================================
    // BUSCA ADMIN + ROLE + PERMISSIONS
    // ================================
    const admin = await prisma.admin.findUnique({
      where: {
        email,
        deletedAt: null,  // Soft delete check
        isActive: true    // Active check
      },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        tenantId: true,
        type: true,
        isActive: true,
        loginAttempts: true,
        lockedUntil: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                resource: true,
                action: true,
                attributes: true
              }
            }
          }
        }
      }
    });

    // Validações
    if (!admin) {
      await this.logFailedAttempt(email, ip || "unknown", "INVALID_EMAIL");
      return { error: "Email ou senha inválidos" };
    }

    // Check se está bloqueado
    if (admin.lockedUntil && new Date() < admin.lockedUntil) {
      const minutesLeft = Math.ceil(
        (admin.lockedUntil.getTime() - Date.now()) / 60000
      );
      return {
        error: `Conta bloqueada. Tente novamente em ${minutesLeft} minutos`
      };
    }

    // Valida senha
    const passwordMatch = await Bcrypt.compare(password, admin.passwordHash);

    if (!passwordMatch) {
      await this.handleFailedLogin(admin.id, email, ip || "unknown");
      return { error: "Email ou senha inválidos" };
    }

    // Reset login attempts após sucesso
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // ================================
    // CRIA SESSÃO
    // ================================
    await prisma.session.create({
      data: {
        token: rawToken,
        ownerType: SessionOwnerType.ADMIN,
        tenantId: admin.tenantId,
        adminId: admin.id,
        agent,
        ip,
        city: location?.city,
        expiresAt
      }
    });

    // Log de sucesso
    await this.logSuccessfulLogin(admin.tenantId, email, ip || "unknown", agent);

    // ================================
    // NORMALIZA PERMISSIONS
    // ================================
    const permissions = admin.role.permissions.map(p => ({
      resource: p.resource as Resource,
      action: p.action as PermissionAction,
      attributes: p.attributes
    }));

    const isServerAdmin = admin.type === AdminType.SERVER;

    // ================================
    // MENU DINÂMICO
    // ================================
    const menu = MenuService.buildMenu(
      permissions,
      isServerAdmin,
      true // Debug: false em produção
    );

    // ================================
    // DEFINE REDIRECT
    // ================================
    // Pega primeiro item do menu com link válido
    const redirect = menu.find(item => item.link && item.link !== "#")?.link || "/";
    console.log(redirect)

    // ================================
    // RESPOSTA
    // ================================
    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        type: admin.type,
        role: admin.role.name,
        permissions,
        menu
      },
      token: JwtService.sign({ rawToken }, `${days}d`),
      redirect
    };
  }

  /**
   * Logout com invalidação de sessão
   */
  async logout(request: FastifyRequest) {
    const auth = request.headers.authorization;

    if (!auth?.startsWith("Bearer ")) {
      return HttpResponse.unauthorized(403);
    }

    const token = auth.split(" ")[1];

    try {
      const session = JwtService.verify(token) as { rawToken: string };

      // Invalida sessão (soft delete)
      await prisma.session.update({
        where: { token: session.rawToken },
        data: { active: false }
      });

      return HttpResponse.noContent();
    } catch (error) {
      // Token inválido ou expirado
      return HttpResponse.unauthorized(401);
    }
  }

  /**
   * Verifica se admin pode acessar uma rota
   */
  async checkRoute(
    token: string,
    pathname: string
  ): Promise<{ canAccess: boolean; admin?: any; reason?: string }> {
    try {
      // Decodifica JWT
      const decoded = JwtService.verify(token) as { rawToken: string };

      // Busca sessão ativa
      const session = await prisma.session.findUnique({
        where: {
          token: decoded.rawToken,
          active: true,
          ownerType: SessionOwnerType.ADMIN
        },
        include: {
          admin: {
            include: {
              role: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      });

      if (!session?.admin) {
        return { canAccess: false, reason: "Session not found" };
      }

      // Verifica se sessão expirou
      if (new Date() > session.expiresAt) {
        await prisma.session.update({
          where: { id: session.id },
          data: { active: false }
        });
        return { canAccess: false, reason: "Session expired" };
      }

      // Atualiza lastUsedAt
      await prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() }
      });

      // Verifica permissão na rota
      const isServerAdmin = session.admin.type === AdminType.SERVER;
      const canAccess = RouteGuardService.canAccessRoute(
        pathname,
        session.admin.role.permissions,
        isServerAdmin,
        false // Debug: false em produção
      );

      return {
        canAccess,
        admin: {
          name: session.admin.name,
          email: session.admin.email
        },
        reason: canAccess ? "Allowed" : "No permission"
      };
    } catch (error) {
      return { canAccess: false, reason: "Invalid token" };
    }
  }

  /**
   * Busca admin autenticado pelo token
   */
  async getAuthenticatedAdmin(token: string) {
    try {
      const decoded = JwtService.verify(token) as { rawToken: string };

      const session = await prisma.session.findUnique({
        where: {
          token: decoded.rawToken,
          active: true
        },
        include: {
          admin: {
            include: {
              role: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      });

      if (!session?.admin) return null;

      // Verifica expiração
      if (new Date() > session.expiresAt) {
        await prisma.session.update({
          where: { id: session.id },
          data: { active: false }
        });
        return null;
      }

      return session.admin;
    } catch {
      return null;
    }
  }

  // ===============================================
  // HELPERS PRIVADOS
  // ===============================================

  /**
   * Registra tentativa de login falhada
   */
  private async logFailedAttempt(
    email: string,
    ip: string,
    reason: string
  ): Promise<void> {
    try {
      // Busca tenant pelo email (se existir)
      const admin = await prisma.admin.findUnique({
        where: { email },
        select: { tenantId: true }
      });

      if (admin) {
        await prisma.loginAttempt.create({
          data: {
            tenantId: admin.tenantId,
            identifier: email,
            type: SessionOwnerType.ADMIN,
            success: false,
            reason,
            ip
          }
        });
      }
    } catch (error) {
      console.error("Error logging failed attempt:", error);
    }
  }

  /**
   * Registra login bem-sucedido
   */
  private async logSuccessfulLogin(
    tenantId: string,
    email: string,
    ip: string,
    agent: string
  ): Promise<void> {
    try {
      await prisma.loginAttempt.create({
        data: {
          tenantId,
          identifier: email,
          type: SessionOwnerType.ADMIN,
          success: true,
          ip,
          agent
        }
      });
    } catch (error) {
      console.error("Error logging successful login:", error);
    }
  }

  /**
   * Incrementa tentativas e bloqueia se necessário
   */
  private async handleFailedLogin(
    adminId: string,
    email: string,
    ip: string
  ): Promise<void> {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { loginAttempts: true, tenantId: true }
    });

    if (!admin) return;

    const newAttempts = admin.loginAttempts + 1;
    const maxAttempts = 5; // Pode vir do TenantSettings

    await prisma.admin.update({
      where: { id: adminId },
      data: {
        loginAttempts: newAttempts,
        ...(newAttempts >= maxAttempts && {
          lockedUntil: addDays(new Date(), 0.5) // 30min de bloqueio
        })
      }
    });

    // Log da tentativa falhada
    await prisma.loginAttempt.create({
      data: {
        tenantId: admin.tenantId,
        identifier: email,
        type: SessionOwnerType.ADMIN,
        success: false,
        reason: newAttempts >= maxAttempts ? "ACCOUNT_LOCKED" : "INVALID_PASSWORD",
        ip
      }
    });
  }
}

// ===============================================
// SINGLETON EXPORT
// ===============================================
export const authService = new AuthService();