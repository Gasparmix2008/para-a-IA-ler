// ===============================================
// menu.service.ts
// ===============================================

import { PermissionAction } from '@prisma/client'
import { MenuItem, ADMIN_MENU, FULL_MENU } from '../../../config/frontend/menu/menu.config'

// Permissão REAL vinda do Prisma
export interface Permission {
  resource: string
  action: PermissionAction
  attributes?: any
}

// Tipo do menu retornado (limpo)
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

export class MenuService {
  // ================================
  // CONSTRUTOR PRINCIPAL
  // ================================
  static buildMenu(
    permissions: Permission[],
    isServerAdmin: boolean
  ): CleanMenuItem[] {
    let availableMenu = [...FULL_MENU]

    if (isServerAdmin) {
      availableMenu = [...availableMenu, ...ADMIN_MENU]
    }

    const filteredMenu = this.filterMenuByPermissions(
      availableMenu,
      permissions,
      isServerAdmin
    )

    return this.cleanMenu(filteredMenu)
  }

  // ================================
  // FILTRA MENU POR PERMISSÕES
  // ================================
  private static filterMenuByPermissions(
    menu: MenuItem[],
    permissions: Permission[],
    isServerAdmin: boolean
  ): MenuItem[] {
    return menu
      .map(item => {
        const hasPermission = this.checkPermission(
          permissions,
          item.resource,
          item.action,
          isServerAdmin
        )

        if (!hasPermission) return null

        if (item.subs?.length) {
          const subs = item.subs.filter((sub: { resource: string; action: string }) =>
            this.checkPermission(
              permissions,
              sub.resource,
              sub.action,
              isServerAdmin
            )
          )

          if (subs.length === 0) return null

          return { ...item, subs }
        }

        return item
      })
      .filter((item): item is MenuItem => item !== null)
  }

  // ================================
  // CHECK DE PERMISSÃO (RBAC CORE)
  // ================================
  private static checkPermission(
    permissions: Permission[],
    resource: string,
    action: PermissionAction | string,
    isServerAdmin: boolean
  ): boolean {
    if (isServerAdmin) return true

    return permissions.some(permission => {
      if (permission.resource !== resource) return false

      // MANAGE cobre tudo
      if (permission.action === PermissionAction.MANAGE) return true

      return permission.action === action
    })
  }

  // ================================
  // LIMPA MENU (REMOVE RESOURCE/ACTION)
  // ================================
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
}
