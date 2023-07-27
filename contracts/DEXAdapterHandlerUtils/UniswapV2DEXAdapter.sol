// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DEXAdapterInterface.sol";
import "../ForceTokenSaleUtils/TimeHandler.sol";
import "../uniswap/IUniswapV2Router02.sol";

abstract contract UniswapV2DEXAdapter is DEXAdapterInterface, TimeHandler {
    IUniswapV2Router02 private uniswapRouter;

    constructor(address _uniswapRouter) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }

    function getUniswapRouter() public view returns (address) {
        return address(uniswapRouter);
    }

    function swap(uint256 amountIn, address sendTo, address wTLOS, address forceToken) external returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = wTLOS;
        path[1] = forceToken;

        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(amountIn, 1, path, sendTo, time() + 1 days);

        return amounts[1];
    }
}
