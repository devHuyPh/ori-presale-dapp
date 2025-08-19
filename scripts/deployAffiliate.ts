// scripts/deployAffiliate.ts
import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const Affiliate = await ethers.getContractFactory("OriAffiliate");
    const aff = await Affiliate.deploy(deployer.address); // Ownable(initialOwner)
    await aff.waitForDeployment();
    const affAddr = await aff.getAddress();
    console.log("OriAffiliate:", affAddr);

    const presaleAddr = "0x6e25291E759DA3e731cd0863e517FE40BF4Eb490";
    await (await aff.setPresale(presaleAddr)).wait();                 // cho phép presale gọi
    console.log("Presale set:", presaleAddr);
}
main().catch(console.error);
