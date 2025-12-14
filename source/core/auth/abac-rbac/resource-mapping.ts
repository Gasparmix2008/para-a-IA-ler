// ===============================================
// resource-mapping.ts
// Mapeamento entre recursos do RBAC e recursos do Menu
// ===============================================

import { Resources } from './permissions'

/**
 * Mapeia recursos do banco de dados (RBAC) para recursos do menu frontend
 * 
 * Estrutura:
 * - Chave: Recurso do banco de dados (ex: 'product')
 * - Valor: Array de recursos do menu que esse recurso permite acessar
 */
export const RESOURCE_TO_MENU_MAP: Record<string, string[]> = {
    // PRODUCT -> products, billing
    [Resources.PRODUCT]: [
        'products',      // Menu de produtos
        'billing',       // Usage billing (produtos com billing)
        'benefits',      // Benefícios dos produtos
    ],

    // ORDER -> sales, analytics
    [Resources.ORDER]: [
        'sales',         // Vendas (orders + subscriptions)
        'analytics',     // Analytics de vendas
        'storefront',    // Loja (relacionado a vendas)
    ],

    // FINANCE -> finance
    [Resources.FINANCE]: [
        'finance',       // Menu financeiro completo
    ],

    // CUSTOMER -> customers
    [Resources.CUSTOMER]: [
        'customers',     // Menu de clientes
    ],

    // SUPORT -> dashboard (suporte vê dashboard básico)
    [Resources.SUPORT]: [
        'dashboard',     // Dashboard básico
    ],

    // ADMINS -> admin menus (apenas para SERVER admins)
    [Resources.ADMINS]: [
        'admin_users',    // Gerenciar usuários admin
        'system_settings', // Configurações do sistema
        'system_logs',    // Logs do sistema
        'settings',       // Settings gerais
    ],
}

/**
 * Recursos que APENAS admins SERVER podem acessar
 * Mesmo que tenham permissão 'admins', usuários BUSINESS não verão estes
 */
export const ADMIN_ONLY_RESOURCES = [
    'system_logs',      // Logs do sistema - apenas SERVER admin
    'system_settings',  // Configurações de sistema - apenas SERVER admin
]

/**
 * Mapeia uma ação do RBAC para ações do menu
 * 
 * Lógica:
 * - 'manage' permite tanto 'view' quanto 'manage'
 * - Outras ações são mapeadas diretamente
 */
export function mapActionToMenuAction(
    rbacAction: string,
    menuAction: string
): boolean {
    // Se a permissão é 'manage', permite qualquer ação
    if (rbacAction === 'manage') {
        return true
    }

    // Caso contrário, precisa ser exatamente a mesma ação
    return rbacAction === menuAction
}

/**
 * Verifica se um recurso do menu é permitido por um recurso do RBAC
 */
export function isMenuResourceAllowed(
    rbacResource: string,
    menuResource: string,
    isServerAdmin: boolean = false
): boolean {
    // Bloqueia recursos exclusivos para não-SERVER admins
    if (ADMIN_ONLY_RESOURCES.includes(menuResource) && !isServerAdmin) {
        return false
    }

    const allowedMenuResources = RESOURCE_TO_MENU_MAP[rbacResource]
    return allowedMenuResources?.includes(menuResource) ?? false
}