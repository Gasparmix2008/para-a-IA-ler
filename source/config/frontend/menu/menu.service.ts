import { MenuItem, ADMIN_MENU, FULL_MENU } from "./menu.config"
import { PermissionAction, Resource } from "@prisma/client"

export interface Permission {
    resource: Resource
    action: PermissionAction
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

    static buildMenu(
        permissions: Permission[],
        isServerAdmin: boolean
    ): CleanMenuItem[] {

        const baseMenu = isServerAdmin
            ? [...FULL_MENU, ...ADMIN_MENU]
            : [...FULL_MENU]

        const filtered = this.filterByPermissions(
            baseMenu,
            permissions,
            isServerAdmin
        )

        return this.cleanMenu(filtered)
    }

    // ==============================
    // Private helpers
    // ==============================
    private static filterByPermissions(
        menu: MenuItem[],
        permissions: Permission[],
        isServerAdmin: boolean
    ): MenuItem[] {
        return menu
            .map(item => {
                if (!this.hasPermission(permissions, item.resource, item.action, isServerAdmin)) {
                    return null
                }

                if (!item.subs?.length) return item

                const subs = item.subs.filter(sub =>
                    this.hasPermission(permissions, sub.resource as Resource, sub.action as PermissionAction, isServerAdmin)
                )

                return subs.length ? { ...item, subs } : null
            })
            .filter(Boolean) as MenuItem[]
    }

    private static hasPermission(
        permissions: Permission[],
        resource: Resource,
        action: PermissionAction,
        isServerAdmin: boolean
    ): boolean {
        if (isServerAdmin) return true

        return permissions.some(p =>
            p.resource === resource &&
            (
                p.action === PermissionAction.MANAGE ||
                p.action === action
            )
        )
    }

    private static cleanMenu(menu: MenuItem[]): CleanMenuItem[] {
        return menu.map(item => ({
            id: item.id,
            title: item.title,
            icon: item.icon,
            link: item.link,
            ...(item.isActive !== undefined && { isActive: item.isActive }),
            ...(item.subs && {
                subs: item.subs.map(sub => ({
                    ...(sub.id && { id: sub.id }),
                    ...(sub.title && { title: sub.title }),
                    link: sub.link,
                    ...(sub.icon && { icon: sub.icon })
                }))
            })
        }))
    }
}
