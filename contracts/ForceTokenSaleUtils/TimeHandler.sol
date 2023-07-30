// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract TimeHandler {
    function time() internal view virtual returns (uint256) {
        return block.timestamp;
    }
}
