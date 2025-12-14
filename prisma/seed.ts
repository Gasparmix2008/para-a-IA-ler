import { PrismaClient } from '@prisma/client'
import { Resources, Actions } from '../source/core/auth/abac-rbac'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Criar Role: SuperAdmin (acesso total)
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SuperAdmin' },
    update: {},
    create: {
      name: 'SuperAdmin',
      description: 'Acesso total ao sistema',
      permissions: {
        create: [
          { resource: Resources.PRODUCT, action: Actions.MANAGE, allowed: true },
          { resource: Resources.ORDER, action: Actions.MANAGE, allowed: true },
          { resource: Resources.FINANCE, action: Actions.MANAGE, allowed: true },
          { resource: Resources.CUSTOMER, action: Actions.MANAGE, allowed: true },
          { resource: Resources.ADMINS, action: Actions.MANAGE, allowed: true },
        ]
      }
    }
  })

  // 2. Criar Role: Manager (gerente)
  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Gerente com restrições em finanças',
      permissions: {
        create: [
          { resource: Resources.PRODUCT, action: Actions.MANAGE, allowed: true },
          { resource: Resources.ORDER, action: Actions.MANAGE, allowed: true },
          { 
            resource: Resources.FINANCE, 
            action: Actions.VIEW, 
            allowed: true 
          },
          { 
            resource: Resources.FINANCE, 
            action: Actions.CREATE, 
            allowed: true,
            attributes: {
              maxValue: 5000 // Limite de R$ 5.000
            }
          },
          { resource: Resources.CUSTOMER, action: Actions.VIEW, allowed: true },
        ]
      }
    }
  })

  // 3. Criar Role: Staff (funcionário)
  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: {
      name: 'Staff',
      description: 'Funcionário com acesso limitado',
      permissions: {
        create: [
          { resource: Resources.PRODUCT, action: Actions.VIEW, allowed: true },
          { resource: Resources.ORDER, action: Actions.VIEW, allowed: true },
          { resource: Resources.ORDER, action: Actions.UPDATE, allowed: true },
          { 
            resource: Resources.FINANCE, 
            action: Actions.VIEW, 
            allowed: true,
            attributes: {
              denyFields: ['profit', 'cost'] // Não pode ver lucro/custo
            }
          },
        ]
      }
    }
  })

  // 4. Criar Admins de teste
  const superAdmin = await prisma.admin.upsert({
    where: { email: 'super@admin.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'super@admin.com',
      password: 'hashed_password_here',
      type: 'SERVER',
      roleId: superAdminRole.id
    }
  })

  const manager = await prisma.admin.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      name: 'Manager User',
      email: 'manager@company.com',
      password: 'hashed_password_here',
      type: 'BUSINESS',
      roleId: managerRole.id
    }
  })

  const staff = await prisma.admin.upsert({
    where: { email: 'staff@company.com' },
    update: {},
    create: {
      name: 'Staff User',
      email: 'staff@company.com',
      password: 'hashed_password_here',
      type: 'BUSINESS',
      roleId: staffRole.id
    }
  })

  console.log('✅ Database seeded!')
  console.log('\n📋 Admin IDs para testes:')
  console.log(`SuperAdmin: ${superAdmin.id}`)
  console.log(`Manager: ${manager.id}`)
  console.log(`Staff: ${staff.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })