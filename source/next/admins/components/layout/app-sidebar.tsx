"use client"

import * as React from "react"
import * as LucideIcons from "lucide-react"
import {
  Command,
  SquareTerminal,
  Loader2,
} from "lucide-react"

import { NavMain } from "@/components/layout/sidebar/nav-main"
import { NavUser } from "@/components/layout/sidebar/nav-user"
import { TeamSwitcher } from "@/components/layout/sidebar/team"
import { SiteHeader } from "@/components/layout/sidebar/side-header"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"

// Tipos para o novo formato de menu
type SubItem = {
  id: string
  title: string
  link: string
  icon?: any
  resource?: string
  permissions?: string[]
}

type MenuItem = {
  id: string
  title: string
  icon?: any
  link: string
  subs?: SubItem[]
  resource?: string
  permissions?: string[]
  isActive?: boolean
}

// Tipo compatível com NavMain
type NavSection = {
  title: string
  url: string
  icon: any
  isActive?: boolean
  resource?: string
  permissions?: string[]
  items?: Array<{
    title: string
    url: string
    resource?: string
    permissions?: string[]
  }>
}

// Função para obter ícone dinâmico do lucide-react
function getDynamicIcon(iconName: string): any {
  if (!iconName) return SquareTerminal

  // Garante que a primeira letra seja maiúscula
  const formattedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1)

  // Busca o ícone no objeto LucideIcons
  const IconComponent = (LucideIcons as any)[formattedIconName]

  return IconComponent || SquareTerminal
}

const data = {
  user: {
    name: "loading...",
    email: "loading...",
    avatar: "/avatars/shadcn.jpg",
    role: "loading...",
  },
  teams: {
    name: "Acme Inc",
    logo: Command,
  }
}

// Função para converter o formato do menu do localStorage para o formato do NavMain
function convertMenuFormat(menu: MenuItem[]): NavSection[] {
  return menu.map((item) => ({
    title: item.title,
    url: item.link,
    icon: typeof item.icon === 'string' ? getDynamicIcon(item.icon) : SquareTerminal,
    isActive: item.isActive || false,
    resource: item.resource,
    permissions: item.permissions,
    items: item.subs?.map((sub) => ({
      title: sub.title,
      url: sub.link,
      resource: sub.resource,
      permissions: sub.permissions,
    })),
  }))
}

// Função para filtrar menus baseado nas permissões
function filterMenuByPermissions(
  menu: NavSection[],
  permissions: string[]
): NavSection[] {
  const hasPermission = (requiredPermission: string, itemResource?: string): boolean => {
    if (permissions.includes(requiredPermission)) return true

    if (itemResource) {
      const managePermission = `${itemResource}:manage`
      if (permissions.includes(managePermission)) return true
    }

    const [resource, action] = requiredPermission.split(':')

    if (!resource || !action) return true

    const managePermission = `${resource}:manage`
    if (permissions.includes(managePermission)) return true

    return false
  }

  const hasAnyPermission = (requiredPermissions?: string[], itemResource?: string): boolean => {
    if (itemResource && permissions.includes(`${itemResource}:manage`)) {
      return true
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      if (itemResource) {
        return permissions.includes(`${itemResource}:manage`)
      }
      return true
    }

    return requiredPermissions.some(perm => hasPermission(perm, itemResource))
  }

  const filtered = menu
    .map((section) => {
      if (!hasAnyPermission(section.permissions, section.resource)) {
        return null
      }

      const filteredItems = section.items?.filter((item) => {
        return hasAnyPermission(item.permissions, item.resource)
      })

      if (filteredItems && filteredItems.length === 0 && section.items && section.items.length > 0) {
        return null
      }

      return {
        ...section,
        items: filteredItems,
      } as NavSection
    })
    .filter((section) => section !== null) as NavSection[]

  return filtered
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [name, setName] = useState("carregando...")
  const [email, setEmail] = useState("carregando...")
  const [role, setRole] = useState("carregando...")
  const [permissions, setPermissions] = useState<string[]>([])
  const [filteredMenu, setFilteredMenu] = useState<NavSection[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)

    const storedName = localStorage.getItem("name")
    const storedEmail = localStorage.getItem("email")
    let storedRole = localStorage.getItem("role_changing_it_wont_help")
    const storedPermissions = localStorage.getItem("permission")
    const storedMenu = localStorage.getItem("menu")

    if (storedName) setName(storedName)
    if (storedEmail) setEmail(storedEmail)
    if (storedRole) setRole(storedRole)

    // Carrega o menu do localStorage
    let menuConfig: NavSection[] = []

    if (storedMenu) {
      try {
        const parsedMenu: MenuItem[] = JSON.parse(storedMenu)
        menuConfig = convertMenuFormat(parsedMenu)
      } catch (error) {
        console.error("Erro ao parsear menu:", error)
      }
    }

    // Parse das permissões
    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions)
        setPermissions(parsedPermissions)

        // Filtra o menu baseado nas permissões (se houver permissões definidas)
        const filtered = filterMenuByPermissions(menuConfig, parsedPermissions)
        setFilteredMenu(filtered)
      } catch (error) {
        console.error("Erro ao parsear permissões:", error)
        setFilteredMenu(menuConfig) // Mostra menu completo em caso de erro
      }
    } else {
      // Se não houver permissões, mostra o menu completo
      setFilteredMenu(menuConfig)
    }

    // Atualiza dados do usuário
    if (storedRole != null) storedRole = storedRole.toUpperCase();
    data.user.name = storedName || "unknown"
    data.user.email = storedEmail || "unknown"
    data.user.role = storedRole || "unknown"

    setIsLoading(false)
  }, [])

  if (!isClient || isLoading) {
    return (
      <Sidebar
        collapsible="icon"
        className="pt-14"
        {...props}
      >
        <SiteHeader />
        <SidebarContent>
          <div className="flex justify-center opacity-50 h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  }

  return (
    <Sidebar
      collapsible="icon"
      className="pt-14 overflow-hidden"
      {...props}
    >
      <SiteHeader />
      <SidebarContent
      className="overflow-hidden">
        <NavMain items={filteredMenu} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}