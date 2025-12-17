// ===============================================
// auth.helper.ts (Backend)
// ===============================================
import { PrismaClient, Admin, Role, RolePermission, PermissionAction } from '@prisma/client';
import { MenuService } from '../../config/frontend/menu/menu.service';
import { RouteGuardService } from './abac-rbac/route-guard.service';

// ===============================================
// TYPES
// ===============================================

export interface AdminWithPermissions extends Admin {
    role: Role & {
        permissions: RolePermission[];
    };
}

export interface AuthResponse {
    admin: {
        name: string;
        email: string;
        role: string;
        permissions: RolePermission[];
        menu: any[];
    };
    token: string;
    redirect: string;
}

// ===============================================
// AUTH HELPER
// ===============================================

export class AuthHelper {
    /**
     * Busca admin com role e permissions do banco
     */
    static async getAdminWithPermissions(
        prisma: PrismaClient,
        adminId: string
    ): Promise<AdminWithPermissions | null> {
        return await prisma.admin.findUnique({
            where: {
                id: adminId,
                deletedAt: null,  // Soft delete check
                isActive: true    // Active check
            },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
    }

    /**
     * Busca admin pelo token de sessão
     */
    static async getAdminFromToken(
        prisma: PrismaClient,
        token: string
    ): Promise<AdminWithPermissions | null> {
        const session = await prisma.session.findUnique({
            where: {
                token,
                active: true,
                ownerType: 'ADMIN'
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

        // Verifica se sessão não expirou
        if (new Date() > session.expiresAt) {
            await prisma.session.update({
                where: { id: session.id },
                data: { active: false }
            });
            return null;
        }

        // Atualiza lastUsedAt
        await prisma.session.update({
            where: { id: session.id },
            data: { lastUsedAt: new Date() }
        });

        return session.admin as AdminWithPermissions;
    }

    /**
     * Verifica se admin pode acessar uma rota
     */
    static canAccessRoute(
        admin: AdminWithPermissions,
        pathname: string,
        debug: boolean = false
    ): boolean {
        const isServerAdmin = admin.type === 'SERVER';

        return RouteGuardService.canAccessRoute(
            pathname,
            admin.role.permissions,
            isServerAdmin,
            debug
        );
    }

    /**
     * Gera o menu do admin baseado nas permissions
     */
    static buildMenu(
        admin: AdminWithPermissions,
        debug: boolean = false
    ): any[] {
        const isServerAdmin = admin.type === 'SERVER';

        return MenuService.buildMenu(
            admin.role.permissions,
            isServerAdmin,
            debug
        );
    }

    /**
     * Monta a resposta completa de autenticação
     */
    static buildAuthResponse(
        admin: AdminWithPermissions,
        token: string,
        redirect: string = '/'
    ): AuthResponse {
        return {
            admin: {
                name: admin.name,
                email: admin.email,
                role: admin.role.name,
                permissions: admin.role.permissions,
                menu: this.buildMenu(admin, false)
            },
            token,
            redirect
        };
    }

    /**
     * Verifica se admin tem uma permission específica
     */
    static hasPermission(
        admin: AdminWithPermissions,
        resource: string,
        action: string
    ): boolean {
        // SERVER admin tem tudo
        if (admin.type === 'SERVER') return true;

        return admin.role.permissions.some(p => {
            const resourceMatch = p.resource.toUpperCase() === resource.toUpperCase();
            const actionMatch = p.action.toUpperCase() === action.toUpperCase();
            const hasManage = p.action.toUpperCase() === PermissionAction.MANAGE;

            return resourceMatch && (actionMatch || hasManage);
        });
    }

    /**
     * Debug completo do admin
     */
    static debugAdmin(admin: AdminWithPermissions): void {
        console.log('='.repeat(60));
        console.log('👤 ADMIN DEBUG');
        console.log('='.repeat(60));
        console.log(`Name: ${admin.name}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Type: ${admin.type}`);
        console.log(`Role: ${admin.role.name}`);
        console.log(`\n📋 Permissions (${admin.role.permissions.length}):`);

        admin.role.permissions.forEach(p => {
            console.log(`  - ${p.resource} / ${p.action}`);
        });

        console.log(`\n📱 Menu:`);
        const menu = this.buildMenu(admin, false);
        console.log(JSON.stringify(menu, null, 2));

        console.log('\n' + '='.repeat(60));
    }
}

// ===============================================
// EXEMPLOS DE USO NOS CONTROLLERS
// ===============================================

/*
// ==========================================
// LOGIN CONTROLLER
// ==========================================
import { AuthHelper } from './auth.helper';

app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    // 1. Busca admin
    const admin = await prisma.admin.findUnique({
        where: { email },
        include: {
            role: {
                include: {
                    permissions: true
                }
            }
        }
    });

    if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Valida senha
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Cria sessão
    const token = crypto.randomUUID();
    await prisma.session.create({
        data: {
            token,
            ownerType: 'ADMIN',
            tenantId: admin.tenantId,
            adminId: admin.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            ip: req.ip,
            agent: req.headers['user-agent']
        }
    });

    // 4. Monta resposta com menu
    const response = AuthHelper.buildAuthResponse(admin, token);

    // 5. Seta cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({ data: response });
});

// ==========================================
// CHECK ROUTE CONTROLLER
// ==========================================
app.post('/api/admin/check-route', async (req, res) => {
    const { pathname } = req.body;
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Busca admin pelo token
    const admin = await AuthHelper.getAdminFromToken(prisma, token);

    if (!admin) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // 2. Verifica acesso (COM DEBUG)
    const canAccess = AuthHelper.canAccessRoute(admin, pathname, true);

    return res.json({ 
        data: { 
            canAccess,
            admin: {
                name: admin.name,
                email: admin.email
            }
        } 
    });
});

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ==========================================
async function authMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await AuthHelper.getAdminFromToken(prisma, token);

    if (!admin) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Anexa admin na request
    req.admin = admin;
    next();
}

// ==========================================
// MIDDLEWARE DE PERMISSÃO
// ==========================================
function requirePermission(resource: string, action: string) {
    return (req, res, next) => {
        const admin = req.admin;

        if (!admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!AuthHelper.hasPermission(admin, resource, action)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        next();
    };
}

// Exemplo de uso:
app.get(
    '/api/products',
    authMiddleware,
    requirePermission('PRODUCT', 'VIEW'),
    async (req, res) => {
        // Controller aqui
    }
);
*/