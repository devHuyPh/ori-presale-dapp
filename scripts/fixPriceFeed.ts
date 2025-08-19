import { ethers } from "hardhat";

async function main() {
    const presaleAddr = "0x6e25291E759DA3e731cd0863e517FE40BF4Eb490";
    const feed = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // Chainlink ETH/USD Sepolia
    const presale = await ethers.getContractAt("OriPresale", presaleAddr);
    await (await presale.setPriceFeed(feed)).wait();
    console.log("New feed:", await presale.priceFeed());
}
main().catch(console.error);
