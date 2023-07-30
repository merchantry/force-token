// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StoringDepositOptions.sol";
import "./TimeHandler.sol";
import "../libraries/Math.sol";

abstract contract RecordingDeposits is StoringDepositOptions, TimeHandler {
    struct Deposit {
        uint256 option;
        uint256 amountDeposited;
        uint256 depositedAt;
        uint256 purchasesMade;
        address depositor;
    }

    Deposit[] private deposits;
    mapping(address => uint256[]) private userDeposits;

    function addDeposit(
        uint256 option,
        uint256 amount,
        uint256 depositedAt,
        address user
    ) internal validOption(option) returns (Deposit storage) {
        require(amount > 0, "Amount must be greater than 0");

        userDeposits[user].push(deposits.length);
        deposits.push(
            Deposit({
                option: option,
                amountDeposited: amount,
                depositedAt: depositedAt,
                purchasesMade: 0,
                depositor: user
            })
        );

        return deposits[deposits.length - 1];
    }

    function _getDeposit(uint256 index) internal view returns (Deposit storage) {
        return deposits[index];
    }

    /**
     * @dev Returns the deposit at the given index.
     */
    function getDeposit(uint256 index) public view returns (Deposit memory) {
        return deposits[index];
    }

    function getAvailablePurchasesFromDeposit(
        Deposit memory userDeposit,
        uint256 currentTime
    ) private view returns (uint256) {
        (uint256 lockPeriod, uint256 numOfPurchases, ) = getOption(userDeposit.option);
        uint256 endTime = Math.min(userDeposit.depositedAt + lockPeriod, currentTime);
        uint256 timePassed = endTime - userDeposit.depositedAt;

        return Math.divideRoundUp((timePassed * numOfPurchases), lockPeriod) - userDeposit.purchasesMade;
    }

    function incrementPurchasesMade(Deposit storage userDeposit, uint256 amount) internal {
        (, uint256 numOfPurchases, ) = getOption(userDeposit.option);

        userDeposit.purchasesMade += amount;

        require(userDeposit.purchasesMade <= numOfPurchases, "All numOfPurchases already distributed");
    }

    /**
     * @dev Returns all deposits.
     */
    function getAllDeposits() public view returns (Deposit[] memory) {
        return deposits;
    }

    /**
     * @dev Returns all deposits made by the given user.
     * @param user The address of the user.
     */
    function getAllUserDeposits(address user) public view returns (Deposit[] memory) {
        uint256[] storage userDepositIndexes = userDeposits[user];
        Deposit[] memory userDepositsArray = new Deposit[](userDepositIndexes.length);

        for (uint256 i = 0; i < userDepositIndexes.length; i++) {
            userDepositsArray[i] = deposits[userDepositIndexes[i]];
        }

        return userDepositsArray;
    }

    function _getAllDepositsAndAvailablePurchases() internal view returns (Deposit[] storage, uint256[] memory) {
        uint256[] memory availablePurchases = new uint256[](deposits.length);

        uint256 currentTime = time();

        for (uint256 i = 0; i < deposits.length; i++) {
            availablePurchases[i] = getAvailablePurchasesFromDeposit(deposits[i], currentTime);
        }

        return (deposits, availablePurchases);
    }

    /**
     * @dev Returns all deposits and the calculated available purchases from each deposit.
     */
    function getAllDepositsAndAvailablePurchases() public view returns (Deposit[] memory, uint256[] memory) {
        return _getAllDepositsAndAvailablePurchases();
    }
}
