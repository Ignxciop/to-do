import React from "react";
import { useIsMobile } from "../hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const currentLocation = "Dashboard";
    const isMobile = useIsMobile();
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-muted/50">
                <AppSidebar className="py-2" />
                <main className="flex-1 bg-muted/50 overflow-y-auto">
                    {isMobile ? (
                        <div className="flex-1 w-full h-full flex flex-col">
                            <header className="flex items-center gap-2 mb-6 border-b border-border pb-2">
                                <SidebarTrigger />
                                <span className="text-lg font-semibold">
                                    {currentLocation}
                                </span>
                            </header>
                            <div className="flex-1 w-full">{children}</div>
                        </div>
                    ) : (
                        <div className="flex-1 flex justify-center items-start px-2 py-2">
                            <div className="w-full rounded-2xl bg-background shadow p-2 flex flex-col">
                                <header className="flex items-center gap-2 mb-6 border-b border-border pb-2">
                                    <SidebarTrigger />
                                    <span className="text-lg font-semibold">
                                        {currentLocation}
                                    </span>
                                </header>
                                <div className="flex-1 w-full">{children}</div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </SidebarProvider>
    );
}
