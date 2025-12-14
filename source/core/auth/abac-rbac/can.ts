import { Action, Resource } from './permissions'
import { RolePermission, PermissionContext } from './types' // ← importar daqui

export function can(
    permissions: RolePermission[],
    resource: Resource,
    action: Action,
    ctx: PermissionContext = {}
): boolean {
    const permission = permissions.find(p =>
        p.resource === resource &&
        (p.action === action || p.action === 'manage') &&
        p.allowed
    )

    if (!permission) return false

    const attrs = permission.attributes
    if (!attrs) return true

    if (attrs.onlyOwnBusiness && ctx.businessId !== ctx.resourceBusinessId) {
        return false
    }

    if (attrs.denyFields?.includes(ctx.field ?? '')) {
        return false
    }

    if (attrs.maxValue && (ctx.value ?? 0) > attrs.maxValue) {
        return false
    }

    return true
}