// ===============================================
// route-guard.service.ts (Backend)
// ===============================================
import { FULL_MENU, ADMIN_MENU, MenuItem } from "../../../config/frontend/menu/menu.config";

interface Permission {
    resource: string;
    action: string;
    allowed: boolean;
}

export class RouteGuardService {
    /**
     * Verifica se o usuário tem permissão para acessar uma rota
     */
    static canAccessRoute(
        pathname: string,
        permissions: Permission[],
        isServerAdmin: boolean
    ): boolean {
        // Combina todos os menus disponíveis
        const allMenuItems = isServerAdmin
            ? [...FULL_MENU, ...ADMIN_MENU]
            : FULL_MENU;

        // Procura pela rota no menu
        const menuItem = this.findMenuItemByPath(pathname, allMenuItems);

        if (!menuItem) {
            // Rota não encontrada no menu
            return false;
        }

        // Verifica se o usuário tem permissão
        return this.hasPermission(
            permissions,
            menuItem.resource,
            menuItem.action
        );
    }

    /**
     * Encontra o item do menu correspondente ao pathname
     */
    private static findMenuItemByPath(
        pathname: string,
        menuItems: MenuItem[]
    ): { resource: string; action: string } | null {
        const cleanPath = pathname.replace(/\/$/, "");

        for (const item of menuItems) {
            // Verifica item principal
            if (this.matchRoute(cleanPath, item.link)) {
                return { resource: item.resource, action: item.action };
            }

            // Verifica submenus
            if (item.subs) {
                for (const sub of item.subs) {
                    if (this.matchRoute(cleanPath, sub.link)) {
                        return { resource: sub.resource, action: sub.action };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Verifica se o pathname corresponde à rota do menu
     * Suporta rotas dinâmicas (ex: /products/123)
     */
    private static matchRoute(pathname: string, menuLink: string): boolean {
        const cleanPath = pathname.replace(/\/$/, "") || "/";
        const cleanLink = menuLink.replace(/\/$/, "") || "/";

        // Match exato
        if (cleanPath === cleanLink) return true;

        // ⚠️ NUNCA fazer prefix match se o menu for "/"
        if (cleanLink === "/") return false;

        // Prefix match para rotas dinâmicas
        return cleanPath.startsWith(cleanLink + "/");
    }


    /**
     * Verifica se o usuário tem permissão para o resource/action
     */
    private static hasPermission(
        permissions: Permission[],
        requiredResource: string,
        requiredAction: string
    ): boolean {
        for (const permission of permissions) {
            if (!permission.allowed) continue;

            // Resource precisa ser exatamente igual
            if (permission.resource !== requiredResource) continue;

            // 'manage' permite qualquer ação
            if (permission.action === 'manage') return true;

            // Caso contrário, ação precisa ser exata
            if (permission.action === requiredAction) return true;
        }

        return false;
    }
}