import { ethers } from "hardhat";

async function main() {
    const minDelay = 24 * 3600; // 24h
    const multisig = process.env.MULTISIG!;
    if (!multisig) throw new Error("Set MULTISIG in .env first!");

    const TL = await ethers.getContractFactory("TimelockController");
    const deployer = (await ethers.getSigners())[0].address;

    const tl = await TL.deploy(
        minDelay,
        [multisig],     // proposers
        [multisig],     // executors
        deployer        // initial admin (có thể đổi sau)
    );
    await tl.waitForDeployment();

    console.log("Timelock:", await tl.getAddress());
}

main().catch(e => { console.error(e); process.exit(1); });