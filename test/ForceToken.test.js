const assert = require('assert');
const contracts = require('../compile');
const getContracts = require('../utils/oldVersionCompile');
const { deploy, getAccounts } = require('../utils/useWeb3');
const { useMethodOn, useMethodsOn } = require('../utils/contracts');
const { timeInSecs } = require('../utils/helper');

const tokenContract = contracts['ForceToken.sol'].ForceToken;
const erc20Contract = contracts['test/ERC20Token.sol'].ERC20Token;

const name = 'Force Token';
const symbol = 'FORCE';

const tlosName = 'TELOS';
const tlosSymbol = 'wTLOS';

describe('ForceToken tests', () => {
  let accounts, ForceToken, ERC20Token, UniswapV2Factory, UniswapV2Router02;

  beforeEach(async () => {
    accounts = await getAccounts();
    ForceToken = await deploy(tokenContract, [name, symbol], accounts[0]);
    ERC20Token = await deploy(
      erc20Contract,
      [tlosName, tlosSymbol],
      accounts[0]
    );

    const {
      UniswapV2Factory: uniswapFactoryContract,
      UniswapV2Router02: uniswapContract,
    } = await getContracts();

    UniswapV2Factory = await deploy(
      uniswapFactoryContract,
      [accounts[0]],
      accounts[0]
    );
    UniswapV2Router02 = await deploy(
      uniswapContract,
      [UniswapV2Factory.options.address, accounts[0]],
      accounts[0]
    );
  });

  describe('ForceToken', () => {
    it('deploys successfully', () => {
      assert.ok(ForceToken.options.address);
    });
  });
});
