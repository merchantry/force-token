// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../openzeppelin/access/Ownable.sol";
import "../openzeppelin/token/ERC20/IERC20.sol";
import "../DEXAdapterHandlerUtils/DEXAdapterInterface.sol";

abstract contract DEXAdapterHandler is Ownable {
    DEXAdapterInterface private dexAdapter;

    constructor(address _dexAdapter) {
        setDexAdapter(_dexAdapter);
    }

    /**
     * @dev Returns the address of the DEXAdapter contract.
     */
    function getDexAdapter() public view returns (address) {
        return address(dexAdapter);
    }

    /**
     * @dev Allows the owner to set the DEXAdapter contract.
     */
    function setDexAdapter(address _dexAdapter) public onlyOwner {
        require(_dexAdapter != address(0), "DEXAdapterHandler: _dexAdapter is the zero address");

        dexAdapter = DEXAdapterInterface(_dexAdapter);
    }

    /**
     * @dev Sends the given amount of wTLOS to the DEXAdapter contract and swaps it for FORCE tokens.
     * Must have transferred the given amount of wTLOS to this contract before calling this function.
     *
     * @param amountIn The amount of wTLOS to swap.
     * @param sendTo The address to send the FORCE tokens to.
     * @param wTLOS The address of the wTLOS token.
     * @param forceToken The address of the FORCE token.
     * @return {uint256} amount of FORCE tokens received.
     */
    function swap(uint256 amountIn, address sendTo, address wTLOS, address forceToken) internal returns (uint256) {
        IERC20(wTLOS).transfer(address(dexAdapter), amountIn);

        return dexAdapter.swap(amountIn, sendTo, wTLOS, forceToken);
    }
}
