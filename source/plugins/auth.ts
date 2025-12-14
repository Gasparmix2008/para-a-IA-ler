import fp from 'fastify-plugin'
import { PrismaClient, Prisma } from "@prisma/client"
import { RolePermission } from '../core/auth/types'

const prisma = new PrismaClient()

export default fp(async (fastify) => {
    fastify.decorateRequest('admin', undefined)

    fastify.addHook('preHandler', async (req) => {
        const adminId = req.headers['x-admin-id'] as string
        if (!adminId) return

        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            include: {
                role: {
                    include: { permissions: true }
                }
            }
        })

        if (admin) {
            // Transformar as permissões do Prisma para o tipo custom
            const transformedPermissions: RolePermission[] = admin.role.permissions.map(p => ({
                id: p.id,
                roleId: p.roleId,
                resource: p.resource as RolePermission['resource'],
                action: p.action as RolePermission['action'],
                allowed: p.allowed,
                // Converter null para undefined
                attributes: p.attributes 
                    ? (p.attributes as Prisma.JsonObject) as RolePermission['attributes']
                    : undefined
            }))

            req.admin = {
                ...admin,
                role: {
                    ...admin.role,
                    permissions: transformedPermissions
                }
            }
        }
    })
})