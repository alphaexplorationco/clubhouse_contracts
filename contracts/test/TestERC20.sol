// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("USDC", "USDC") {}

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}