// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DEXAdapterHandlerUtils/DEXAdapterInterface.sol";
import "./ForceTokenSaleUtils/TimeHandler.sol";
import "./uniswap/IUniswapV2Router02.sol";
import "./openzeppelin/token/ERC20/IERC20.sol";

contract UniswapV2DEXAdapter is DEXAdapterInterface, TimeHandler {
    IUniswapV2Router02 private uniswapRouter;

    constructor(address _uniswapRouter) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }

    /**
     * @dev Returns the address of the UniswapV2Router02 contract.
     */
    function getUniswapRouter() public view returns (address) {
        return address(uniswapRouter);
    }

    /**
     * @dev Swaps the given amount of wTLOS for FORCE tokens and sends them to the given address.
     * Must have transferred the given amount of wTLOS to this contract before calling this function.
     *
     * @param amountIn The amount of wTLOS to swap.
     * @param sendTo The address to send the FORCE tokens to.
     * @param wTLOS The address of the wTLOS token.
     * @param forceToken The address of the FORCE token.
     * @return {uint256} amount of FORCE tokens received.
     */
    function swap(uint256 amountIn, address sendTo, address wTLOS, address forceToken) external returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = wTLOS;
        path[1] = forceToken;

        IERC20(path[0]).approve(address(uniswapRouter), amountIn);
        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(amountIn, 1, path, sendTo, time() + 1 days);

        return amounts[1];
    }
}
