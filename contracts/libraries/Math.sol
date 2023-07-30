// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library Math {
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? b : a;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Rounds up.
     */
    function divideRoundUp(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 result = a / b;
        if (a % b != 0) {
            result += 1;
        }
        return result;
    }
}
