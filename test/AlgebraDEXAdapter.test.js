const assert = require('assert');
const contracts = require('../compile');
const { deploy, getAccounts } = require('../utils/useWeb3');
const { useMethodOn, compiledContractMap } = require('../utils/contracts');
const oldVersionCompiler = require('../utils/OldVersionCompiler');
const { addLiquidity } = require('../utils/algebra');
const { valuesWithinPercentage, randomInt } = require('../utils/helper');

const getContract = compiledContractMap(contracts);

describe('AlgebraDEXAdapter tests', () => {
  let accounts,
    vaultAddress,
    getOldVersionContract,
    TestAlgebraCallee,
    AlgebraFactory,
    AlgebraPoolDeployer,
    ERC20Token1,
    ERC20Token2,
    SwapRouter,
    AlgebraDEXAdapter;

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

    AlgebraDEXAdapter = await deploy(
      getContract('AlgebraDEXAdapter.sol'),
      [SwapRouter.options.address],
      accounts[0]
    );
  });

  describe('AlgebraDEXAdapter', () => {
    it('has reference to SwapRouter', () =>
      useMethodOn(AlgebraDEXAdapter, {
        // We get the address of the swap router from the adapter contract
        method: 'getUniswapRouter',
        onReturn: (uniswapRouterAddress) => {
          // And check if it matches the address of the swap router we deployed
          assert.strictEqual(uniswapRouterAddress, SwapRouter.options.address);
        },
      }));

    it('swaps held wTLOS tokens with FORCE tokens', () => {
      const tlosAmount = randomInt(1000, 10000);
      const sendToAccount = accounts[1];

      // We initiate and add liquidity to the pool
      return addLiquidity(
        SwapRouter,
        AlgebraFactory,
        TestAlgebraCallee,
        ERC20Token1,
        ERC20Token2,
        getOldVersionContract('algebra/AlgebraPoolDeployer.sol:AlgebraPool'),
        tlosAmount,
        accounts[0]
      )
        .then(() =>
          useMethodOn(ERC20Token1, {
            // We mint wTLOS tokens to the DEX adapter contract
            // In a real scenario, this would be done by the DEXAdapterHandler
            method: 'mint',
            args: [AlgebraDEXAdapter.options.address, tlosAmount],
            account: accounts[0],
          })
        )
        .then(() =>
          useMethodOn(AlgebraDEXAdapter, {
            // We initiate the swap through the adapter contract
            method: 'swap',
            args: [
              tlosAmount,
              sendToAccount,
              ERC20Token1.options.address,
              ERC20Token2.options.address,
            ],
            account: accounts[0],
          })
        )
        .then(() =>
          useMethodOn(ERC20Token2, {
            // We get the balance of the account we sent the tokens to
            method: 'balanceOf',
            args: [sendToAccount],
            onReturn: (balance) => {
              // And check if the balance is within 1% of the amount we sent
              // This is done to account for the fee
              assert.ok(
                valuesWithinPercentage(parseInt(balance), tlosAmount, 1)
              );
            },
          })
        );
    });

    it('throws error if insufficient balance', () => {
      const tlosAmount = randomInt(1000, 10000);
      const sendToAccount = accounts[1];

      let errorRaised = false;

      return addLiquidity(
        SwapRouter,
        AlgebraFactory,
        TestAlgebraCallee,
        ERC20Token1,
        ERC20Token2,
        getOldVersionContract('algebra/AlgebraPoolDeployer.sol:AlgebraPool'),
        tlosAmount,
        accounts[0]
      )
        .then(() =>
          useMethodOn(AlgebraDEXAdapter, {
            // We initiate the swap through the adapter contract
            // without minting wTLOS tokens to the adapter contract
            method: 'swap',
            args: [
              tlosAmount,
              sendToAccount,
              ERC20Token1.options.address,
              ERC20Token2.options.address,
            ],
            catch: (err) => {
              // We check that the correct error is raised
              assert.strictEqual(err, 'STF');
              errorRaised = true;
            },
            account: accounts[0],
          })
        )
        .then(() => {
          // We check that the error was raised
          assert.ok(errorRaised);
        });
    });
  });
});
