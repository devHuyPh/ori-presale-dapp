import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1) Deploy Token
  const Token = await ethers.getContractFactory("OriToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("OriToken:", tokenAddr);

  // 2) Deploy Presale (set your payment address & Chainlink ETH/USD feed)
  const paymentAddress = deployer.address; // TODO: change to treasury/multisig
  const priceFeed = process.env.CHAINLINK_ETH_USD || "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // Sepolia
  const Presale = await ethers.getContractFactory("OriPresale");
  const presale = await Presale.deploy(paymentAddress, tokenAddr, priceFeed);
  await presale.waitForDeployment();
  const presaleAddr = await presale.getAddress();
  console.log("OriPresale:", presaleAddr);

  // 3) Deploy Affiliate
  const Affiliate = await ethers.getContractFactory("OriAffiliate");
  const affiliate = await Affiliate.deploy(deployer.address);
  await affiliate.waitForDeployment();
  const affiliateAddr = await affiliate.getAddress();
  console.log("OriAffiliate:", affiliateAddr);

  // Wire up Affiliate <-> Presale
  await (await affiliate.setPresale(presaleAddr)).wait();
  await (await presale.setAffiliate(affiliateAddr)).wait();

  // Fund Presale with tokens to sell
  const amountForPresale = ethers.parseUnits("1000000", 18); // 1,000,000 ORI
  await (await token.transfer(presaleAddr, amountForPresale)).wait();

  console.log("Deployment done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
