// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OriToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    uint256 public initialSupply = 100_000_000_000 * 10 ** decimals();

    constructor() ERC20("Ori Token", "ORI") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
