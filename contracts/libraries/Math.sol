// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library Math {
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? b : a;
    }
}
