// RBAC

export const Resources = {
  PRODUCT: 'product', // GERENCIAMENTO DE PRODUTOS
  ORDER: 'order', // GERENCIAMENTO DE PEDIDOS
  FINANCE: 'finance', // GERENCIAMENTO DE FINANÇAS/DASHBOARD
  CUSTOMER: 'customer', // GERENCIAMENTO DE CLIENTES
  SUPORT: 'suport', // MENSAGENS ENTRE CLIENTE E ADMIN
  ADMINS: 'admins', // GERENCIA
} as const

export const Actions = {
  VIEW: 'view', // GET
  CREATE: 'create', // POST
  UPDATE: 'update', // PUT
  DELETE: 'delete', // DELETE
  MANAGE: 'manage', // GET, POST, PUT, DELETE
} as const

export type Resource = typeof Resources[keyof typeof Resources]
export type Action = typeof Actions[keyof typeof Actions]
