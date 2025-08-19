"use client";

import { useEffect, useMemo, useState } from "react";
import {
    useAccount,
    useChainId,
    useSwitchChain,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { CONTRACTS } from "@/lib/config";
import { OriPresaleABI } from "@/lib/abi";
import Card from "@/components/Card";
import Stat from "@/components/Stat";
import { formatEther } from "viem";

export default function PresaleClient() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const [amount, setAmount] = useState("1000");
    const amountBI = useMemo(() => {
        try { return BigInt(amount || "0"); } catch { return 0n; }
    }, [amount]);

    // ---- Reads ----
    const { data: stageId } = useReadContract({
        address: CONTRACTS.presale as `0x${string}`,
        abi: OriPresaleABI,
        functionName: "getCurrentStageIdActive",
    });

    const { data: stage } = useReadContract({
        address: CONTRACTS.presale as `0x${string}`,
        abi: OriPresaleABI,
        functionName: "stages",
        // @ts-ignore
        args: [stageId ?? 0n],
        query: { enabled: !!stageId && (stageId as bigint) !== 0n },
    });

    const { data: usdToEth } = useReadContract({
        address: CONTRACTS.presale as `0x${string}`,
        abi: OriPresaleABI,
        functionName: "getUsdToEthPrice",
        query: { enabled: !!stageId && (stageId as bigint) !== 0n },
    });

    const { data: myPurchased } = useReadContract({
        address: CONTRACTS.presale as `0x${string}`,
        abi: OriPresaleABI,
        functionName: "purchasedTokens",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
    });
    const { data: totalSold } = useReadContract({ address: CONTRACTS.presale as `0x${string}`, abi: OriPresaleABI, functionName: "totalSold" });
    const { data: totalRaisedUsd } = useReadContract({ address: CONTRACTS.presale as `0x${string}`, abi: OriPresaleABI, functionName: "totalRaisedUsd" });

    // ---- Pricing (BigInt) ----
    const requiredWei = useMemo(() => {
        if (!stage || !usdToEth || (stageId as bigint) === 0n) return 0n;
        const price = (stage as any)?.[2] as bigint || 0n; // stage.price
        const usd2eth = usdToEth as bigint;                // wei per USD
        // requiredWei = amount * price * usdToEth / 1e18
        return (amountBI * price * usd2eth) / (10n ** 18n);
    }, [stage, usdToEth, stageId, amountBI]);

    // đệm 10% tránh thiếu do làm tròn
    const payWei = useMemo(() => requiredWei + (requiredWei / 10n), [requiredWei]);

    // ---- Write / Tx states ----
    const { writeContract, data: txHash, isPending, error: writeErr } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash: txHash });

    const priceReady = requiredWei > 0n;
    const onWrongChain = isConnected && chainId !== sepolia.id;

    const onBuy = async () => {
        try {
            if (!isConnected) return alert("Vui lòng connect ví trước.");
            if (onWrongChain) { switchChain({ chainId: sepolia.id }); return; }
            if ((stageId as bigint) === 0n) return alert("Chưa có stage đang active.");
            if (!priceReady) return alert("Giá chưa sẵn sàng, thử lại sau vài giây.");

            await writeContract({
                address: CONTRACTS.presale as `0x${string}`,
                abi: OriPresaleABI,
                functionName: "buyToken",
                args: [amountBI],
                value: payWei,
            });
        } catch (e: any) {
            alert(e?.shortMessage || e?.message || "Transaction failed.");
        }
    };

    // label nút nhất quán (tránh nhảy chữ bất ngờ)
    const buttonLabel = !isConnected
        ? "Connect wallet"
        : onWrongChain
            ? "Switch to Sepolia"
            : isPending
                ? "Awaiting signature..."
                : isConfirming
                    ? "Tx pending..."
                    : priceReady
                        ? "Buy"
                        : "Loading price…";

    const buttonDisabled =
        isPending || isConfirming || (stageId as bigint) === 0n || !priceReady;

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Buy ORI">
                <div className="space-y-3">
                    <div>
                        <div className="label">Amount (ORI)</div>
                        <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
                    </div>

                    <div className="text-sm opacity-80">
                        Active Stage: <b>{String(stageId ?? 0n)}</b>
                    </div>

                    <div className="text-sm opacity-80">
                        Suggested payment: <b>{priceReady ? `${formatEther(requiredWei)} ETH` : "-"}</b>
                    </div>

                    <button className="btn" onClick={onBuy} disabled={buttonDisabled}>
                        {buttonLabel}
                    </button>

                    {txHash && (
                        <div className="text-xs">
                            Tx:{" "}
                            <a className="link" href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
                                {txHash}
                            </a>
                        </div>
                    )}
                    {isSuccess && <div className="text-green-400 text-sm">Success! ORI đã gửi về ví.</div>}
                    {(writeErr || isError) && (
                        <div className="text-red-400 text-sm">Error: {(writeErr as any)?.shortMessage || "Reverted"}</div>
                    )}
                </div>
            </Card>

            <div className="grid gap-6">
                <Stat label="Your purchased" value={myPurchased ? String(myPurchased) : "0"} />
                <div className="grid grid-cols-2 gap-4">
                    <Stat label="Total sold" value={totalSold ? String(totalSold) : "0"} />
                    <Stat label="Total raised (USD units)" value={totalRaisedUsd ? String(totalRaisedUsd) : "0"} />
                </div>
            </div>
        </div>
    );
}
