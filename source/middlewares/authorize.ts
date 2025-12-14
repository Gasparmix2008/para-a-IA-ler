import { FastifyReply, FastifyRequest } from 'fastify'
import { can } from '../core/auth/can'
import { Action, Resource } from '../core/auth/abac-rbac'

export function authorize(resource: Resource, action: Action) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        if (!req.admin) {
            return reply.status(401).send({ error: 'Unauthorized' })
        }

        if (!can(req.admin.role.permissions, resource, action, req.context)) {
            return reply.status(403).send({ error: 'Forbidden' })
        }
    }
}