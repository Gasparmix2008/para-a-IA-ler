import { FastifyRequest } from 'fastify'
import { PrismaClient } from "@prisma/client";
import { JwtService } from './jwt.service';
import { RolePermission } from './abac-rbac/types';
import { Resource, Action } from './abac-rbac/permissions';

const prisma = new PrismaClient();

export async function authGuard(
    request: FastifyRequest
) {
    const token = request.cookies?.token;
    console.log(token)
    if (!token) {
        return "Unauthorized"
    }

    const sessionId = JwtService.verify(token) as { rawToken: string }

    // Busca Session
    const session = await prisma.session.findFirst({
        where: {
            token: sessionId.rawToken,
            active: true,
            expiresAt: { gt: new Date() }
        },
        include: {
            admin: {
                include: {
                    role: {
                        include: { permissions: true }
                    }
                }
            }
        }
    })

    if (!session || !session.admin.isActive) {
        return "Session expired"
    }

    // Transform Prisma permissions to your custom type
    const transformedAdmin = {
        ...session.admin,
        role: {
            ...session.admin.role,
            permissions: session.admin.role.permissions.map(p => ({
                ...p,
                resource: p.resource as Resource,
                action: p.action as Action,
                attributes: p.attributes as RolePermission['attributes']
            }))
        }
    }

    // Injeta no request
    request.admin = transformedAdmin
    request.session = session
}