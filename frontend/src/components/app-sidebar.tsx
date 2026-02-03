import React, { useContext } from "react";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "../components/ui/sidebar";
import { User2, Home, ListTodo, Target } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import { Separator } from "../components/ui/separator";
import { AuthContext } from "../context/AuthContext";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const handleLogout = async () => {
        if (auth) {
            await auth.logout();
        }
    };
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader className="px-6">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="w-full transition-colors"
                        >
                            <a
                                href="#"
                                className="flex items-center py-3 text-xl font-bold"
                            >
                                <Target className="size-5 mr-2" />
                                <span>Enfok</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="px-6 mt-10">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="w-full transition-colors"
                        >
                            <a
                                href="/"
                                className="flex items-center py-3 text-lg font-bold"
                            >
                                <Home className="size-4 mr-2" />
                                Inicio
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="w-full transition-colors"
                        >
                            <a
                                href="/tasks"
                                className="flex items-center py-3 text-lg font-bold"
                            >
                                <ListTodo className="size-4 mr-2" />
                                Tareas
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="w-full transition-colors"
                        >
                            <a
                                href="/goals"
                                className="flex items-center py-3 text-lg font-bold"
                            >
                                <Target className="size-4 mr-2" />
                                Objetivos
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 w-full min-w-0 p-3 rounded-xl transition-colors focus:outline-none hover:bg-white/80 group">
                            {/* Avatar usuario */}
                            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                <User2 className="w-8 h-8 text-muted-foreground" />
                            </div>
                            {/* Info usuario */}
                            <div className="flex flex-col min-w-0 flex-1 items-start">
                                <span className="truncate font-medium text-sm leading-tight px-0">
                                    {user?.name && user?.lastname
                                        ? `${user.name} ${user.lastname}`
                                        : user?.name
                                          ? user.name
                                          : user?.lastname
                                            ? user.lastname
                                            : user?.email
                                              ? user.email.split("@")[0]
                                              : "Usuario"}
                                </span>
                                <span className="text-xs text-muted-foreground truncate px-0">
                                    {user?.email}
                                </span>
                            </div>
                            {/* Menú opciones visual */}
                            <svg
                                width="20"
                                height="20"
                                fill="none"
                                viewBox="0 0 20 20"
                                className="ml-auto text-muted-foreground"
                            >
                                <circle
                                    cx="10"
                                    cy="4"
                                    r="1.5"
                                    fill="currentColor"
                                />
                                <circle
                                    cx="10"
                                    cy="10"
                                    r="1.5"
                                    fill="currentColor"
                                />
                                <circle
                                    cx="10"
                                    cy="16"
                                    r="1.5"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        align="end"
                        className="min-w-0 w-[var(--radix-dropdown-menu-trigger-width)] p-2"
                    >
                        <div className="flex items-center gap-3 p-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                                <User2 className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col min-w-0 max-w-[160px] flex-1 items-start">
                                <span className="truncate font-medium text-base leading-tight px-0">
                                    {user?.name && user?.lastname
                                        ? `${user.name} ${user.lastname}`
                                        : user?.name
                                          ? user.name
                                          : user?.lastname
                                            ? user.lastname
                                            : user?.email
                                              ? user.email.split("@")[0]
                                              : "Usuario"}
                                </span>
                                <span className="text-xs text-muted-foreground truncate px-0">
                                    {user?.email}
                                </span>
                            </div>
                        </div>
                        <Separator className="my-1" />
                        <DropdownMenuItem className="gap-2" disabled>
                            <User2 className="w-4 h-4" />
                            Cuenta
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" disabled>
                            <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                            Notificaciones
                        </DropdownMenuItem>
                        <Separator className="my-1" />
                        <DropdownMenuItem
                            className="gap-2"
                            onClick={handleLogout}
                        >
                            <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M16 17v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1M7 12h14m0 0-3-3m3 3-3 3"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                            Cerrar sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
