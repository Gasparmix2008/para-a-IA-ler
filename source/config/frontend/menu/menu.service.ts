// ===============================================
// menu.service.ts
// ===============================================
import { MenuItem, ADMIN_MENU, FULL_MENU } from "./menu.config"
import { isMenuResourceAllowed, mapActionToMenuAction } from "../../../core/auth/abac-rbac/resource-mapping"

interface Permission {
    resource: string
    action: string
    allowed: boolean
}

// Tipo do menu retornado (sem resource e action)
export interface CleanMenuItem {
    id: string
    title: string
    icon: any
    link: string
    subs?: CleanSubMenuItem[]
}

export interface CleanSubMenuItem {
    id?: string
    title?: string
    link: string
    icon?: any
}

export class MenuService {
    /**
     * Filtra o menu baseado nas permissões do usuário
     */
    static filterMenuByPermissions(
        menu: MenuItem[],
        permissions: Permission[],
        isServerAdmin: boolean
    ): MenuItem[] {
        return menu
            .map(item => {
                // Verifica se o usuário tem permissão para o item principal
                const hasPermission = this.checkPermission(
                    permissions,
                    item.resource,
                    item.action,
                    isServerAdmin
                )

                if (!hasPermission) return null

                // Se tem submenus, filtra eles também
                if (item.subs && item.subs.length > 0) {
                    const filteredSubs = item.subs.filter(sub =>
                        this.checkPermission(permissions, sub.resource, sub.action, isServerAdmin)
                    )

                    // Se não tem submenus permitidos, não mostra o item pai
                    if (filteredSubs.length === 0) return null

                    return { ...item, subs: filteredSubs }
                }

                return item
            })
            .filter((item): item is MenuItem => item !== null)
    }

    /**
     * Remove os campos 'resource' e 'action' do menu
     * Retorna apenas: id, title, icon, link, subs
     */
    static cleanMenu(menu: MenuItem[]): CleanMenuItem[] {
        return menu.map(item => {
            const cleanItem: CleanMenuItem = {
                id: item.id,
                title: item.title,
                icon: item.icon,
                link: item.link
            }

            // Se tem submenus, limpa eles também
            if (item.subs && item.subs.length > 0) {
                cleanItem.subs = item.subs.map(sub => ({
                    ...(sub.id && { id: sub.id }),
                    ...(sub.title && { title: sub.title }),
                    link: sub.link,
                    ...(sub.icon && { icon: sub.icon })
                }))
            }

            return cleanItem
        })
    }

    /**
     * Verifica se o usuário tem uma permissão específica
     * Usa o mapeamento de recursos RBAC -> Menu
     */
    private static checkPermission(
        permissions: Permission[],
        menuResource: string,
        menuAction: string,
        isServerAdmin: boolean
    ): boolean {
        // Itera sobre todas as permissões do usuário
        for (const permission of permissions) {
            // Ignora permissões negadas
            if (!permission.allowed) continue

            // Verifica se o recurso RBAC mapeia para o recurso do menu
            const resourceMatches = isMenuResourceAllowed(
                permission.resource,
                menuResource,
                isServerAdmin
            )

            if (!resourceMatches) continue

            // Verifica se a ação é permitida
            const actionMatches = mapActionToMenuAction(
                permission.action,
                menuAction
            )

            if (actionMatches) {
                return true
            }
        }

        return false
    }

    /**
     * Constrói o menu completo baseado no tipo de usuário
     * Retorna menu LIMPO (sem resource e action)
     */
    static buildMenu(
        permissions: Permission[],
        isServerAdmin: boolean
    ): CleanMenuItem[] {
        // Menu base
        let availableMenu = [...FULL_MENU]

        // Adiciona menu de admin se for admin de servidor
        if (isServerAdmin) {
            availableMenu = [...availableMenu, ...ADMIN_MENU]
        }

        // Filtra baseado nas permissões
        const filteredMenu = this.filterMenuByPermissions(
            availableMenu,
            permissions,
            isServerAdmin
        )

        // Remove campos resource e action antes de retornar
        return this.cleanMenu(filteredMenu)
    }
}