// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LPLocker is Ownable {
    IERC20 public immutable lp;
    uint256 public unlockTime;

    constructor(address _lp, uint256 _unlock, address _owner) Ownable(_owner) {
        require(_lp != address(0), "lp=0");
        require(_unlock > block.timestamp, "bad unlock");
        lp = IERC20(_lp);
        unlockTime = _unlock;
    }
    function extend(uint256 newUnlock) external onlyOwner {
        require(newUnlock > unlockTime, "only extend");
        unlockTime = newUnlock;
    }
    function withdraw(address to) external onlyOwner {
        require(block.timestamp >= unlockTime, "locked");
        uint256 bal = lp.balanceOf(address(this));
        require(bal > 0, "zero");
        lp.transfer(to, bal);
    }
}
