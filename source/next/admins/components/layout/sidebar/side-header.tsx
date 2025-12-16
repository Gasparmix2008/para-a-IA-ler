"use client"

import { SidebarIcon } from "lucide-react"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

export function SiteHeader() {

    return (
        <header className="bg-sidebar fixed top-0 z-50 flex w-full items-center border-b">
            <div className="flex h-(--header-height) w-full items-center">
                <Separator orientation="vertical" className="relative right-px" />
            </div>
        </header>
    )
}
