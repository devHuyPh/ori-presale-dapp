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

    // Core
    IERC20 public token;
    IERC20Metadata public tokenMetadata;
    AggregatorV3Interface public priceFeed;
    address public paymentAddress;
    uint8 public tokenDecimals;

    // Presale state (tất cả số lượng token tính theo tokenDecimals)
    uint256 public presaleTokenAmount;
    bool public presaleActive = true;
    uint256 public totalSold;
    uint256 public totalRaisedUsd;

    // Affiliate (optional)
    address public affiliate;

    mapping(address => uint256) public purchasedTokens;

    struct Stage {
        uint256 id;       // 1..currentStageId
        uint256 bonus;    // % (0..100)
        uint256 price;    // đơn giá USD (theo scale hiện tại của bạn)
        uint256 start;    // timestamp
        uint256 end;      // timestamp
    }
    mapping(uint256 => Stage) public stages;
    uint256 public maxStage = 4;
    uint256 public currentStageId;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 payUsdAmount, uint256 timestamp);

    constructor(address _payment, address _token, address _priceFeed) Ownable(msg.sender) {
        require(_payment != address(0), "payment=0");
        require(_token != address(0), "token=0");
        require(_priceFeed != address(0), "feed=0");

        token = IERC20(_token);
        tokenMetadata = IERC20Metadata(_token);
        tokenDecimals = tokenMetadata.decimals();
        paymentAddress = _payment;
        priceFeed = AggregatorV3Interface(_priceFeed);

        // default: 1,000,000 token theo decimals thực của token
        presaleTokenAmount = 1_000_000 * (10 ** tokenDecimals);

        // Ví dụ 4 stage (thời gian bạn chỉnh lại cho khớp thực tế)
        stages[1] = Stage(1, 20, 100000000000000, 1746899999, 1749578399);
        stages[2] = Stage(2, 15, 200000000000000, 1749578400, 1752170399);
        stages[3] = Stage(3, 10, 300000000000000, 1752170400, 1754848799);
        stages[4] = Stage(4,  5, 400000000000000, 1754848800, 1757527199);
        currentStageId = 4;
    }

    // ---------- Pricing ----------
    uint256 public constant MAX_PRICE_STALE = 1 days;

    /// @dev ETH/USD (decimals = priceFeed.decimals())
    function getEthToUsdPrice() public view returns (uint256) {
        (, int256 price,, uint256 updatedAt,) = priceFeed.latestRoundData();
        require(price > 0, "bad price");
        require(block.timestamp - updatedAt <= MAX_PRICE_STALE, "stale price");
        return uint256(price);
    }

    /// @dev wei per 1 USD (scaled so với stage.price theo công thức bên dưới)
    function getUsdToEthPrice() public view returns (uint256) {
        uint256 ethUsd = getEthToUsdPrice();
        uint8 dec = priceFeed.decimals(); // thường = 8
        // ví dụ: dec=8 -> (10^(18+8))/ethUsd = wei/USD
        return (10 ** (18 + dec)) / ethUsd;
    }

    // ---------- Admin ----------
    function setAffiliate(address _affiliate) external onlyOwner {
        affiliate = _affiliate;
    }

    function setToken(address _token) external onlyOwner {
        require(_token != address(0), "token=0");
        token = IERC20(_token);
        tokenMetadata = IERC20Metadata(_token);
        tokenDecimals = tokenMetadata.decimals();
        // cập nhật lại presaleTokenAmount theo decimals mới (tuỳ ý)
        presaleTokenAmount = 1_000_000 * (10 ** tokenDecimals);
    }

    function setPriceFeed(address _pf) external onlyOwner {
        require(_pf != address(0), "feed=0");
        priceFeed = AggregatorV3Interface(_pf);
    }

    function setPaymentAddress(address _p) external onlyOwner {
        require(_p != address(0), "payment=0");
        paymentAddress = _p;
    }

    function setPresaleTokenAmount(uint256 _amt) external onlyOwner {
        presaleTokenAmount = _amt;
    }

    function flipPresaleActive() external onlyOwner {
        presaleActive = !presaleActive;
    }

    function setMaxStage(uint256 _max) external onlyOwner {
        maxStage = _max;
    }

    function setTotalSold(uint256 _ts) external onlyOwner {
        totalSold = _ts;
    }

    function setTotalRaisedUsd(uint256 _tr) external onlyOwner {
        totalRaisedUsd = _tr;
    }

    function addStage(uint256 _bonus, uint256 _price, uint256 _start, uint256 _end) external onlyOwner {
        uint256 _id = currentStageId + 1;
        require(_id <= maxStage, "max stage");
        require(_bonus <= 100, "0-100");
        require(_start > 0 && _end > 0 && _start < _end, "bad date");
        currentStageId = _id;
        stages[_id] = Stage(_id, _bonus, _price, _start, _end);
    }

    function setStage(uint256 _id, uint256 _bonus, uint256 _price, uint256 _start, uint256 _end) external onlyOwner {
        require(stages[_id].id == _id, "no id");
        require(_bonus <= 100, "0-100");
        require(_start > 0 && _end > 0 && _start < _end, "bad date");
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

    // ---------- Buy ----------
    /// @param _amount số lượng token (đơn vị whole token, *không* phải wei của token)
    function buyToken(uint256 _amount) external payable nonReentrant {
        require(presaleActive, "inactive");
        require(_amount > 0, "amount=0");

        uint256 _id = getCurrentStageIdActive();
        require(_id > 0, "no active stage");
        Stage memory st = stages[_id];

        // Giá phải trả (ETH)
        // totalPayUsd = amount * price (USD^scale của bạn)
        uint256 totalPayUsd = _amount * st.price;
        uint256 usdToEth = getUsdToEthPrice();           // wei per USD
        uint256 totalPayWei = (totalPayUsd * usdToEth) / 1e18;
        require(msg.value >= totalPayWei, "insufficient ETH");

        // Token nhận về (tính theo tokenDecimals)
        uint256 baseTokens = _amount * (10 ** tokenDecimals);
        uint256 bonusTokens = (baseTokens * st.bonus) / 100;
        uint256 totalTokens = baseTokens + bonusTokens;

        require(totalTokens <= token.balanceOf(address(this)), "not enough token");
        require(totalSold + totalTokens <= presaleTokenAmount, "cap exceeded");

        // --- Affiliate commission (optional) ---
        uint256 commission = 0;
        if (affiliate != address(0)) {
            address ref = IOriAffiliate(affiliate).referrerOf(msg.sender);
            if (ref != address(0)) {
                uint16 bps = IOriAffiliate(affiliate).rateBps();
                if (bps > 0) {
                    commission = (totalPayWei * bps) / 10000; // chỉ tính trên required
                    IOriAffiliate(affiliate).payCommission{value: commission}(msg.sender);
                }
            }
        }

        // --- Chuyển tiền: forward phần required (trừ commission) + refund overpay
        uint256 forward = totalPayWei - commission;
        (bool sent, ) = payable(paymentAddress).call{value: forward}("");
        require(sent, "pay fail");

        uint256 overpay = msg.value - totalPayWei;
        if (overpay > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: overpay}("");
            require(refunded, "refund fail");
        }

        // --- Gửi token
        token.safeTransfer(msg.sender, totalTokens);

        // --- Cập nhật số liệu
        purchasedTokens[msg.sender] += totalTokens;
        totalSold += totalTokens;
        totalRaisedUsd += totalPayUsd;

        emit TokensPurchased(msg.sender, totalTokens, totalPayUsd, block.timestamp);
    }

    // ---------- Helpers ----------
    /// @notice Tiện cho frontend: báo giá trước khi mua
    function quote(uint256 _amount) external view returns (
        uint256 stageId,
        uint256 priceUsdPerToken,
        uint256 usdToEthWeiPerUsd,
        uint256 requiredWei,
        uint256 totalTokens
    ) {
        uint256 id = getCurrentStageIdActive();
        if (id == 0) return (0, 0, 0, 0, 0);
        Stage memory st = stages[id];
        uint256 usd2eth = getUsdToEthPrice();
        uint256 base = _amount * (10 ** tokenDecimals);
        uint256 bonus = (base * st.bonus) / 100;
        uint256 tot = base + bonus;
        uint256 reqWei = (_amount * st.price * usd2eth) / 1e18;
        return (id, st.price, usd2eth, reqWei, tot);
    }

    // ---------- Owner withdraw ----------
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
