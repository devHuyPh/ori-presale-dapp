// frontend/app/providers.tsx
"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { config } from "@/lib/wagmi";

export default function Providers({ children }: { children: ReactNode }) {
    // Tạo 1 queryClient duy nhất (tránh re-create gây loop)
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    );
}
