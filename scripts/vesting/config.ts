export const VESTING = {
    token: "0x9E27f114ef2721Ad5b0c5E496F2B38Cf5944429B", // ORI
    startDelaySec: 180 * 24 * 3600,   // cliff 6 tháng
    durationSec: 24 * 30 * 24 * 3600, // ~24 tháng tuyến tính
    beneficiaries: [
        { addr: "0x58D3F741264308579250a9EcFCDa5b1dC220534E", amountORI: "1000000" },
        { addr: "0x2f313888F42eee80B1D5DEB7f0B36546b31D66EC", amountORI: "750000" },
        { addr: "0x98BF00C5436076aB4f4Fe0ec9eb4FA2dD4F114Cc", amountORI: "250000" },
    ],
};
