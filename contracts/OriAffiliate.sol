// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title OriAffiliate - 1-tier ETH commission affiliate program
/// @notice Buyers can set a referrer once. Presale pays commission in ETH to referrer.
contract OriAffiliate is Ownable, ReentrancyGuard {
    /// @dev Presale contract authorized to pay commissions through this contract.
    address public presale;

    /// @dev Commission rate in basis points (e.g., 500 = 5%). Capped for safety.
    uint16 public rateBps = 500; // 5%
    uint16 public constant MAX_BPS = 2000; // 20% cap

    mapping(address => address) public referrerOf;  // buyer => referrer
    mapping(address => uint256) public earned;      // referrer => total earned (wei)
    mapping(address => uint256) public referrals;   // referrer => count

    event PresaleSet(address indexed presale);
    event RateUpdated(uint16 rateBps);
    event ReferrerSet(address indexed buyer, address indexed referrer);
    event CommissionPaid(address indexed buyer, address indexed referrer, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyPresale() {
        require(msg.sender == presale, "Not presale");
        _;
    }

    function setPresale(address _presale) external onlyOwner {
        require(_presale != address(0), "presale=0");
        presale = _presale;
        emit PresaleSet(_presale);
    }

    function setRateBps(uint16 _bps) external onlyOwner {
        require(_bps <= MAX_BPS, "too high");
        rateBps = _bps;
        emit RateUpdated(_bps);
    }

    /// @notice Buyer sets their referrer once. No self-ref, no zero.
    function setMyReferrer(address _referrer) external {
        require(_referrer != address(0), "ref=0");
        require(_referrer != msg.sender, "self");
        require(referrerOf[msg.sender] == address(0), "already set");
        referrerOf[msg.sender] = _referrer;
        referrals[_referrer] += 1;
        emit ReferrerSet(msg.sender, _referrer);
    }

    /// @notice Presale sends ETH commission into this function.
    function payCommission(address buyer) external payable onlyPresale nonReentrant {
        address ref = referrerOf[buyer];
        require(ref != address(0), "no ref");
        require(msg.value > 0, "no value");
        (bool ok, ) = payable(ref).call{value: msg.value}("");
        require(ok, "xfer fail");
        earned[ref] += msg.value;
        emit CommissionPaid(buyer, ref, msg.value);
    }
}
