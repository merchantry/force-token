// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../ForceTokenSale.sol";

/**
 * @dev This contract is used for testing the ForceTokenSale contract.
 */
contract ForceTokenSaleTest is ForceTokenSale {
    uint256 private timestamp;

    constructor(
        address _dexAdapter,
        address _wTLOS,
        address _forceToken,
        Option[] memory _options,
        uint256 _timestamp
    ) ForceTokenSale(_dexAdapter, _wTLOS, _forceToken, _options) {
        timestamp = _timestamp;
    }

    function setTimestamp(uint256 _timestamp) public {
        timestamp = _timestamp;
    }

    function time() internal view override returns (uint256) {
        return timestamp;
    }

    function addDepositTest(uint256 option, uint256 amount, uint256 depositedAt, address user) public {
        addDeposit(option, amount, depositedAt, user);
    }

    function incrementPurchasesMadeTest(uint256 index, uint256 purchasesToAdd) public {
        incrementPurchasesMade(_getDeposit(index), purchasesToAdd);
    }
}
