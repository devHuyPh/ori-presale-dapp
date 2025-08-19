import { ethers } from "hardhat";

const LP_TOKEN = "0xa536783fb5aa8fa835e13625ba52699ac86d243d6967ad7bed35bfe810849d68";   // địa chỉ LP pair
const UNLOCK_DAYS = 365;            // 12 tháng ~ 365 ngày
const OWNER = process.env.MULTISIG!;

async function main() {
    const L = await ethers.getContractFactory("LPLocker");
    const unlock = Math.floor(Date.now() / 1000) + UNLOCK_DAYS * 24 * 3600;
    const locker = await L.deploy(LP_TOKEN, unlock, OWNER);
    await locker.waitForDeployment();
    const addr = await locker.getAddress();
    console.log("LPLocker:", addr);

    // Chuyển toàn bộ LP token vào locker (thực hiện từ ví đang giữ LP):
    // const lp = await ethers.getContractAt("IERC20", LP_TOKEN);
    // await (await lp.transfer(addr, await lp.balanceOf("<address holding LP>"))).wait();
}
main().catch(e => { console.error(e); process.exit(1); });
