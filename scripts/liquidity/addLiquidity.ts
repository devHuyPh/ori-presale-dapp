import { ethers } from "hardhat";
const ROUTER = process.env.UNISWAP_V2_ROUTER || "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
const TOKEN = "0x9E27f114ef2721Ad5b0c5E496F2B38Cf5944429B"; // ORI

const AMT_ORI = "200000";
const AMT_ETH = "0.002";
const DEADLINE_SEC = 20 * 60;

async function main() {
    const [signer] = await ethers.getSigners();
    const router = await ethers.getContractAt("IUniswapV2Router02", ROUTER);
    const token = await ethers.getContractAt("OriToken", TOKEN);
    const amtToken = ethers.parseUnits(AMT_ORI, 18);
    await (await token.approve(ROUTER, amtToken)).wait();
    const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SEC);

    const tx = await router.addLiquidityETH(
        TOKEN,
        amtToken,
        0, // amountTokenMin = 0  (testnet)
        0, // amountETHMin  = 0  (testnet)
        await signer.getAddress(),
        deadline,
        { value: ethers.parseEther(AMT_ETH) }
    );
    const rc = await tx.wait();
    console.log("Liquidity added. Tx:", rc?.hash);
}
main().catch(e => { console.error(e); process.exit(1); });
