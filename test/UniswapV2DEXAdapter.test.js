const assert = require('assert');
const contracts = require('../compile');
const { deploy, getAccounts } = require('../utils/useWeb3');
const { useMethodOn, compiledContractMap } = require('../utils/contracts');
const getContracts = require('../utils/oldVersionCompile');
const { addLiquidity, calculateOutAmount } = require('../utils/uniswap');
const { randomInt } = require('../utils/helper');

const getContract = compiledContractMap(contracts);

const name = 'Force Token';
const symbol = 'FORCE';

const tlosName = 'Telos';
const tlosSymbol = 'TLOS';

describe('UniswapV2DEXAdapter tests', () => {
  let accounts,
    getOldVersionContract,
    ForceToken,
    ERC20Token,
    UniswapV2DEXAdapter,
    UniswapV2Factory,
    UniswapV2Router02;

  before(async () => {
    getOldVersionContract = compiledContractMap(await getContracts());
  });

  beforeEach(async () => {
    accounts = await getAccounts();

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
    UniswapV2DEXAdapter = await deploy(
      getContract('DEXAdapterHandlerUtils/UniswapV2DEXAdapter.sol'),
      [UniswapV2Router02.options.address],
      accounts[0]
    );
    ForceToken = await deploy(
      getContract('ForceToken.sol'),
      [name, symbol],
      accounts[0]
    );
    ERC20Token = await deploy(
      getContract('test/ERC20Token.sol'),
      [tlosName, tlosSymbol],
      accounts[0]
    );
  });

  describe('UniswapV2DEXAdapter', () => {
    it('has reference to UniswapV2Router02', () =>
      useMethodOn(UniswapV2DEXAdapter, {
        // We get the address of the UniswapV2Router02 contract
        method: 'getUniswapRouter',
        onReturn: (uniswapRouterAddress) => {
          // And check that it is the same as the one we deployed
          assert.strictEqual(
            uniswapRouterAddress,
            UniswapV2Router02.options.address
          );
        },
      }));

    it('swaps held wTLOS tokens with FORCE tokens', () => {
      const amount1 = randomInt(100000, 1000000);
      const amount2 = randomInt(100000, 1000000);
      const tlosAmount = randomInt(1000, 10000);
      const sendToAccount = accounts[1];

      // We add liquidity to the UniswapV2Router02 contract
      return addLiquidity(
        UniswapV2Router02,
        ERC20Token,
        ForceToken,
        amount1,
        amount2,
        accounts[0]
      )
        .then(() =>
          useMethodOn(ERC20Token, {
            // We must first mint the ERC20Token to the UniswapV2Router02 contract
            // which we plan to swap
            method: 'mint',
            args: [UniswapV2DEXAdapter.options.address, tlosAmount],
            account: accounts[0],
          })
        )
        .then(() =>
          useMethodOn(UniswapV2DEXAdapter, {
            // The user then calls the swap method on the UniswapV2DEXAdapter
            method: 'swap',
            args: [
              tlosAmount,
              sendToAccount,
              ERC20Token.options.address,
              ForceToken.options.address,
            ],
            account: accounts[0],
          })
        )
        .then(() =>
          useMethodOn(ForceToken, {
            // We check the balance of the user to ensure that the swap was successful
            method: 'balanceOf',
            args: [sendToAccount],
            onReturn: (balance) => {
              // We calculate the expected amount of FORCE tokens to be received
              const expectedAmount = calculateOutAmount(
                tlosAmount,
                amount1,
                amount2
              );
              // And check that the balance is equal to the expected amount
              assert.strictEqual(parseInt(balance), expectedAmount);
            },
          })
        );
    });

    it('throws error if insufficient balance', () => {
      const amount1 = 100000;
      const amount2 = 100000;
      const tlosAmount = 1000;
      const sendToAccount = accounts[1];

      let errorRaised = false;

      return addLiquidity(
        UniswapV2Router02,
        ERC20Token,
        ForceToken,
        amount1,
        amount2,
        accounts[0]
      )
        .then(() =>
          useMethodOn(UniswapV2DEXAdapter, {
            // The user then calls the swap method on the UniswapV2DEXAdapter,
            // without having transfered the required amount of wTLOS tokens
            // to the UniswapV2DEXAdapter contract
            method: 'swap',
            args: [
              tlosAmount,
              sendToAccount,
              ERC20Token.options.address,
              ForceToken.options.address,
            ],
            account: accounts[0],
            catch: (err) => {
              // We check that the error raised is the correct one
              assert.strictEqual(err, 'TransferHelper: TRANSFER_FROM_FAILED');
              errorRaised = true;
            },
          })
        )
        .then(() => {
          assert.ok(errorRaised);
        });
    });
  });
});
