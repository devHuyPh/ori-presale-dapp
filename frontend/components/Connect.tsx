"use client";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";

export default function Connect() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const { connectors, connect, status, error } = useConnect(); // lấy list connector từ config
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // tìm MetaMask/injected trong danh sách
  const injected =
    connectors.find((c) => c.id === "injected") ||
    connectors.find((c) => c.name?.toLowerCase().includes("metamask"));

  if (!mounted) return null; // tránh hydration mismatch

  if (isConnected)
    return (
      <div className="flex items-center gap-3">
        <span className="opacity-80 text-xs">{address}</span>
        {chainId !== sepolia.id && (
          <button className="btn" onClick={() => switchChain({ chainId: sepolia.id })}>
            Switch to Sepolia
          </button>
        )}
        <button className="btn" onClick={() => disconnect()}>Disconnect</button>
      </div>
    );

  // nếu không có injected (chưa cài MetaMask)
  if (!injected)
    return (
      <a
        className="btn"
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
      >
        Install MetaMask
      </a>
    );

  return (
    <div className="flex items-center gap-2">
      <button
        className="btn"
        onClick={() => connect({ connector: injected })} // 👉 luôn truyền connector hợp lệ
      >
        Connect MetaMask
      </button>
      {status === "error" && <span className="text-red-400 text-xs">{error?.message}</span>}
    </div>
  );
}
