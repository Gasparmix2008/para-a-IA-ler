import { MenuItem, ADMIN_MENU, FULL_MENU } from "./menu.config"
import { PermissionAction, Resource } from "@prisma/client"

// ==============================
// Tipos de Permission (aceita múltiplos formatos)
// ==============================
export interface Permission {
    resource: Resource
    action: PermissionAction
    attributes?: any
}

export interface RolePermission {
    id: string
    resource: Resource
    action: PermissionAction
    attributes?: any
    roleId: string
}

// ==============================
// Tipos limpos (frontend)
// ==============================
export interface CleanMenuItem {
    id: string
    title: string
    icon: string
    link: string
    isActive?: boolean
    subs?: CleanSubMenuItem[]
}

export interface CleanSubMenuItem {
    id?: string
    title?: string
    link: string
    icon?: string
}

// ==============================
// Menu Service
// ==============================
export class MenuService {

    /**
     * Normaliza as permissões vindas do backend
     */
    private static normalizePermissions(perms: any[]): Permission[] {
        if (!perms || !Array.isArray(perms)) {
            console.warn('⚠️ Permissions inválidas:', perms)
            return []
        }

        return perms.map(p => ({
            resource: p.resource,
            action: p.action,
            attributes: p.attributes
        }))
    }

    /**
     * Build menu principal
     */
    static buildMenu(
        permissionsInput: any[] | Permission[],
        isServerAdmin: boolean = false,
        debug: boolean = false
    ): CleanMenuItem[] {

        // Normaliza as permissions
        const permissions = this.normalizePermissions(permissionsInput)

        if (debug) {
            console.log('🔍 DEBUG MenuService:')
            console.log('- isServerAdmin:', isServerAdmin)
            console.log('- Permissions normalizadas:', permissions)
            console.log('- Total permissions:', permissions.length)
        }

        // Se for SERVER admin, retorna tudo
        if (isServerAdmin) {
            const fullMenu = [...FULL_MENU, ...ADMIN_MENU]
            return this.cleanMenu(fullMenu)
        }

        // Se não tiver permissões, retorna vazio
        if (!permissions.length) {
            console.warn('⚠️ Nenhuma permissão encontrada!')
            return []
        }

        // Filtra o menu base
        const baseMenu = [...FULL_MENU]
        const filtered = this.filterByPermissions(baseMenu, permissions, debug)

        if (debug) {
            console.log('- Menu filtrado:', filtered.length, 'itens')
        }

        return this.cleanMenu(filtered)
    }

    /**
     * Build menu de admin (separado do menu principal)
     */
    static buildAdminMenu(
        permissionsInput: any[] | Permission[],
        isServerAdmin: boolean = false,
        debug: boolean = false
    ): CleanMenuItem[] {

        const permissions = this.normalizePermissions(permissionsInput)

        // Apenas SERVER admins veem o menu de admin
        if (!isServerAdmin) {
            return []
        }

        const filtered = this.filterByPermissions(ADMIN_MENU, permissions, debug)
        return this.cleanMenu(filtered)
    }

    // ==============================
    // Private helpers
    // ==============================
    private static filterByPermissions(
        menu: MenuItem[],
        permissions: Permission[],
        debug: boolean = false
    ): MenuItem[] {
        return menu
            .map(item => {
                const hasAccess = this.hasPermission(
                    permissions,
                    item.resource,
                    item.action
                )

                if (debug) {
                    console.log(`  - ${item.title} (${item.resource}/${item.action}):`, hasAccess)
                }

                if (!hasAccess) return null

                // Se não tem submenu, retorna o item
                if (!item.subs?.length) return item

                // Filtra os subitens
                const subs = item.subs.filter((sub) => {
                    const subAccess = this.hasPermission(
                        permissions,
                        sub.resource as Resource,
                        sub.action as PermissionAction
                    )

                    if (debug) {
                        console.log(`    - ${sub.title} (${sub.resource}/${sub.action}):`, subAccess)
                    }

                    return subAccess
                })

                // Se todos os subitens foram filtrados, remove o item pai
                return subs.length ? { ...item, subs } : null
            })
            .filter(Boolean) as MenuItem[]
    }

    private static hasPermission(
        permissions: Permission[],
        resource: Resource,
        action: PermissionAction
    ): boolean {
        return permissions.some(p => {
            // Match exato
            if (p.resource === resource && p.action === action) {
                return true
            }

            // MANAGE dá acesso a todas as ações do recurso
            if (p.resource === resource && p.action === PermissionAction.MANAGE) {
                return true
            }

            // OWNER dá acesso a tudo (fallback para super admins)
            if (p.resource === Resource.OWNER) {
                return true
            }

            return false
        })
    }

    private static cleanMenu(menu: MenuItem[]): CleanMenuItem[] {
        return menu.map(item => ({
            id: item.id,
            title: item.title,
            icon: item.icon,
            link: item.link,
            ...(item.isActive !== undefined && { isActive: item.isActive }),
            ...(item.subs && {
                subs: item.subs.map((sub) => ({
                    ...(sub.id && { id: sub.id }),
                    ...(sub.title && { title: sub.title }),
                    link: sub.link,
                    ...(sub.icon && { icon: sub.icon })
                }))
            })
        }))
    }

    // ==============================
    // Utilitários de Debug
    // ==============================

    /**
     * Verifica se o usuário tem acesso a uma rota específica
     */
    static canAccess(
        route: string,
        permissionsInput: any[] | Permission[],
        isServerAdmin: boolean = false
    ): boolean {
        if (isServerAdmin) return true

        const permissions = this.normalizePermissions(permissionsInput)
        const allItems = [...FULL_MENU, ...ADMIN_MENU]

        // Busca o item da rota
        for (const item of allItems) {
            if (item.link === route) {
                return this.hasPermission(permissions, item.resource, item.action)
            }

            if (item.subs) {
                for (const sub of item.subs) {
                    if (sub.link === route) {
                        return this.hasPermission(
                            permissions,
                            sub.resource as Resource,
                            sub.action as PermissionAction
                        )
                    }
                }
            }
        }

        return false
    }

    /**
     * Retorna todas as rotas que o usuário tem acesso
     */
    static getAllowedRoutes(
        permissionsInput: any[] | Permission[],
        isServerAdmin: boolean = false
    ): string[] {
        const menu = this.buildMenu(permissionsInput, isServerAdmin)
        const routes: string[] = []

        for (const item of menu) {
            routes.push(item.link)

            if (item.subs) {
                for (const sub of item.subs) {
                    routes.push(sub.link)
                }
            }
        }

        return routes
    }

    /**
     * Debug helper - mostra todas as permissões e o menu gerado
     */
    static debug(
        permissionsInput: any[] | Permission[],
        isServerAdmin: boolean = false
    ): void {
        console.log('='.repeat(60))
        console.log('🔍 MENU SERVICE DEBUG')
        console.log('='.repeat(60))

        const permissions = this.normalizePermissions(permissionsInput)

        console.log('\n📋 Permissões:')
        permissions.forEach(p => {
            console.log(`  - ${p.resource} / ${p.action}`)
        })

        console.log('\n🎯 isServerAdmin:', isServerAdmin)

        console.log('\n📱 Menu Principal:')
        const mainMenu = this.buildMenu(permissionsInput, isServerAdmin, true)
        console.log(JSON.stringify(mainMenu, null, 2))

        console.log('\n⚙️ Menu Admin:')
        const adminMenu = this.buildAdminMenu(permissionsInput, isServerAdmin, true)
        console.log(JSON.stringify(adminMenu, null, 2))

        console.log('\n🛣️ Rotas Permitidas:')
        const routes = this.getAllowedRoutes(permissionsInput, isServerAdmin)
        routes.forEach(r => console.log(`  - ${r}`))

        console.log('\n' + '='.repeat(60))
    }
}

// ==============================
// Exemplos de uso
// ==============================

/*
// Caso 1: Dados do backend com "permissions" correto
const role = {
    permissions: [
        { resource: "ORDER", action: "VIEW" },
        { resource: "PRODUCT", action: "VIEW" },
        { resource: "CUSTOMER", action: "MANAGE" }
    ]
}

const menu = MenuService.buildMenu(role.permissions, false)

// Caso 2: Debug completo
MenuService.debug(role.permissions, false)

// Caso 3: Verificar acesso a uma rota
const canAccess = MenuService.canAccess('/products', role.permissions, false)

// Caso 4: Admin de servidor
const adminMenu = MenuService.buildMenu([], true) // retorna tudo

*/