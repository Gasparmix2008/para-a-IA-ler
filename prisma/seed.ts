import { PrismaClient, PermissionAction, AdminType, Resource } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ================================
  // TENANT
  // ================================
  const tenant = await prisma.tenant.upsert({
    where: { name: 'Default Company' },
    update: {},
    create: {
      name: 'Default Company'
    }
  })

  // ================================
  // ROLE: SUPER
  // ================================
  const superRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Super'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Super',
      description: 'Acesso total ao sistema',
      permissions: {
        create: [
          { resource: Resource.PRODUCT, action: PermissionAction.MANAGE },
          { resource: Resource.ORDER, action: PermissionAction.MANAGE },
          { resource: Resource.FINANCE, action: PermissionAction.MANAGE },
          { resource: Resource.CUSTOMER, action: PermissionAction.MANAGE },
          { resource: Resource.ADMINS, action: PermissionAction.MANAGE }
        ]
      }
    }
  })

  // ================================
  // ROLE: MANAGER
  // ================================
  const managerRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Manager'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Manager',
      description: 'Gerente com restrições financeiras',
      permissions: {
        create: [
          { resource: Resource.PRODUCT, action: PermissionAction.MANAGE },
          { resource: Resource.ORDER, action: PermissionAction.MANAGE },
          { resource: Resource.FINANCE, action: PermissionAction.VIEW },
          {
            resource: Resource.FINANCE,
            action: PermissionAction.CREATE,
            attributes: { maxValue: 5000 }
          },
          { resource: Resource.CUSTOMER, action: PermissionAction.VIEW }
        ]
      }
    }
  })

  // ================================
  // ROLE: STAFF
  // ================================
  const staffRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Staff'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Staff',
      description: 'Funcionário com acesso limitado',
      permissions: {
        create: [
          { resource: Resource.PRODUCT, action: PermissionAction.VIEW },
          { resource: Resource.ORDER, action: PermissionAction.VIEW }
        ]
      }
    }
  })

  // ================================
  // ADMINS
  // ================================
  await prisma.admin.upsert({
    where: { email: 'super@company.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Super',
      email: 'super@company.com',
      passwordHash: '$2b$10$pHOuuh2zN3k9r/WVIb8eO.KBzwqGU6osI3UmnlklQx1UyhHFK4CVC',
      type: AdminType.BUSINESS,
      roleId: superRole.id
    }
  })

  await prisma.admin.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Manager User',
      email: 'manager@company.com',
      passwordHash: '$2b$10$pHOuuh2zN3k9r/WVIb8eO.KBzwqGU6osI3UmnlklQx1UyhHFK4CVC',
      type: AdminType.BUSINESS,
      roleId: managerRole.id
    }
  })

  await prisma.admin.upsert({
    where: { email: 'staff@company.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Staff User',
      email: 'staff@company.com',
      passwordHash: '$2b$10$pHOuuh2zN3k9r/WVIb8eO.KBzwqGU6osI3UmnlklQx1UyhHFK4CVC',
      type: AdminType.BUSINESS,
      roleId: staffRole.id
    }
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
