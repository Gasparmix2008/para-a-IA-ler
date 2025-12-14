import { RolePermission as PrismaRolePermission } from '@prisma/client'
import { Action, Resource } from './permissions'

// Sobrescrever os tipos do Prisma
export type RolePermission = Omit<PrismaRolePermission, 'resource' | 'action' | 'attributes'> & {
    resource: Resource
    action: Action
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