const assert = require('assert');
const contracts = require('../compile');
const oldVersionCompiler = require('../utils/OldVersionCompiler');
const { getAccounts, deploy } = require('../utils/useWeb3');
const {
  compiledContractMap,
  useMethodOn,
  getContractEvents,
  getBalanceOfUser,
} = require('../utils/contracts');
const { addLiquidity } = require('../utils/algebra');
const {
  valuesWithinPercentage,
  timeInSecs,
  randomInt,
} = require('../utils/helper');

const getContract = compiledContractMap(contracts);

describe('SwapRouter tests', () => {
  let accounts,
    vaultAddress,
    getOldVersionContract,
    TestAlgebraCallee,
    AlgebraFactory,
    AlgebraPoolDeployer,
    ERC20Token1,
    ERC20Token2,
    SwapRouter;

  before(async () => {
    getOldVersionContract = compiledContractMap(await oldVersionCompiler.get());
  });

  beforeEach(async () => {
    accounts = await getAccounts();
    vaultAddress = accounts[0];

    TestAlgebraCallee = await deploy(
      getContract('test/TestAlgebraCallee.sol'),
      [],
      accounts[0]
    );

    ERC20Token1 = await deploy(
      getContract('test/ERC20Token.sol'),
      ['Force Token', 'FORCE'],
      accounts[0]
    );

    ERC20Token2 = await deploy(
      getContract('test/ERC20Token.sol'),
      ['TELOS', 'wTLOS'],
      accounts[0]
    );

    AlgebraPoolDeployer = await deploy(
      getOldVersionContract('algebra/AlgebraPoolDeployer.sol'),
      [],
      accounts[0]
    );

    AlgebraFactory = await deploy(
      getOldVersionContract('algebra/AlgebraFactory.sol'),
      [AlgebraPoolDeployer.options.address, vaultAddress],
      accounts[0]
    );

    await useMethodOn(AlgebraPoolDeployer, {
      method: 'setFactory',
      args: [AlgebraFactory.options.address],
      account: accounts[0],
    });

    SwapRouter = await deploy(
      getOldVersionContract('algebra/SwapRouter.sol'),
      [
        AlgebraFactory.options.address,
        ERC20Token1.options.address,
        AlgebraPoolDeployer.options.address,
      ],
      accounts[0]
    );
  });

  describe('SwapRouter', () => {
    it('deploys successfully', () => {
      assert.ok(SwapRouter.options.address);
    });

    it('has reference to factory', () =>
      useMethodOn(SwapRouter, {
        // We get the factory address from the SwapRouter contract
        method: 'factory',
        onReturn: (factory) => {
          // And check if it matches the address of the factory we deployed
          assert.strictEqual(factory, AlgebraFactory.options.address);
        },
      }));

    it('executes swap', () => {
      const tradeAmount = randomInt(10000, 100000);
      const tradeReceiver = accounts[1];

      return addLiquidity(
        SwapRouter,
        AlgebraFactory,
        TestAlgebraCallee,
        ERC20Token1,
        ERC20Token2,
        getOldVersionContract('algebra/AlgebraPoolDeployer.sol:AlgebraPool'),
        tradeAmount,
        accounts[0]
      ).then(({ zeroToOne, AlgebraPool }) =>
        useMethodOn(SwapRouter, {
          // We initiate the swap
          method: 'exactInputSingle',
          args: [
            // We pass the arguments as `ExactInputSingleParams` struct
            {
              tokenIn: ERC20Token1.options.address,
              tokenOut: ERC20Token2.options.address,
              recipient: tradeReceiver,
              deadline: timeInSecs() + 1000,
              amountIn: tradeAmount,
              amountOutMinimum: 1,
              limitSqrtPrice: 0,
            },
          ],
          account: accounts[0],
        }).then(async () => {
          const events = await getContractEvents(AlgebraPool);
          const swapData = events.find(({ event }) => event === 'Swap').data;
          // Depending on which token is token0, we check the amount of
          // token0 or token1 that was swapped
          const [swapAmountIn, swapAmountOut] = (
            zeroToOne
              ? [swapData.amount0, swapData.amount1]
              : [swapData.amount1, swapData.amount0]
          ).map((v) => parseInt(v));
          // We get the balance of the user that received the swap
          const balance = await getBalanceOfUser(ERC20Token2, tradeReceiver);

          // We check that the amount of token sent to the swap is equal to tradeAmount
          assert.strictEqual(swapAmountIn, tradeAmount);
          // We check that the amount of token received from the swap is equal to the balance
          // of the user that received the swap
          assert.strictEqual(balance, -swapAmountOut);
          // We check that the amount of token received from the swap is within 1% of the
          // amount of token sent to the swap. This is to account for the fees
          assert.ok(valuesWithinPercentage(-swapAmountOut, tradeAmount, 1));
        })
      );
    });
  });

  describe('AlgebraFactory', () => {
    it('deploys successfully', () => {
      assert.ok(AlgebraFactory.options.address);
    });

    it('has reference to pool deployer', () =>
      useMethodOn(AlgebraFactory, {
        // We get the address of the pool deployer from the factory
        method: 'poolDeployer',
        onReturn: (poolDeployer) => {
          // And check if it matches the address of the pool deployer we deployed
          assert.strictEqual(poolDeployer, AlgebraPoolDeployer.options.address);
        },
      }));
  });

  describe('AlgebraPoolDeployer', () => {
    it('deploys successfully', () => {
      assert.ok(AlgebraPoolDeployer.options.address);
    });
  });
});
