import { PermissionAction, Resource } from "@prisma/client"
// menu.config.ts
export interface MenuItem {
    id: string
    title: string
    icon: string
    link: string
    resource: Resource
    isActive: boolean
    action: PermissionAction
    subs?: SubMenuItem[]
}

export interface SubMenuItem {
    id?: string
    title?: string
    link: string
    icon?: string
    resource: string
    action: string
}


/* 
    manager@company.com
    super@company.com
    staff@company.com

    SENHA: 123
*/

// Menu completo com todas as rotas possíveis
export const FULL_MENU: MenuItem[] = [
    {
        id: "home",
        title: "Home",
        icon: "home",
        isActive: true,
        link: "/",
        resource: Resource.ORDER, //🎉🎉🎉🎉👯‍♀️👯‍♂️🍰FOI CARALHO, TMNC - RBAC E ABAC DE MEEEEERDAAAA, QUEM CRIOU TEM QUE SI FUDER MUITO
        action: PermissionAction.VIEW, // SE VC ESTÁ LENDO (FUTUROS PROGRAMADORES CLT'S KLKKKK), TEM MUUUUUUITA IA NESSA BOSTA, DEVE TÁ CHEIO DE COISA INUTIL KKKKKKKKKKKKKKKKKKKKK
        subs: [
            {
                id: "order-list",
                title: "List Orders",
                link: "/order",
                icon: "package",
                resource: "order",
                action: PermissionAction.VIEW
            },
            {
                id: "order-links",
                title: "Order Links",
                link: "/order/links",
                icon: "link",
                resource: "order",
                action: PermissionAction.VIEW
            }
        ]
    },
    {
        id: "products",
        title: "Products",
        icon: "package",
        link: "/products",
        isActive: false,
        resource: Resource.PRODUCT,
        action: PermissionAction.VIEW,
        subs: [
            {
                id: "products-list",
                title: "List Products",
                link: "/products",
                icon: "package",
                resource: "product",
                action: PermissionAction.VIEW
            },
            {
                id: "products-links",
                title: "Product Links",
                link: "/products/links",
                icon: "link",
                resource: "product",
                action: PermissionAction.VIEW
            },
            {
                id: "products-discounts",
                title: "Discounts",
                link: "/products/discounts",
                icon: "percent",
                resource: Resource.PRODUCT,
                action: "manage"
            }
        ]
    },
    {
        id: "customers",
        title: "Customers",
        icon: "users",
        link: "/customers",
        isActive: false,
        resource: Resource.CUSTOMER,
        action: PermissionAction.VIEW,
        subs: [
            {
                id: "whatsapp",
                title: "Whatsapp",
                link: "/message/whatsapp",
                icon: "arrow-down",
                resource: "customer",
                action: PermissionAction.VIEW
            },
        ]
    },
    {
        id: Resource.FINANCE,
        title: Resource.FINANCE,
        icon: "dollar-sign",
        link: "/finance",
        isActive: false,
        resource: Resource.FINANCE,
        action: PermissionAction.VIEW,
        subs: [
            {
                id: "finance-incoming",
                title: "Incoming",
                link: "/finance/incoming",
                icon: "arrow-down",
                resource: Resource.FINANCE,
                action: PermissionAction.VIEW
            },
            {
                id: "finance-outgoing",
                title: "Outgoing",
                link: "/finance/outgoing",
                icon: "arrow-up",
                resource: Resource.FINANCE,
                action: PermissionAction.VIEW
            },
            {
                id: "finance-payout",
                title: "Payout Account",
                link: "/finance/payout",
                icon: "credit-card",
                resource: Resource.FINANCE,
                action: PermissionAction.VIEW
            },

            {
                id: "order-discounts",
                title: "Discounts",
                link: "/order/discounts",
                icon: "percent",
                resource: Resource.FINANCE,
                action: PermissionAction.VIEW
            }
        ]
    },
]


// Menu adicional para admins de servidor
export const ADMIN_MENU: MenuItem[] = [
    {
        id: "admin-users",
        title: "Admin Users",
        icon: "users",
        link: "/server/admins",
        isActive: true,
        resource: Resource.ADMINS,
        action: PermissionAction.VIEW,
        subs: [
            {
                id: "admin-customers-list",
                title: "List Customers",
                link: "/server/customers",
                icon: "users",
                resource: "admins",
                action: PermissionAction.VIEW
            },
            {
                id: "admin-users-roles",
                title: "Roles & Permissions",
                link: "/admin/roles",
                icon: "shield",
                resource: "admin_users",
                action: "manage"
            }
        ]
    },
    {
        id: "admin-system",
        title: "System Settings",
        icon: "settings",
        isActive: false,
        link: "/admin/system",
        resource: Resource.OWNER,
        action: PermissionAction.VIEW
    },
    {
        id: "admin-logs",
        title: "System Logs",
        isActive: false,
        icon: "activity",
        link: "/admin/logs",
        resource: Resource.OWNER,
        action: PermissionAction.VIEW
    }
]
