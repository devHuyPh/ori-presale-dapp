"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import Card from "@/components/Card";
import Stat from "@/components/Stat";
import { CONTRACTS } from "@/lib/config";
import { OriAffiliateABI } from "@/lib/abi";
import { formatEther } from "viem";

export default function AffiliateClient() {
    // GỌI HOOK LUÔN LUÔN, KHÔNG RETURN SỚM
    const { address, isConnected } = useAccount();
    const zero = "0x0000000000000000000000000000000000000000" as `0x${string}`;
    const who = (address ?? zero) as `0x${string}`;

    const { data: referrer } = useReadContract({
        address: CONTRACTS.affiliate as `0x${string}`,
        abi: OriAffiliateABI,
        functionName: "referrerOf",
        args: [who],
        // Chặn gọi mạng cho đến khi có ví (không ảnh hưởng thứ tự hook)
        query: { enabled: !!isConnected },
    });

    const { data: earned } = useReadContract({
        address: CONTRACTS.affiliate as `0x${string}`,
        abi: OriAffiliateABI,
        functionName: "earned",
        args: [who],
        query: { enabled: !!isConnected },
    });

    const { data: bps } = useReadContract({
        address: CONTRACTS.affiliate as `0x${string}`,
        abi: OriAffiliateABI,
        functionName: "rateBps",
    });

    const { writeContract, isPending } = useWriteContract();

    // Đọc ref từ URL chỉ sau khi có window
    const [refInput, setRefInput] = useState("");
    useEffect(() => {
        if (typeof window === "undefined") return;
        const r = new URL(window.location.href).searchParams.get("ref");
        if (r) setRefInput(r);
    }, []);

    const onSetRef = async () => {
        if (!refInput) return;
        await writeContract({
            address: CONTRACTS.affiliate as `0x${string}`,
            abi: OriAffiliateABI,
            functionName: "setMyReferrer",
            args: [refInput as `0x${string}`],
        });
    };

    const myLink = useMemo(() => {
        if (!isConnected || !address || typeof window === "undefined") return "";
        return `${window.location.origin}/affiliate?ref=${address}`;
    }, [isConnected, address]);

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
                    <input className="input" value={refInput} onChange={(e) => setRefInput(e.target.value)} />
                    <button className="btn" onClick={onSetRef} disabled={isPending}>Set Referrer</button>
                    <div className="text-sm opacity-80">Current: <b>{String(referrer)}</b></div>
                </div>
            </Card>

            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                <Stat label="Commission rate" value={`${Number(bps || 0)} bps (${Number(bps || 0) / 100}% )`} />
                <Stat label="Your earned (ETH)" value={earned ? formatEther(earned as bigint) : "0"} />
            </div>
        </div>
    );
}
