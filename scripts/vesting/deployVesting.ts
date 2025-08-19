import { ethers } from "hardhat";
import { VESTING } from "./config";

async function main() {
    const now = Math.floor(Date.now() / 1000);
    const start = now + VESTING.startDelaySec;
    const duration = VESTING.durationSec;
    const VW = await ethers.getContractFactory("VestingWallet");
    const mapping: Record<string, string> = {};
    for (const b of VESTING.beneficiaries) {
        const vw = await VW.deploy(b.addr, start, duration);
        await vw.waitForDeployment();
        const addr = await vw.getAddress();
        mapping[b.addr] = addr;
        console.log(`${b.addr} -> ${addr}`);
    }
    console.log("==> Lưu lại mapping này để fund ở bước tiếp theo.");
}
main().catch(e => { console.error(e); process.exit(1); });
