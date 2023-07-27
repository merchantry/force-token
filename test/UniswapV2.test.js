const assert = require('assert');
const contracts = require('../compile');
const getContracts = require('../utils/oldVersionCompile');
const {
  deploy,
  getAccounts,
  getDeployedContract,
} = require('../utils/useWeb3');
const { useMethodOn, useMethodsOn } = require('../utils/contracts');
const { timeInSecs } = require('../utils/helper');

const erc20Contract = contracts['test/ERC20Token.sol'].ERC20Token;

const token1Name = 'Force Token';
const token1Symbol = 'FORCE';

const token2Name = 'TELOS';
const token2Symbol = 'wTLOS';

describe('UniswapV2 tests', () => {
  let accounts,
    ERC20Token1,
    ERC20Token2,
    UniswapV2Factory,
    UniswapV2Router02,
    uniswapPairContract;

  beforeEach(async () => {
    accounts = await getAccounts();

    ERC20Token1 = await deploy(
      erc20Contract,
      [token1Name, token1Symbol],
      accounts[0]
    );

    ERC20Token2 = await deploy(
      erc20Contract,
      [token2Name, token2Symbol],
      accounts[0]
    );

    const {
      UniswapV2Factory: uniswapFactoryContract,
      UniswapV2Router02: uniswapContract,
      UniswapV2Pair,
    } = await getContracts();

    uniswapPairContract = UniswapV2Pair;

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

  describe('UniswapV2Factory', () => {
    it('deploys successfully', () => {
      assert.ok(UniswapV2Factory.options.address);
    });
  });

  describe('UniswapV2Router02', () => {
    const addLiquidity = (amount1, amount2) =>
      useMethodsOn(ERC20Token1, [
        {
          method: 'mint',
          args: [accounts[0], amount1],
          account: accounts[0],
        },
        {
          method: 'approve',
          args: [UniswapV2Router02.options.address, amount1],
          account: accounts[0],
        },
      ])
        .then(() =>
          useMethodsOn(ERC20Token2, [
            {
              method: 'mint',
              args: [accounts[0], amount2],
              account: accounts[0],
            },
            {
              method: 'approve',
              args: [UniswapV2Router02.options.address, amount2],
              account: accounts[0],
            },
          ])
        )
        .then(() =>
          useMethodOn(UniswapV2Router02, {
            method: 'addLiquidity',
            args: [
              ERC20Token1.options.address,
              ERC20Token2.options.address,
              amount1,
              amount2,
              amount1,
              amount2,
              accounts[0],
              timeInSecs() + 100000,
            ],
            account: accounts[0],
          })
        );

    it('deploys successfully', () => {
      assert.ok(UniswapV2Router02.options.address);
    });

    it('has the correct factory address', () =>
      useMethodOn(UniswapV2Router02, {
        method: 'factory',
        onReturn: (factoryAddress) => {
          assert.strictEqual(factoryAddress, UniswapV2Factory.options.address);
        },
      }));

    it('adds liquidity', () => {
      const amount1 = 100000;
      const amount2 = 200000;

      return addLiquidity(amount1, amount2)
        .then(async () => {
          const pairAddress = await useMethodOn(UniswapV2Factory, {
            method: 'getPair',
            args: [ERC20Token1.options.address, ERC20Token2.options.address],
            onReturn: () => {},
          });

          return getDeployedContract(uniswapPairContract, pairAddress);
        })
        .then((UniswapV2Pair) =>
          useMethodOn(UniswapV2Pair, {
            method: 'getReserves',
            onReturn: (reserves) => {
              const reserve1 = parseInt(reserves[0]);
              const reserve2 = parseInt(reserves[1]);

              assert.strictEqual(reserve1 + reserve2, amount1 + amount2);
            },
          })
        );
    });

    it('allows swapping', () => {
      const amount1 = 100000;
      const amount2 = 100000;
      const amountIn = 1000;

      return addLiquidity(amount1, amount2)
        .then(() =>
          useMethodsOn(ERC20Token1, [
            {
              method: 'mint',
              args: [accounts[0], 1000000],
              account: accounts[0],
            },
            {
              method: 'approve',
              args: [UniswapV2Router02.options.address, 1000000],
              account: accounts[0],
            },
          ])
        )
        .then(() =>
          useMethodOn(UniswapV2Router02, {
            method: 'swapExactTokensForTokens',
            args: [
              10,
              1,
              [ERC20Token1.options.address, ERC20Token2.options.address],
              accounts[0],
              timeInSecs() + 100000,
            ],
          })
        )
        .then(() =>
          useMethodOn(ERC20Token2, {
            method: 'balanceOf',
            args: [accounts[0]],
            onReturn: (balance) => {
              console.log(balance);
            },
          })
        );
    });
  });
});
