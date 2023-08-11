const assert = require('assert');
const contracts = require('../compile');
const oldVersionCompiler = require('../utils/OldVersionCompiler');
const {
  getAccounts,
  deploy,
  getDeployedContract,
} = require('../utils/useWeb3');
const {
  compiledContractMap,
  useMethodOn,
  useMethodsOn,
  mintToAndApproveFor,
  getContractEvents,
  getBalanceOfUser,
} = require('../utils/contracts');

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
        method: 'factory',
        onReturn: (factory) => {
          assert.strictEqual(factory, AlgebraFactory.options.address);
        },
      }));

    for (let i = 1; i <= 50; i++) {
      it(`swaps something ${i}`, () => {
        let AlgebraPool;
        let zeroToOne;
        const bigNum = 1n * 10n ** 18n;
        const liquidityDesired = 1n * 10n ** 9n;
        const token1Amount = bigNum;
        const token2Amount = bigNum;
        const q96 = 2n ** 96n;
        const encodedPrice = q96;
        const topTick = 6000;
        const bottomTick = -6000;
        const tradeAmount = 10000n;
        const minSqrtRatio = 4295128740n;
        const maxSqrtRatio = 1461446703485210103287273052203988822378723970341n;
        // console.log('encodedPrice', encodedPrice);

        const printBalancesOf = async (account, text = '') => {
          const balance1 = await getBalanceOfUser(ERC20Token1, account);
          const balance2 = await getBalanceOfUser(ERC20Token2, account);
          const symbol1 = await useMethodOn(ERC20Token1, {
            method: 'symbol',
            onReturn: () => {},
          });
          const symbol2 = await useMethodOn(ERC20Token2, {
            method: 'symbol',
            onReturn: () => {},
          });

          console.log(
            `${text} Balances ${symbol1}: ${balance1} ${symbol2}: ${balance2}`
          );
        };

        return useMethodsOn(AlgebraFactory, [
          {
            method: 'createPool',
            args: [ERC20Token1.options.address, ERC20Token2.options.address],
            account: accounts[0],
          },
          {
            method: 'poolByPair',
            args: [ERC20Token1.options.address, ERC20Token2.options.address],
            onReturn: () => {},
          },
        ])
          .then(async (poolAddress) => {
            AlgebraPool = await getDeployedContract(
              getOldVersionContract(
                'algebra/AlgebraPoolDeployer.sol:AlgebraPool'
              ),
              poolAddress
            );
            const token0 = await useMethodOn(AlgebraPool, {
              method: 'token0',
              onReturn: () => {},
            });
            zeroToOne = token0 === ERC20Token1.options.address;
          })
          .then(() =>
            mintToAndApproveFor(
              ERC20Token1,
              accounts[0],
              token1Amount,
              TestAlgebraCallee.options.address
            )
          )
          .then(() =>
            mintToAndApproveFor(
              ERC20Token2,
              accounts[0],
              token2Amount,
              TestAlgebraCallee.options.address
            )
          )
          .then(() =>
            useMethodOn(AlgebraPool, {
              method: 'initialize',
              args: [encodedPrice],
              account: accounts[0],
            })
          )
          .then(() =>
            useMethodsOn(TestAlgebraCallee, [
              {
                method: 'mint',
                args: [
                  AlgebraPool.options.address,
                  accounts[0],
                  bottomTick,
                  topTick,
                  liquidityDesired,
                ],
                account: accounts[0],
              },
              {
                then: async () => {
                  await printBalancesOf(
                    AlgebraPool.options.address,
                    'AlgebraPool before'
                  );
                },
              },
              {
                method: zeroToOne ? 'swapExact0For1' : 'swapExact1For0',
                args: [
                  AlgebraPool.options.address,
                  tradeAmount,
                  accounts[1],
                  zeroToOne ? minSqrtRatio : maxSqrtRatio,
                ],
                account: accounts[0],
              },
            ])
          )
          .then(async () => {
            const events = await getContractEvents(AlgebraPool);
            const {
              data: { amount0, amount1, liquidity },
            } = events.find(({ event }) => event === 'Swap');
            console.log(
              `Swap amount0: ${amount0} amount1: ${amount1} liquidity: ${liquidity}`
            );
            await printBalancesOf(accounts[1], 'accounts[1]');
            await printBalancesOf(
              AlgebraPool.options.address,
              'AlgebraPool after'
            );
          });
      });
    }
  });

  describe('AlgebraFactory', () => {
    it('deploys successfully', () => {
      assert.ok(AlgebraFactory.options.address);
    });

    it('has reference to pool deployer', () =>
      useMethodOn(AlgebraFactory, {
        method: 'poolDeployer',
        onReturn: (poolDeployer) => {
          assert.strictEqual(poolDeployer, AlgebraPoolDeployer.options.address);
        },
      }));
  });

  describe('AlgebraPoolDeployer', () => {
    it('deploys successfully', () => {
      assert.ok(AlgebraPoolDeployer.options.address);
    });

    it('has reference to pool deployer', () =>
      useMethodOn(AlgebraPoolDeployer, {
        method: 'parameters',
        onReturn: (parameters) => {
          // console.log(parameters);
        },
      }));
  });
});
