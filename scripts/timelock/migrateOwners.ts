import { ethers } from "hardhat";

const TL = process.env.TIMELOCK!; // set giá trị trước khi chạy
const CONTRACTS = [
    { name: "OriToken", addr: "0x9E27f114ef2721Ad5b0c5E496F2B38Cf5944429B" },
    { name: "OriPresale", addr: "0x6e25291E759DA3e731cd0863e517FE40BF4Eb490" },
    { name: "OriAffiliate", addr: "0xa695500B1118839508A5c83fb1FD926987124eF0" },
];
async function main() {
    for (const c of CONTRACTS) {
        const i = await ethers.getContractAt(c.name, c.addr);
        const tx = await i.transferOwnership(TL);
        await tx.wait();
        console.log(`Transferred ${c.name} → Timelock`);
    }
}
main().catch(e => { console.error(e); process.exit(1); });
