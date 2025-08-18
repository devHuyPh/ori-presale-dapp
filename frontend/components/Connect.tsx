"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function Connect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected)
    return (
      <div className="flex items-center gap-3">
        <span className="opacity-80 text-sm">{address}</span>
        <button className="btn" onClick={() => disconnect()}>Disconnect</button>
      </div>
    );

  return (
    <div className="flex items-center gap-2">
      {connectors.map((c) => (
        <button key={c.uid} className="btn" onClick={() => connect({ connector: c })}>
          Connect {c.name}
        </button>
      ))}
      {status === 'error' && <span className="text-red-400 text-sm">{error?.message}</span>}
    </div>
  );
}
