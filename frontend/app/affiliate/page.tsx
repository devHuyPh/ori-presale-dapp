"use client";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import Card from "@/components/Card";
import Stat from "@/components/Stat";
import { CONTRACTS } from "@/lib/config";
import { OriAffiliateABI } from "@/lib/abi";
import { formatEther } from "viem";

export default function AffiliatePage() {
  const { address, isConnected } = useAccount();
  const { data: referrer } = useReadContract({
    address: CONTRACTS.affiliate as `0x${string}`,
    abi: OriAffiliateABI,
    functionName: "referrerOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
  });
  const { data: earned } = useReadContract({
    address: CONTRACTS.affiliate as `0x${string}`,
    abi: OriAffiliateABI,
    functionName: "earned",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
  });
  const { data: bps } = useReadContract({
    address: CONTRACTS.affiliate as `0x${string}`,
    abi: OriAffiliateABI,
    functionName: "rateBps",
  });

  const [setRef, setSetRef] = useState<string>("");
  const { writeContract, isPending } = useWriteContract();

  // auto-fill from ?ref= query
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const r = url.searchParams.get("ref");
    if (r) setSetRef(r);
  }, []);

  const onSetRef = async () => {
    if (!setRef) return;
    await writeContract({
      address: CONTRACTS.affiliate as `0x${string}`,
      abi: OriAffiliateABI,
      functionName: "setMyReferrer",
      args: [setRef as `0x${string}`]
    });
  };

  const myLink = useMemo(() => {
    if (!isConnected || !address) return "";
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/affiliate?ref=${address}`;
  }, [address, isConnected]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card title="Your referral link">
        {myLink ? (
          <div className="space-y-2">
            <div className="text-sm opacity-80">Share this link:</div>
            <div className="input text-xs break-all">{myLink}</div>
          </div>
        ) : (
          <div className="opacity-80">Connect wallet to get your link.</div>
        )}
      </Card>

      <Card title="Set my referrer">
        <div className="space-y-3">
          <div className="label">Referrer address (0x...)</div>
          <input className="input" value={setRef} onChange={(e) => setSetRef(e.target.value)} />
          <button className="btn" onClick={onSetRef} disabled={isPending}>Set Referrer</button>
          <div className="text-sm opacity-80">Current: <b>{String(referrer)}</b></div>
        </div>
      </Card>

      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        <Stat label="Commission rate" value={`${Number(bps || 0)} bps (${Number(bps || 0) / 100}% )`} />
        <Stat label="Your earned (ETH)" value={earned ? formatEther(earned as bigint) : '0'} />
      </div>
    </div>
  );
}
