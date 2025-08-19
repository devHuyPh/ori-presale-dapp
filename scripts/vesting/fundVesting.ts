import { ethers } from "hardhat";
import { VESTING } from "./config";

async function main() {
    const token = await ethers.getContractAt("OriToken", VESTING.token);

    // DÁN mapping in ra ở bước trên vào đây:
    const DEPLOYED: Record<string, string> = {
        "0x58D3F741264308579250a9EcFCDa5b1dC220534E": "0xfaf768D1d997AF4023C1A363565F3375dA80425d",
        "0x2f313888F42eee80B1D5DEB7f0B36546b31D66EC": "0x5bb42cC70E0e773cDC59444acCdB95758C19b1EE",
        "0x98BF00C5436076aB4f4Fe0ec9eb4FA2dD4F114Cc": "0xAEdcC2F6c35c2Bb5548835E6d4f176EEC6b34238",
    };

    for (const b of VESTING.beneficiaries) {
        const vw = DEPLOYED[b.addr];
        if (!vw) throw new Error(`Missing VW for ${b.addr}`);
        const amt = ethers.parseUnits(b.amountORI, 18);
        await (await token.transfer(vw, amt)).wait();
        console.log(`Funded ${b.addr} -> ${vw} with ${b.amountORI} ORI`);
    }
}
main().catch(e => { console.error(e); process.exit(1); });
