// app/providers.tsx
"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(
            process.env.NEXT_PUBLIC_SEPOLIA_RPC ||
            "https://ethereum-sepolia-rpc.publicnode.com"
            // có thể thay bằng Alchemy/Infura của bạn
        ),
    },
    connectors: [injected()],
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    );
}
