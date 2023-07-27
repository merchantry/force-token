// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../openzeppelin/access/Ownable.sol";
import "../DEXAdapterHandlerUtils/DEXAdapterInterface.sol";

abstract contract DEXAdapterHandler is Ownable {
    DEXAdapterInterface private dexAdapter;

    constructor(address _dexAdapter) {
        setDexAdapter(_dexAdapter);
    }

    function getDexAdapter() public view returns (address) {
        return address(dexAdapter);
    }

    function setDexAdapter(address _dexAdapter) public onlyOwner {
        require(_dexAdapter != address(0), "DEXAdapterHandler: _dexAdapter is the zero address");

        dexAdapter = DEXAdapterInterface(_dexAdapter);
    }

    function swap(uint256 amountIn, address sendTo, address wTLOS, address forceToken) internal returns (uint256) {
        return dexAdapter.swap(amountIn, sendTo, wTLOS, forceToken);
    }
}
