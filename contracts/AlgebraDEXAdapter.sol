// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DEXAdapterHandlerUtils/DEXAdapterInterface.sol";
import "./ForceTokenSaleUtils/TimeHandler.sol";
import "./algebra/ISwapRouter.sol";
import "./openzeppelin/token/ERC20/IERC20.sol";

contract AlgebraDEXAdapter is DEXAdapterInterface, TimeHandler {
    ISwapRouter private uniswapRouter;

    constructor(address _uniswapRouter) {
        uniswapRouter = ISwapRouter(_uniswapRouter);
    }

    /**
     * @dev Returns the address of the SwapRouter contract.
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
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: wTLOS,
            tokenOut: forceToken,
            recipient: sendTo,
            deadline: time() + 1 days,
            amountIn: amountIn,
            amountOutMinimum: 1,
            limitSqrtPrice: 0
        });

        IERC20(wTLOS).approve(address(uniswapRouter), amountIn);
        return uniswapRouter.exactInputSingle(params);
    }
}
