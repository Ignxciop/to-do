import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-900 dark:to-gray-800">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
                {children}
            </div>
        </div>
    );
}
