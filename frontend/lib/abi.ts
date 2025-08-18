// Minimal ABIs used by the UI (add more if needed)
export const OriPresaleABI = [
  { "inputs": [], "name": "getCurrentStageIdActive", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getUsdToEthPrice", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType":"uint256","name":"","type":"uint256"}], "name": "stages", "outputs": [
      {"internalType":"uint256","name":"id","type":"uint256"},
      {"internalType":"uint256","name":"bonus","type":"uint256"},
      {"internalType":"uint256","name":"price","type":"uint256"},
      {"internalType":"uint256","name":"start","type":"uint256"},
      {"internalType":"uint256","name":"end","type":"uint256"}
    ], "stateMutability":"view", "type":"function" },
  { "inputs": [{"internalType":"uint256","name":"_amount","type":"uint256"}], "name": "buyToken", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{"internalType":"address","name":"","type":"address"}], "name": "purchasedTokens", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "totalSold", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view","type":"function" },
  { "inputs": [], "name": "totalRaisedUsd", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view","type":"function" }
] as const;

export const OriAffiliateABI = [
  { "inputs": [{"internalType":"address","name":"","type":"address"}], "name":"referrerOf", "outputs": [{"internalType":"address","name":"","type":"address"}], "stateMutability":"view","type":"function" },
  { "inputs": [], "name":"rateBps","outputs":[{"internalType":"uint16","name":"","type":"uint16"}], "stateMutability":"view","type":"function" },
  { "inputs": [{"internalType":"address","name":"_referrer","type":"address"}], "name":"setMyReferrer", "outputs":[], "stateMutability":"nonpayable","type":"function" },
  { "inputs": [{"internalType":"address","name":"","type":"address"}], "name":"earned", "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view","type":"function" }
] as const;

export const OriTokenABI = [
  {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
] as const;
