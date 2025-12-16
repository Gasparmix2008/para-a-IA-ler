import { RolePermission as PrismaRolePermission, PermissionAction, Resource } from '@prisma/client'

// Sobrescrever os tipos do Prisma
export type RolePermission = Omit<PrismaRolePermission, 'resource' | 'action' | 'attributes'> & {
    resource: Resource
    action: PermissionAction
    attributes?: {
        denyFields?: string[]
        onlyOwnBusiness?: boolean
        maxValue?: number
    } // ← SEM null aqui
}

export type PermissionContext = {
    field?: string
    businessId?: string
    resourceBusinessId?: string
    value?: number
}