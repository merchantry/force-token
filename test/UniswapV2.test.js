const assert = require('assert');
const contracts = require('../compile');
const getContracts = require('../utils/oldVersionCompile');
const {
  deploy,
  getAccounts,
  getDeployedContract,
} = require('../utils/useWeb3');
const {
  useMethodOn,
  useMethodsOn,
  compiledContractMap,
} = require('../utils/contracts');
const { timeInSecs, valuesWithin } = require('../utils/helper');
const { randomInt } = require('crypto');
const { addLiquidity, calculateOutAmount } = require('../utils/uniswap');

const getContract = compiledContractMap(contracts);

const token1Name = 'Force Token';
const token1Symbol = 'FORCE';

const token2Name = 'TELOS';
const token2Symbol = 'wTLOS';

describe('UniswapV2 tests', () => {
  let accounts,
    getOldVersionContract,
    ERC20Token1,
    ERC20Token2,
    UniswapV2Factory,
    UniswapV2Router02;

  before(async () => {
    getOldVersionContract = compiledContractMap(await getContracts());
  });

  beforeEach(async () => {
    accounts = await getAccounts();

    ERC20Token1 = await deploy(
      getContract('test/ERC20Token.sol'),
      [token1Name, token1Symbol],
      accounts[0]
    );

    ERC20Token2 = await deploy(
      getContract('test/ERC20Token.sol'),
      [token2Name, token2Symbol],
      accounts[0]
    );

    UniswapV2Factory = await deploy(
      getOldVersionContract('uniswap/UniswapV2Factory.sol'),
      [accounts[0]],
      accounts[0]
    );
    UniswapV2Router02 = await deploy(
      getOldVersionContract('uniswap/UniswapV2Router02.sol'),
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
    it('deploys successfully', () => {
      assert.ok(UniswapV2Router02.options.address);
    });

    it('has the correct factory address', () =>
      useMethodOn(UniswapV2Router02, {
        // We get the factory address from the router contract
        method: 'factory',
        onReturn: (factoryAddress) => {
          // And we check that it matches the factory address we deployed
          assert.strictEqual(factoryAddress, UniswapV2Factory.options.address);
        },
      }));

    it('adds liquidity', () => {
      const amount1 = 100000;
      const amount2 = 200000;

      return addLiquidity(
        UniswapV2Router02,
        ERC20Token1,
        ERC20Token2,
        amount1,
        amount2,
        accounts[0]
      )
        .then(async () => {
          // We get the pair address from the factory contract
          const pairAddress = await useMethodOn(UniswapV2Factory, {
            method: 'getPair',
            args: [ERC20Token1.options.address, ERC20Token2.options.address],
            onReturn: () => {},
          });

          // We get the pair contract from the pair address
          return getDeployedContract(
            getOldVersionContract('uniswap/UniswapV2Factory.sol:UniswapV2Pair'),
            pairAddress
          );
        })
        .then((UniswapV2Pair) =>
          useMethodOn(UniswapV2Pair, {
            // We get the reserves from the pair contract
            method: 'getReserves',
            onReturn: (reserves) => {
              const reserve1 = parseInt(reserves[0]);
              const reserve2 = parseInt(reserves[1]);

              // And we check that they match the amounts we added
              assert.strictEqual(reserve1 + reserve2, amount1 + amount2);
            },
          })
        );
    });

    it('allows swapping', () => {
      const amount1 = randomInt(100000, 1000000);
      const amount2 = randomInt(100000, 1000000);
      const amountIn = randomInt(1000, 10000);

      // We must add liquidity before we can swap
      return addLiquidity(
        UniswapV2Router02,
        ERC20Token1,
        ERC20Token2,
        amount1,
        amount2,
        accounts[0]
      )
        .then(() =>
          useMethodsOn(ERC20Token1, [
            {
              // We mint the amount of Token1 we want to swap
              method: 'mint',
              args: [accounts[0], amountIn],
              account: accounts[0],
            },
            {
              // And we approve the router to spend the amount we want to swap
              method: 'approve',
              args: [UniswapV2Router02.options.address, amountIn],
              account: accounts[0],
            },
          ])
        )
        .then(() =>
          useMethodOn(UniswapV2Router02, {
            // User swaps Token1 for Token2
            // They must specify the amount of Token1 they want to swap,
            // the minimum amount of Token2 they want to receive,
            // the path of tokens to swap (in this case, Token1 -> Token2),
            // the account to send the swapped tokens to,
            // and the deadline for the swap.
            // They must previously have approved the router to spend
            // the amount of Token1 they want to swap.
            method: 'swapExactTokensForTokens',
            args: [
              amountIn,
              1,
              [ERC20Token1.options.address, ERC20Token2.options.address],
              accounts[0],
              timeInSecs() + 100000,
            ],
            account: accounts[0],
          })
        )
        .then(() =>
          useMethodOn(ERC20Token2, {
            // We check the balance of the account we sent the swapped tokens to
            method: 'balanceOf',
            args: [accounts[0]],
            onReturn: (balance) => {
              // We calculate the expected amount of Token2 to receive
              const expectedAmount = calculateOutAmount(
                amountIn,
                amount1,
                amount2
              );
              // And we check that the balance matches the expected amount
              assert.ok(valuesWithin(parseInt(balance), expectedAmount, 2));
            },
          })
        );
    });
  });
});
