// menu.config.ts
import { Home, Package2, LinkIcon, Percent, PieChart, Activity, Sparkles, Users, ShoppingBag, Infinity, Store, TrendingUp, DollarSign, Settings } from "lucide-react"

export interface MenuItem {
    id: string
    title: string
    icon: any
    link: string
    resource: string // Recurso da permissão
    action: string // Ação requerida (view, create, update, delete)
    subs?: SubMenuItem[]
}

export interface SubMenuItem {
    id?: string
    title?: string
    link: string
    icon?: any
    resource: string
    action: string
}

// Menu completo com todas as rotas possíveis
export const FULL_MENU: MenuItem[] = [
    {
        id: "home",
        title: "Home",
        icon: Home,
        link: "/dashboard",
        resource: "dashboard",
        action: "view"
    },
    {
        id: "products",
        title: "Products",
        icon: Package2,
        link: "/products",
        resource: "products",
        action: "view",
        subs: [
            {
                id: "products-list",
                title: "List Products",
                link: "/products",
                icon: Package2,
                resource: "products",
                action: "view"
            },
            {
                id: "products-links",
                title: "Product Links",
                link: "/products/links",
                icon: LinkIcon,
                resource: "products",
                action: "view"
            },
            {
                id: "products-discounts",
                title: "Discounts",
                link: "/products/discounts",
                icon: Percent,
                resource: "products",
                action: "manage"
            }
        ]
    },
    {
        id: "usage-billing",
        title: "Usage Billing",
        icon: PieChart,
        link: "/billing",
        resource: "billing",
        action: "view",
        subs: [
            {
                id: "billing-meters",
                title: "Meters",
                link: "/billing/meters",
                icon: PieChart,
                resource: "billing",
                action: "view"
            },
            {
                id: "billing-events",
                title: "Events",
                link: "/billing/events",
                icon: Activity,
                resource: "billing",
                action: "view"
            }
        ]
    },
    {
        id: "benefits",
        title: "Benefits",
        icon: Sparkles,
        link: "/benefits",
        resource: "benefits",
        action: "view"
    },
    {
        id: "customers",
        title: "Customers",
        icon: Users,
        link: "/customers",
        resource: "customers",
        action: "view"
    },
    {
        id: "sales",
        title: "Sales",
        icon: ShoppingBag,
        link: "/sales",
        resource: "sales",
        action: "view",
        subs: [
            {
                id: "sales-orders",
                title: "Orders",
                link: "/sales/orders",
                icon: ShoppingBag,
                resource: "sales",
                action: "view"
            },
            {
                id: "sales-subscriptions",
                title: "Subscriptions",
                link: "/sales/subscriptions",
                icon: Infinity,
                resource: "sales",
                action: "view"
            }
        ]
    },
    {
        id: "storefront",
        title: "Storefront",
        icon: Store,
        link: "/storefront",
        resource: "storefront",
        action: "view"
    },
    {
        id: "analytics",
        title: "Analytics",
        icon: TrendingUp,
        link: "/analytics",
        resource: "analytics",
        action: "view"
    },
    {
        id: "finance",
        title: "Finance",
        icon: DollarSign,
        link: "/finance",
        resource: "finance",
        action: "view",
        subs: [
            {
                id: "finance-incoming",
                title: "Incoming",
                link: "/finance/incoming",
                resource: "finance",
                action: "view"
            },
            {
                id: "finance-outgoing",
                title: "Outgoing",
                link: "/finance/outgoing",
                resource: "finance",
                action: "view"
            },
            {
                id: "finance-payout",
                title: "Payout Account",
                link: "/finance/payout",
                resource: "finance",
                action: "manage"
            }
        ]
    },
    {
        id: "settings",
        title: "Settings",
        icon: Settings,
        link: "/settings",
        resource: "settings",
        action: "view",
        subs: [
            {
                id: "settings-general",
                title: "General",
                link: "/settings/general",
                resource: "settings",
                action: "view"
            },
            {
                id: "settings-webhooks",
                title: "Webhooks",
                link: "/settings/webhooks",
                resource: "settings",
                action: "manage"
            },
            {
                id: "settings-custom-fields",
                title: "Custom Fields",
                link: "/settings/custom-fields",
                resource: "settings",
                action: "manage"
            }
        ]
    }
]

// Menu adicional para admins de servidor
export const ADMIN_MENU: MenuItem[] = [
    {
        id: "admin-users",
        title: "Admin Users",
        icon: Users,
        link: "/admin/users",
        resource: "admin_users",
        action: "view",
        subs: [
            {
                id: "admin-users-list",
                title: "List Users",
                link: "/admin/users",
                resource: "admin_users",
                action: "view"
            },
            {
                id: "admin-users-roles",
                title: "Roles & Permissions",
                link: "/admin/roles",
                resource: "admin_users",
                action: "manage"
            }
        ]
    },
    {
        id: "admin-system",
        title: "System Settings",
        icon: Settings,
        link: "/admin/system",
        resource: "system_settings",
        action: "view"
    },
    {
        id: "admin-logs",
        title: "System Logs",
        icon: Activity,
        link: "/admin/logs",
        resource: "system_logs",
        action: "view"
    }
]