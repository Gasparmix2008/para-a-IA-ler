// ===============================================
// admin.controller.ts
// ===============================================

import { PrismaClient, AdminType } from "@prisma/client";

const prisma = new PrismaClient();

// ===============================================
// TYPES
// ===============================================

export interface AdminWithRole {
    id: string;
    email: string;
    name: string;
    type: AdminType;
    isActive: boolean;
    lastLogin: Date | null;
    role: {
        name: string;
        permissions: {
            resource: string;
            action: string;
            attributes: any;
        }[];
    };
}

// ===============================================
// ADMIN CONTROLLER
// ===============================================

export default class AdminController {
    /**
     * Busca admin por ID com role e permissions
     */
    async adminById(adminId: string): Promise<AdminWithRole | null> {
        return await prisma.admin.findUnique({
            where: {
                id: adminId,
                deletedAt: null, // Soft delete check
                isActive: true   // Active check
            },
            select: {
                id: true,
                email: true,
                name: true,
                type: true,
                isActive: true,
                lastLogin: true,
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
    }

    /**
     * Busca admin por email
     */
    async adminByEmail(email: string): Promise<AdminWithRole | null> {
        return await prisma.admin.findUnique({
            where: {
                email,
                deletedAt: null,
                isActive: true
            },
            select: {
                id: true,
                email: true,
                name: true,
                type: true,
                isActive: true,
                lastLogin: true,
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
    }

    /**
     * Lista todos os admins de um tenant
     */
    async listAdmins(
        tenantId: string,
        options?: {
            includeInactive?: boolean;
            type?: AdminType;
        }
    ) {
        const where: any = {
            tenantId,
            deletedAt: null
        };

        if (!options?.includeInactive) {
            where.isActive = true;
        }

        if (options?.type) {
            where.type = options.type;
        }

        return await prisma.admin.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                type: true,
                isActive: true,
                lastLogin: true,
                loginAttempts: true,
                lockedUntil: true,
                role: {
                    select: {
                        name: true
                    }
                },
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }

    /**
     * Atualiza dados básicos do admin
     */
    async updateAdmin(
        adminId: string,
        data: {
            name?: string;
            email?: string;
            roleId?: string;
        },
        updatedBy: string
    ) {
        return await prisma.admin.update({
            where: { id: adminId },
            data: {
                ...data,
                updatedBy,
                updatedAt: new Date()
            },
            select: {
                id: true,
                email: true,
                name: true,
                type: true,
                role: {
                    select: {
                        name: true,
                        permissions: true
                    }
                }
            }
        });
    }

    /**
     * Desativa admin (soft delete)
     */
    async deactivateAdmin(adminId: string, deletedBy: string) {
        return await prisma.admin.update({
            where: { id: adminId },
            data: {
                isActive: false,
                deletedAt: new Date(),
                deletedBy
            }
        });
    }

    /**
     * Reativa admin
     */
    async reactivateAdmin(adminId: string, updatedBy: string) {
        return await prisma.admin.update({
            where: { id: adminId },
            data: {
                isActive: true,
                deletedAt: null,
                deletedBy: null,
                updatedBy,
                loginAttempts: 0,
                lockedUntil: null
            }
        });
    }

    /**
     * Reseta tentativas de login
     */
    async resetLoginAttempts(adminId: string) {
        return await prisma.admin.update({
            where: { id: adminId },
            data: {
                loginAttempts: 0,
                lockedUntil: null
            }
        });
    }

    /**
     * Lista sessões ativas do admin
     */
    async getActiveSessions(adminId: string) {
        return await prisma.session.findMany({
            where: {
                adminId,
                active: true,
                expiresAt: {
                    gt: new Date()
                }
            },
            select: {
                id: true,
                ip: true,
                agent: true,
                city: true,
                deviceName: true,
                lastUsedAt: true,
                createdAt: true,
                expiresAt: true
            },
            orderBy: {
                lastUsedAt: "desc"
            }
        });
    }

    /**
     * Invalida todas as sessões de um admin
     */
    async invalidateAllSessions(adminId: string) {
        return await prisma.session.updateMany({
            where: {
                adminId,
                active: true
            },
            data: {
                active: false
            }
        });
    }

    /**
     * Busca histórico de login do admin
     */
    async getLoginHistory(
        adminId: string,
        limit: number = 50
    ) {
        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: { email: true, tenantId: true }
        });

        if (!admin) return [];

        return await prisma.loginAttempt.findMany({
            where: {
                tenantId: admin.tenantId,
                identifier: admin.email,
                type: "ADMIN"
            },
            orderBy: {
                createdAt: "desc"
            },
            take: limit,
            select: {
                success: true,
                reason: true,
                ip: true,
                agent: true,
                createdAt: true
            }
        });
    }

    /**
     * Estatísticas do admin
     */
    async getAdminStats(adminId: string) {
        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: {
                email: true,
                tenantId: true,
                lastLogin: true,
                loginAttempts: true,
                createdAt: true
            }
        });

        if (!admin) return null;

        // Conta sessões ativas
        const activeSessions = await prisma.session.count({
            where: {
                adminId,
                active: true,
                expiresAt: { gt: new Date() }
            }
        });

        // Conta total de logins bem-sucedidos
        const totalLogins = await prisma.loginAttempt.count({
            where: {
                tenantId: admin.tenantId,
                identifier: admin.email,
                type: "ADMIN",
                success: true
            }
        });

        // Conta tentativas falhadas (últimos 30 dias)
        const failedAttempts = await prisma.loginAttempt.count({
            where: {
                tenantId: admin.tenantId,
                identifier: admin.email,
                type: "ADMIN",
                success: false,
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });

        return {
            email: admin.email,
            lastLogin: admin.lastLogin,
            currentLoginAttempts: admin.loginAttempts,
            activeSessions,
            totalLogins,
            failedAttempts30d: failedAttempts,
            accountAge: Math.floor(
                (Date.now() - admin.createdAt.getTime()) / (24 * 60 * 60 * 1000)
            )
        };
    }
}

// ===============================================
// EXEMPLOS DE USO
// ===============================================

/*
// Buscar admin por ID
const admin = await adminController.adminById("admin-id");

// Listar admins do tenant
const admins = await adminController.listAdmins("tenant-id", {
    includeInactive: false,
    type: "BUSINESS"
});

// Atualizar admin
await adminController.updateAdmin(
    "admin-id",
    { name: "Novo Nome", email: "novo@email.com" },
    "updater-admin-id"
);

// Desativar admin
await adminController.deactivateAdmin("admin-id", "deleter-admin-id");

// Resetar tentativas de login
await adminController.resetLoginAttempts("admin-id");

// Ver sessões ativas
const sessions = await adminController.getActiveSessions("admin-id");

// Invalidar todas as sessões
await adminController.invalidateAllSessions("admin-id");

// Ver histórico de login
const history = await adminController.getLoginHistory("admin-id", 100);

// Ver estatísticas
const stats = await adminController.getAdminStats("admin-id");
*/