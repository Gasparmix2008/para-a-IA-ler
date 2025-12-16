"use client"

import { useEffect, useState } from "react"
import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
} from "lucide-react"
import { logout } from "@/server/actions/logout"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    role: string
  }
}) {
  const { isMobile } = useSidebar()
  const [permissions, setPermissions] = useState<string[]>([])
  const router = useRouter()

  async function handleLogout() {
    const response = await logout()

    toast.success(response.status == 200 ? "Logout realizado com sucesso" : "Não foi possível fazer logout")

    return router.push("/login")
  }

  // Carrega permissões do localStorage
  useEffect(() => {
    const storedPermissions = localStorage.getItem("permission")
    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions)
        setPermissions(parsedPermissions)
      } catch (error) {
        console.error("Erro ao parsear permissões:", error)
      }
    }
  }, [])

  // Verifica se o usuário tem permissão considerando hierarquia
  const hasPermission = (requiredPermissions: string[], resource: string): boolean => {
    // Se tem resource:manage, libera automaticamente
    if (permissions.includes(`${resource}:manage`)) {
      return true
    }

    // Verifica se tem alguma das permissões requeridas
    return requiredPermissions.some(perm => {
      // Verifica permissão exata
      if (permissions.includes(perm)) return true

      // Extrai resource da permissão e verifica manage
      const [res] = perm.split(':')
      if (res && permissions.includes(`${res}:manage`)) return true

      return false
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <div className="text-[10px] px-2 py-1 bg-foreground rounded-full text-background">{user.role}</div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-between w-full text-left text-sm leading-tight">
                  <div className="flex flex-col">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <div className="text-[10px] px-2 py-1 bg-foreground rounded-full text-background">{user.role}</div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Conta
              </DropdownMenuItem>

              {/* Billing - apenas para quem tem permissão de finance */}
              {hasPermission(["finance:view"], "finance") && (
                <DropdownMenuItem>
                  <CreditCard />
                  Cobrança
                </DropdownMenuItem>
              )}

              <DropdownMenuItem>
                <Bell />
                Notificações
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleLogout()}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}