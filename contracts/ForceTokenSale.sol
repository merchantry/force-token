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

    /**
     * @dev Allows users to deposit wTLOS tokens and select a DCAR option to purchase.
     * Must have approved this contract to spend the given amount of wTLOS before calling this function.
     * On deposit, a single purchase is made.
     */
    function deposit(uint256 amount, uint256 optionIndex) public {
        require(amount > 0, "ForceTokenSale: amount must be greater than zero");

        address sender = _msgSender();
        Deposit storage _deposit = addDeposit(optionIndex, amount, time(), sender);

        wTLOS.transferFrom(sender, address(this), amount);
        makePurchasesFromDeposit(_deposit, 1);
    }

    /**
     * Function used in `completeAllOutstandingPurchases()` to make purchases from a deposit.
     * Calculates the amount of wTLOS to be spent per each purchase, swaps it for FORCE tokens,
     * and sends the FORCE tokens to the depositor.
     * Also sends the reward bonus to the depositor from the contract's FORCE token balance.
     */
    function makePurchasesFromDeposit(Deposit storage _deposit, uint256 purchasesToAdd) private {
        if (purchasesToAdd == 0) return;

        (, uint256 numOfPurchases, uint256 rewardBonusInTenthPerc) = getOption(_deposit.option);
        uint256 amount = (_deposit.amountDeposited * purchasesToAdd) / numOfPurchases;

        uint256 amountOfForceTokensReceived = swap(amount, _deposit.depositor, address(wTLOS), address(forceToken));
        uint256 rewardBonus = (amountOfForceTokensReceived * rewardBonusInTenthPerc) / 1000;

        require(forceToken.balanceOf(address(this)) >= rewardBonus, "ForceTokenSale: insufficient reward bonus");
        forceToken.transfer(_deposit.depositor, rewardBonus);

        incrementPurchasesMade(_deposit, purchasesToAdd);
    }

    /**
     * @dev Allows the owner to go through all deposits, calculate available purchases, and make purchases.
     * This function should be called regularly whenever there are purchases available.
     */
    function completeAllOutstandingPurchases() public onlyOwner {
        (Deposit[] storage _deposits, uint256[] memory availablePurchases) = _getAllDepositsAndAvailablePurchases();

        for (uint256 i = 0; i < _deposits.length; i++) {
            makePurchasesFromDeposit(_deposits[i], availablePurchases[i]);
        }
    }
}
