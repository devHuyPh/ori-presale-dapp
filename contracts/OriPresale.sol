// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

interface IOriAffiliate {
    function rateBps() external view returns (uint16);
    function referrerOf(address buyer) external view returns (address);
    function payCommission(address buyer) external payable;
}

contract OriPresale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public token;
    IERC20Metadata public tokenMetadata;
    AggregatorV3Interface public priceFeed;
    address public paymentAddress;

    uint256 public presaleTokenAmount = 1_000_000 * 1e18; // adjustable
    bool public presaleActive = true;
    uint256 public totalSold = 0;
    uint256 public totalRaisedUsd = 0;

    // Affiliate
    address public affiliate; // OriAffiliate contract (optional)

    mapping(address => uint256) public purchasedTokens;

    struct Stage { uint256 id; uint256 bonus; uint256 price; uint256 start; uint256 end; }
    mapping(uint256 => Stage) public stages;
    uint256 public maxStage = 4;
    uint256 public currentStageId = 0;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 payUsdAmount, uint256 timestamp);

    constructor(address _payment, address _token, address _priceFeed) Ownable(msg.sender) {
        token = IERC20(_token);
        tokenMetadata = IERC20Metadata(_token);
        paymentAddress = _payment;
        priceFeed = AggregatorV3Interface(_priceFeed);
        // Example stages (timestamps are placeholders)
        stages[1] = Stage(1, 20, 100000000000000, 1746899999, 1749578399);
        stages[2] = Stage(2, 15, 200000000000000, 1749578400, 1752170399);
        stages[3] = Stage(3, 10, 300000000000000, 1752170400, 1754848799);
        stages[4] = Stage(4, 5,  400000000000000, 1754848800, 1757527199);
        currentStageId = 4;
    }

    // --- Pricing helpers ---
    function getEthToUsdPrice() public view returns (uint256) {
        (, int256 price,,,) = priceFeed.latestRoundData();
        return uint256(price);
    }
    function getUsdToEthPrice() public view returns (uint256) {
        uint256 ethToUsdPrice = getEthToUsdPrice();
        uint8 dec = priceFeed.decimals();
        return (10 ** (18 + dec)) / ethToUsdPrice;
    }

    // --- Admin ---
    function setAffiliate(address _affiliate) external onlyOwner { affiliate = _affiliate; }
    function setToken(address _token) external onlyOwner { require(_token != address(0)); token = IERC20(_token); tokenMetadata = IERC20Metadata(_token); }
    function setPriceFeed(address _pf) external onlyOwner { require(_pf != address(0)); priceFeed = AggregatorV3Interface(_pf); }
    function setPaymentAddress(address _p) external onlyOwner { require(_p != address(0)); paymentAddress = _p; }
    function setPresaleTokenAmount(uint256 _amt) external onlyOwner { presaleTokenAmount = _amt; }
    function flipPresaleActive() external onlyOwner { presaleActive = !presaleActive; }
    function setMaxStage(uint256 _max) external onlyOwner { maxStage = _max; }
    function setTotalSold(uint256 _ts) external onlyOwner { totalSold = _ts; }
    function setTotalRaisedUsd(uint256 _tr) external onlyOwner { totalRaisedUsd = _tr; }

    function addStage(uint256 _bonus, uint256 _price, uint256 _start, uint256 _end) external onlyOwner {
        uint256 _id = currentStageId + 1; require(_id <= maxStage, "max stage");
        require(_bonus <= 100, "0-100"); require(_start > 0 && _end > 0 && _start < _end, "bad date");
        currentStageId = _id; stages[_id] = Stage(_id, _bonus, _price, _start, _end);
    }

    function setStage(uint256 _id, uint256 _bonus, uint256 _price, uint256 _start, uint256 _end) external onlyOwner {
        require(stages[_id].id == _id, "no id");
        require(_bonus <= 100, "0-100"); require(_start > 0 && _end > 0 && _start < _end, "bad date");
        stages[_id] = Stage(_id, _bonus, _price, _start, _end);
    }

    function getCurrentStageIdActive() public view returns (uint256) {
        if (currentStageId == 0) return 0;
        for (uint256 i = 1; i <= currentStageId; i++) {
            if (block.timestamp >= stages[i].start && block.timestamp <= stages[i].end) {
                return i;
            }
        }
        return 0;
    }

    // --- Buy ---
    function buyToken(uint256 _amount) external payable nonReentrant {
        require(presaleActive, "inactive");
        require(_amount > 0, "amount=0");

        uint256 _id = getCurrentStageIdActive();
        require(_id > 0, "no active stage");
        Stage memory st = stages[_id];
        require(st.start <= block.timestamp && st.end >= block.timestamp, "not in window");

        uint256 totalPayUsd = _amount * st.price;      // USD with feed decimals applied in conversion below
        uint256 usdToEth = getUsdToEthPrice();         // wei per USD (scaled)
        uint256 totalPayWei = (totalPayUsd * usdToEth) / 1e18; // required wei
        require(msg.value >= totalPayWei, "insufficient ETH");

        // Token amount incl. bonus
        uint256 weiTokens = _amount * 1e18;            // base 18
        uint256 bonusWei = (weiTokens * st.bonus) / 100;
        uint256 totalWei = weiTokens + bonusWei;
        uint256 tokenDec = tokenMetadata.decimals();
        uint256 subDec = 18 - tokenDec;                // assumes tokenDec <= 18
        uint256 totalTokenAmount = totalWei / (10 ** subDec);

        require(totalTokenAmount <= token.balanceOf(address(this)), "not enough token");
        require(totalSold + totalTokenAmount <= presaleTokenAmount, "cap exceeded");

        // --- Affiliate split (optional) ---
        uint256 commission = 0;
        if (affiliate != address(0)) {
            address ref = IOriAffiliate(affiliate).referrerOf(msg.sender);
            if (ref != address(0)) {
                uint16 bps = IOriAffiliate(affiliate).rateBps();
                if (bps > 0) {
                    commission = (totalPayWei * bps) / 10000; // compute on required price only
                    IOriAffiliate(affiliate).payCommission{value: commission}(msg.sender);
                }
            }
        }

        // Forward funds to paymentAddress (commission taken from required price). Any overpay also goes to payment.
        uint256 forward = msg.value - commission;
        (bool sent, ) = paymentAddress.call{value: forward}("");
        require(sent, "pay fail");

        // Transfer purchased tokens to buyer
        token.safeTransfer(msg.sender, totalTokenAmount);

        emit TokensPurchased(msg.sender, totalTokenAmount, totalPayUsd, block.timestamp);

        purchasedTokens[msg.sender] += totalTokenAmount;
        totalSold += totalTokenAmount;
        totalRaisedUsd += totalPayUsd;
    }

    // --- Withdraw ---
    function withdrawFunds() external onlyOwner {
        (bool ok, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(ok, "withdraw fail");
    }
    function withdrawTokens(address _to, uint256 _amount) external onlyOwner {
        uint256 bal = token.balanceOf(address(this));
        require(bal >= _amount, "exceeds");
        token.safeTransfer(_to, _amount);
    }
}
