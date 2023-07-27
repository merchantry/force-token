// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface DEXAdapterInterface {
    function getUniswapRouter() external view returns (address);

    function swap(uint256 amountIn, address sendTo, address wTLOS, address forceToken) external returns (uint256);
}
