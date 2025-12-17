import { PermissionAction, Resource } from "@prisma/client"
// menu.config.ts
export interface MenuItem {
    title: string
    icon: string
    link: string
    resource: Resource
    isActive: boolean
    action: PermissionAction
    subs?: SubMenuItem[]
}

export interface SubMenuItem {
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
        title: "Order",
        icon: "listordered",
        isActive: true,
        link: "/order",
        resource: Resource.ORDER, //🎉🎉🎉🎉👯‍♀️👯‍♂️🍰FOI CARALHO, TMNC - RBAC, ACL E ABAC DE MEEEEERDAAAA, QUEM CRIOU TEM QUE SI FUDER MUITO
        action: PermissionAction.VIEW, // SE VC ESTÁ LENDO (FUTUROS PROGRAMADORES CLT'S KLKKKK), TEM MUUUUUUITA IA NESSA BOSTA, DEVE TÁ CHEIO DE COISA INUTIL KKKKKKKKKKKKKKKKKKKKK
    },
    {
        title: "Products",
        icon: "package",
        link: "/products",
        isActive: false,
        resource: Resource.PRODUCT,
        action: PermissionAction.VIEW,
        subs: [
            {
                title: "List Products",
                link: "/products",
                icon: "package",
                resource: "product",
                action: PermissionAction.VIEW
            },
            {
                title: "Product Links",
                link: "/products/links",
                icon: "link",
                resource: "product",
                action: PermissionAction.VIEW
            },
            {
                title: "Discounts",
                link: "/products/discounts",
                icon: "percent",
                resource: Resource.PRODUCT,
                action: "manage"
            }
        ]
    },
    {
        title: "Customers",
        icon: "users",
        link: "/customers",
        isActive: false,
        resource: Resource.CUSTOMER,
        action: PermissionAction.VIEW,
        subs: [
            {
                title: "Whatsapp",
                link: "/message/whatsapp",
                icon: "arrow-down",
                resource: "customer",
                action: PermissionAction.VIEW
            },
        ]
    },
    {
        title: "Finance",
        icon: "dollar-sign",
        link: "/finance",
        isActive: false,
        resource: Resource.FINANCE,
        action: PermissionAction.VIEW,
        subs: [
            {
                title: "Incoming",
                link: "/finance/incoming",
                icon: "arrow-down",
                resource: Resource.FINANCE,
                action: PermissionAction.VIEW
            },
            {
                title: "Outgoing",
                link: "/finance/outgoing",
                icon: "arrow-up",
                resource: Resource.FINANCE,
                action: PermissionAction.VIEW
            },
            {
                title: "Payout Account",
                link: "/finance/payout",
                icon: "credit-card",
                resource: Resource.FINANCE,
                action: PermissionAction.VIEW
            },

            {
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
        title: "Admin Users",
        icon: "users",
        link: "/server/admins",
        isActive: true,
        resource: Resource.ADMINS,
        action: PermissionAction.VIEW,
        subs: [
            {
                title: "List Customers",
                link: "/server/customers",
                icon: "users",
                resource: "admins",
                action: PermissionAction.VIEW
            },
            {
                title: "Roles & Permissions",
                link: "/admin/roles",
                icon: "shield",
                resource: "admins",
                action: PermissionAction.VIEW
            }
        ]
    },
    {
        title: "System Settings",
        icon: "settings",
        isActive: false,
        link: "/admin/system",
        resource: Resource.OWNER,
        action: PermissionAction.VIEW
    },
    {
        title: "System Logs",
        isActive: false,
        icon: "activity",
        link: "/admin/logs",
        resource: Resource.OWNER,
        action: PermissionAction.VIEW
    }
]
