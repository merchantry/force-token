// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract StoringDepositOptions {
    struct Option {
        uint256 lockPeriod;
        uint256 numOfPurchases;
        uint256 rewardBonusInTenthPerc;
    }

    Option[] private options;

    constructor(Option[] memory _options) {
        for (uint256 i = 0; i < _options.length; i++) {
            options.push(_options[i]);
        }
    }

    modifier validOption(uint256 _option) {
        require(_option < options.length, "Invalid option");
        _;
    }

    function getOption(uint256 option) public view validOption(option) returns (uint256, uint256, uint256) {
        Option memory _option = options[option];

        return (_option.lockPeriod, _option.numOfPurchases, _option.rewardBonusInTenthPerc);
    }

    function getOptions() public view returns (Option[] memory) {
        return options;
    }
}
