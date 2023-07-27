// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ForceTokenSaleUtils/DEXAdapterHandler.sol";
import "./ForceTokenSaleUtils/RecordingDeposits.sol";
import "./openzeppelin/token/ERC20/ERC20.sol";
import "./ForceToken.sol";

contract ForceTokenSale is DEXAdapterHandler, RecordingDeposits {
    ERC20 private wTLOS;
    ForceToken private forceToken;

    constructor(
        address _dexAdapter,
        address _wTLOS,
        address _forceToken,
        Option[] memory _options
    ) DEXAdapterHandler(_dexAdapter) StoringDepositOptions(_options) Ownable(_msgSender()) {
        require(_wTLOS != address(0), "ForceTokenSale: _wTLOS is the zero address");
        require(_forceToken != address(0), "ForceTokenSale: _forceToken is the zero address");

        wTLOS = ERC20(_wTLOS);
        forceToken = ForceToken(_forceToken);
    }

    function deposit(uint256 amount, uint256 optionIndex) public {
        require(amount > 0, "ForceTokenSale: amount must be greater than zero");

        address sender = _msgSender();
        Deposit storage _deposit = addDeposit(optionIndex, amount, time(), sender);

        wTLOS.transferFrom(sender, address(this), amount);
        makePurchasesFromDeposit(_deposit, 1);
    }

    function makePurchasesFromDeposit(Deposit storage _deposit, uint256 purchasesToAdd) private {
        require(purchasesToAdd > 0, "ForceTokenSale: purchasesToAdd must be greater than zero");

        (, uint256 numOfPurchases, uint256 rewardBonusInTenthPerc) = getOption(_deposit.option);
        uint256 amount = (_deposit.amountDeposited * purchasesToAdd) / numOfPurchases;

        uint256 amountOfForceTokensReceived = swap(amount, _deposit.depositor, address(wTLOS), address(forceToken));
        uint256 rewardBonus = (amountOfForceTokensReceived * rewardBonusInTenthPerc) / 1000;
        forceToken.transfer(_deposit.depositor, rewardBonus);

        incrementPurchasesMade(_deposit, purchasesToAdd);
    }

    function completeAllOutstandingPurchases() public onlyOwner {
        (Deposit[] storage _deposits, uint256[] memory availablePurchases) = getAllDepositsAndAvailablePurchases();

        for (uint256 i = 0; i < _deposits.length; i++) {
            makePurchasesFromDeposit(_deposits[i], availablePurchases[i]);
        }
    }
}
