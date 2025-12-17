// ===============================================
// route-guard.service.ts (Backend)
// ===============================================
import { FULL_MENU, ADMIN_MENU, MenuItem } from "../../../config/frontend/menu/menu.config";

// Aceita permissions do Prisma (sem campo allowed)
interface Permission {
    resource: string;
    action: string;
    // Outros campos do Prisma são ignorados
    [key: string]: any;
}

export class RouteGuardService {
    /**
     * Verifica se o usuário tem permissão para acessar uma rota
     */
    static canAccessRoute(
        pathname: string,
        permissions: Permission[],
        isServerAdmin: boolean,
        debug: boolean = false
    ): boolean {
        if (debug) {
            console.log('\n🔍 RouteGuardService.canAccessRoute');
            console.log('- pathname:', pathname);
            console.log('- isServerAdmin:', isServerAdmin);
            console.log('- permissions:', permissions);
        }

        // Admin de servidor tem acesso a tudo
        if (isServerAdmin) {
            if (debug) console.log('✅ SERVER ADMIN - acesso liberado');
            return true;
        }

        // Combina todos os menus disponíveis
        const allMenuItems = [...FULL_MENU, ...ADMIN_MENU];

        // Procura pela rota no menu
        const menuItem = this.findMenuItemByPath(pathname, allMenuItems, debug);

        if (!menuItem) {
            if (debug) console.log('❌ Rota não encontrada no menu');
            return false;
        }

        if (debug) {
            console.log('📋 Menu item encontrado:', menuItem);
        }

        // Verifica se o usuário tem permissão
        const hasAccess = this.hasPermission(
            permissions,
            menuItem.resource,
            menuItem.action,
            debug
        );

        if (debug) {
            console.log(hasAccess ? '✅ Acesso permitido' : '❌ Acesso negado');
        }

        return hasAccess;
    }

    /**
     * Encontra o item do menu correspondente ao pathname
     */
    private static findMenuItemByPath(
        pathname: string,
        menuItems: MenuItem[],
        debug: boolean = false
    ): { resource: string; action: string; link: string } | null {
        const cleanPath = pathname.replace(/\/$/, "") || "/";

        if (debug) {
            console.log('\n🔎 Procurando rota:', cleanPath);
        }

        // ESTRATÉGIA: Procura do mais específico para o mais genérico
        let bestMatch: { resource: string; action: string; link: string; score: number } | null = null;

        for (const item of menuItems) {
            // Verifica submenus PRIMEIRO (são mais específicos)
            if (item.subs) {
                for (const sub of item.subs) {
                    const match = this.matchRoute(cleanPath, sub.link, debug);
                    if (match && (!bestMatch || match.score > bestMatch.score)) {
                        bestMatch = {
                            resource: sub.resource,
                            action: sub.action,
                            link: sub.link,
                            score: match.score
                        };
                        if (debug) {
                            console.log(`  ✓ Match: ${sub.link} (score: ${match.score})`);
                        }
                    }
                }
            }

            // Depois verifica item principal
            const match = this.matchRoute(cleanPath, item.link, debug);
            if (match && (!bestMatch || match.score > bestMatch.score)) {
                bestMatch = {
                    resource: item.resource,
                    action: item.action,
                    link: item.link,
                    score: match.score
                };
                if (debug) {
                    console.log(`  ✓ Match: ${item.link} (score: ${match.score})`);
                }
            }
        }

        return bestMatch ? {
            resource: bestMatch.resource,
            action: bestMatch.action,
            link: bestMatch.link
        } : null;
    }

    /**
     * Verifica se o pathname corresponde à rota do menu
     * Retorna score: quanto maior, mais específico o match
     */
    private static matchRoute(
        pathname: string,
        menuLink: string,
        debug: boolean = false
    ): { score: number } | null {
        const cleanPath = pathname.replace(/\/$/, "") || "/";
        const cleanLink = menuLink.replace(/\/$/, "") || "/";

        // Match exato (score máximo)
        if (cleanPath === cleanLink) {
            return { score: 1000 };
        }

        // Se o menu é "/", só aceita match exato
        if (cleanLink === "/") {
            return null;
        }

        // Prefix match para rotas dinâmicas
        // Ex: /products/discounts deve dar match com /products
        if (cleanPath.startsWith(cleanLink + "/")) {
            // Score baseado no tamanho do match
            // Quanto mais específico (maior o link), maior o score
            return { score: cleanLink.length };
        }

        return null;
    }

    /**
     * Verifica se o usuário tem permissão para o resource/action
     */
    private static hasPermission(
        permissions: Permission[],
        requiredResource: string,
        requiredAction: string,
        debug: boolean = false
    ): boolean {
        if (debug) {
            console.log('\n🔐 Verificando permissão:');
            console.log('  Required:', requiredResource, '/', requiredAction);
        }

        for (const permission of permissions) {
            if (debug) {
                console.log('  Checking:', permission.resource, '/', permission.action);
            }

            // Resource precisa ser exatamente igual (case insensitive)
            if (permission.resource.toUpperCase() !== requiredResource.toUpperCase()) {
                continue;
            }

            // 'MANAGE' permite qualquer ação
            if (permission.action.toUpperCase() === 'MANAGE') {
                if (debug) console.log('  ✓ MANAGE encontrado');
                return true;
            }

            // Caso contrário, ação precisa ser exata (case insensitive)
            if (permission.action.toUpperCase() === requiredAction.toUpperCase()) {
                if (debug) console.log('  ✓ Action match');
                return true;
            }
        }

        if (debug) {
            console.log('  ✗ Nenhuma permissão compatível');
        }

        return false;
    }

    /**
     * Debug helper - mostra todas as rotas disponíveis
     */
    static debugRoutes(): void {
        console.log('='.repeat(60));
        console.log('📋 ROTAS DISPONÍVEIS NO MENU');
        console.log('='.repeat(60));

        const allItems = [...FULL_MENU, ...ADMIN_MENU];

        allItems.forEach(item => {
            console.log(`\n${item.title} (${item.resource}/${item.action})`);
            console.log(`  Link: ${item.link}`);

            if (item.subs) {
                item.subs.forEach(sub => {
                    console.log(`  └─ ${sub.title || 'Sub'} (${sub.resource}/${sub.action})`);
                    console.log(`     Link: ${sub.link}`);
                });
            }
        });

        console.log('\n' + '='.repeat(60));
    }

    /**
     * Debug helper - testa acesso a uma rota específica
     */
    static debugRoute(
        pathname: string,
        permissions: Permission[],
        isServerAdmin: boolean
    ): void {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 TESTE DE ACESSO À ROTA');
        console.log('='.repeat(60));

        const canAccess = this.canAccessRoute(pathname, permissions, isServerAdmin, true);

        console.log('\n' + '='.repeat(60));
        console.log(`RESULTADO: ${canAccess ? '✅ PERMITIDO' : '❌ NEGADO'}`);
        console.log('='.repeat(60) + '\n');
    }
}

// ===============================================
// EXEMPLOS DE USO
// ===============================================

/*
// Exemplo 1: Verificar acesso (formato Prisma)
const canAccess = RouteGuardService.canAccessRoute(
    '/products/discounts',
    [
        { 
            id: '...', 
            resource: 'PRODUCT', 
            action: 'VIEW',
            roleId: '...',
            createdAt: new Date(),
            // ... outros campos do Prisma
        },
        { 
            id: '...', 
            resource: 'PRODUCT', 
            action: 'MANAGE',
            roleId: '...',
            createdAt: new Date(),
            // ... outros campos do Prisma
        }
    ],
    false
);

// Exemplo 2: Debug completo
RouteGuardService.debugRoute(
    '/products/discounts',
    admin.role.permissions, // direto do Prisma
    admin.type === 'SERVER'
);

// Exemplo 3: Ver todas as rotas
RouteGuardService.debugRoutes();

// Exemplo 4: No seu controller
app.post('/api/admin/check-route', async (req, res) => {
    const { pathname } = req.body;
    const admin = await getAdminFromToken(req.cookies.token);
    
    const canAccess = RouteGuardService.canAccessRoute(
        pathname,
        admin.role.permissions, // direto do Prisma!
        admin.type === 'SERVER',
        true // debug
    );
    
    return res.json({ data: { canAccess } });
});
*/