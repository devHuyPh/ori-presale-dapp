"use client";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS } from "@/lib/config";
import { OriPresaleABI } from "@/lib/abi";
import Card from "@/components/Card";
import Stat from "@/components/Stat";
import { formatEther } from "viem";
import { useEffect, useState } from "react";

export default function PresalePage() {
  const { address } = useAccount();
  const [amount, setAmount] = useState<string>("1000"); // token amount (without decimals)
  const [payWei, setPayWei] = useState<bigint>(0n);

  const { data: stageId } = useReadContract({
    address: CONTRACTS.presale as `0x${string}`,
    abi: OriPresaleABI,
    functionName: "getCurrentStageIdActive"
  });
  const { data: stage } = useReadContract({
    address: CONTRACTS.presale as `0x${string}`,
    abi: OriPresaleABI,
    functionName: "stages",
    args: [stageId ?? 0n]
  });
  const { data: usdToEth } = useReadContract({
    address: CONTRACTS.presale as `0x${string}`,
    abi: OriPresaleABI,
    functionName: "getUsdToEthPrice"
  });
  const { data: myPurchased } = useReadContract({
    address: CONTRACTS.presale as `0x${string}`,
    abi: OriPresaleABI,
    functionName: "purchasedTokens",
    args: [address ?? "0x0000000000000000000000000000000000000000"]
  });
  const { data: totalSold } = useReadContract({ address: CONTRACTS.presale as `0x${string}`, abi: OriPresaleABI, functionName: "totalSold" });
  const { data: totalRaisedUsd } = useReadContract({ address: CONTRACTS.presale as `0x${string}`, abi: OriPresaleABI, functionName: "totalRaisedUsd" });

  useEffect(() => {
    try {
      if (!stage || !usdToEth) return;
      const price = (stage as any)[2] as bigint; // price (USD units scaled)
      const amt = BigInt(amount || "0");
      const totalUsd = price * amt; // USD * amt
      const weiPerUsd = usdToEth as bigint; // wei per USD (scaled inside contract)
      const requiredWei = (totalUsd * weiPerUsd) / 10n ** 18n;
      setPayWei(requiredWei);
    } catch { setPayWei(0n); }
  }, [stage, usdToEth, amount]);

  const { writeContract, isPending } = useWriteContract();

  const onBuy = async () => {
    const amt = BigInt(amount || "0");
    if (amt <= 0n) return;
    await writeContract({
      address: CONTRACTS.presale as `0x${string}`,
      abi: OriPresaleABI,
      functionName: "buyToken",
      args: [amt],
      value: payWei
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card title="Buy ORI">
        <div className="space-y-3">
          <div>
            <div className="label">Amount (ORI)</div>
            <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="text-sm opacity-80">Active Stage: <b>{String(stageId ?? 0n)}</b></div>
          <div className="text-sm opacity-80">Suggested payment: <b>{formatEther(payWei)} ETH</b></div>
          <button className="btn" onClick={onBuy} disabled={isPending}>Buy</button>
        </div>
      </Card>

      <div className="grid gap-6">
        <Stat label="Your purchased" value={myPurchased ? String(myPurchased) : 0} />
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Total sold" value={totalSold ? String(totalSold) : 0} />
          <Stat label="Total raised (USD units)" value={totalRaisedUsd ? String(totalRaisedUsd) : 0} />
        </div>
      </div>
    </div>
  );
}
