const assert = require('assert');
const contracts = require('../compile');
const { deploy, getAccounts } = require('../utils/useWeb3');
const {
  useMethodOn,
  useMethodsOn,
  compiledContractMap,
} = require('../utils/contracts');
const {
  timeInSecs,
  newArray,
  randomInt,
  runPromisesInSequence,
} = require('../utils/helper');
const oldVersionCompiler = require('../utils/OldVersionCompiler');
const { month, year, day } = require('../utils/timePeriods');
const { addLiquidity } = require('../utils/uniswap');

const getContract = compiledContractMap(contracts);

const name = 'Force Token';
const symbol = 'FORCE';

const tlosName = 'Telos';
const tlosSymbol = 'TLOS';

const options = [
  {
    lockPeriod: 3 * month,
    numOfPurchases: 10,
    rewardBonusInTenthPerc: 125,
  },
  {
    lockPeriod: 6 * month,
    numOfPurchases: 19,
    rewardBonusInTenthPerc: 250,
  },
  {
    lockPeriod: year,
    numOfPurchases: 37,
    rewardBonusInTenthPerc: 500,
  },
  {
    lockPeriod: 2 * year,
    numOfPurchases: 74,
    rewardBonusInTenthPerc: 740,
  },
  {
    lockPeriod: 3 * year,
    numOfPurchases: 111,
    rewardBonusInTenthPerc: 1110,
  },
];

describe('ForceTokenSale tests', () => {
  let accounts,
    getOldVersionContract,
    ForceToken,
    ForceTokenSale,
    ERC20Token,
    UniswapV2DEXAdapter,
    UniswapV2Factory,
    UniswapV2Router02;

  before(async () => {
    getOldVersionContract = compiledContractMap(await oldVersionCompiler.get());
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
      getContract('UniswapV2DEXAdapter.sol'),
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
    ForceTokenSale = await deploy(
      getContract('ForceTokenSale.sol'),
      [
        UniswapV2DEXAdapter.options.address,
        ERC20Token.options.address,
        ForceToken.options.address,
        options.map((option) => Object.values(option)),
      ],
      accounts[0]
    );
  });

  const getForceTokenSaleTest = async (time = timeInSecs()) =>
    deploy(
      // We use a test version of the ForceTokenSale
      // contract to set the timestamp for testing
      getContract('test/ForceTokenSaleTest.sol'),
      [
        UniswapV2DEXAdapter.options.address,
        ERC20Token.options.address,
        ForceToken.options.address,
        options.map((option) => Object.values(option)),
        time,
      ],
      accounts[0]
    );

  const generateUserDepositData = (length = 3) =>
    newArray(length, () => ({
      tlosAmount: randomInt(10000, 100000),
      optionIndex: randomInt(0, options.length - 1),
      account: accounts[randomInt(1, 3)],
    }));

  const getDepositsPerUser = (userDepositData) =>
    userDepositData.reduce((totalPerUser, { tlosAmount, account }) => {
      const total = totalPerUser[account] || 0;
      return { ...totalPerUser, [account]: total + tlosAmount };
    }, {});

  /**
   * Adds liquidity to the UniswapV2Router02 contract for the given tokens and amounts.
   * Mints user deposit amounts and approves the ForceTokenSale contract to spend them.
   */
  const setUpUserDeposits = (
    SaleContract,
    userDepositData = generateUserDepositData()
  ) => {
    const liquidityAmount =
      userDepositData.reduce((total, { tlosAmount }) => total + tlosAmount, 0) *
      10000;
    const rewardPool = liquidityAmount;

    const totalToDepositPerUser = getDepositsPerUser(userDepositData);

    return addLiquidity(
      UniswapV2Router02,
      ERC20Token,
      ForceToken,
      liquidityAmount,
      liquidityAmount,
      accounts[0]
    )
      .then(() =>
        useMethodsOn(
          ERC20Token,
          Object.entries(totalToDepositPerUser).flatMap(
            ([account, tlosAmount]) => [
              {
                // We mint the TLOS tokens to the user
                method: 'mint',
                args: [account, tlosAmount],
                account: accounts[0],
              },
              {
                // Each user approves the ForceTokenSale contract to spend their TLOS
                // for the deposit
                method: 'approve',
                args: [SaleContract.options.address, tlosAmount],
                account,
              },
            ]
          )
        )
      )
      .then(() =>
        useMethodOn(ForceToken, {
          // We mint the reward pool to the ForceTokenSale contract
          // This is used to reward users for their deposits above
          // the amount they exchanged with TLOS tokens
          method: 'mint',
          args: [SaleContract.options.address, rewardPool],
          account: accounts[0],
        })
      )
      .then(() =>
        useMethodsOn(
          SaleContract,
          userDepositData.map(({ account, tlosAmount, optionIndex }) => ({
            // Each user makes a deposit
            method: 'deposit',
            args: [tlosAmount, optionIndex],
            account,
          }))
        )
      );
  };

  describe('ForceTokenSale', () => {
    it('deploys successfully', () => {
      assert.ok(ForceTokenSale.options.address);
    });

    it('completes all outstanding purchases', async () => {
      const time = timeInSecs();
      const ForceTokenSaleTest = await getForceTokenSaleTest(time);
      const times = [1, ...options.map((o) => o.lockPeriod)];
      const userDeposits = options.map((_, i) => ({
        tlosAmount: 10000,
        optionIndex: i,
        account: accounts[i + 1],
      }));
      const users = userDeposits.map(({ account }) => account);

      return setUpUserDeposits(ForceTokenSaleTest, userDeposits).then(() =>
        runPromisesInSequence(
          times.map(
            (t) => () =>
              useMethodsOn(ForceTokenSaleTest, [
                {
                  // We skip to each option's lock period
                  // end time to complete all outstanding purchases
                  method: 'setTimestamp',
                  args: [time + t],
                  account: accounts[0],
                },
                {
                  // Owner completes all outstanding purchases
                  method: 'completeAllOutstandingPurchases',
                  account: accounts[0],
                },
                {
                  // We get all deposits
                  method: 'getAllDeposits',
                  onReturn: (deposits) => {
                    deposits.forEach(
                      ({
                        purchasesMade: _purchasesMade,
                        option: optionIndex,
                      }) => {
                        const option = options[parseInt(optionIndex)];

                        const purchasesMade = parseInt(_purchasesMade);
                        const maxPurchases = option.numOfPurchases;
                        const periodFinished = t >= option.lockPeriod;

                        if (periodFinished) {
                          // If the lock period has finished, we assert that
                          // all purchases have been made
                          assert.strictEqual(purchasesMade, maxPurchases);
                        }
                      }
                    );
                  },
                },
              ]).then(() =>
                useMethodsOn(
                  ForceToken,
                  users.map((user) => ({
                    method: 'balanceOf',
                    args: [user],
                    onReturn: (balance) => {
                      // We assert that each user has received their
                      // exchanged and reward FORCE tokens
                      assert.ok(parseInt(balance) > 0);
                    },
                  }))
                )
              )
          )
        )
      );
    });
  });

  describe('StoringDepositOptions', () => {
    it('returns options array', () =>
      useMethodOn(ForceTokenSale, {
        // We get the options array
        method: 'getOptions',
        onReturn: (_options) => {
          assert.strictEqual(_options.length, options.length);

          // And we check that each option has the correct values
          _options.forEach((option, index) => {
            assert.strictEqual(
              parseInt(option.lockPeriod),
              options[index].lockPeriod
            );
            assert.strictEqual(
              parseInt(option.numOfPurchases),
              options[index].numOfPurchases
            );
            assert.strictEqual(
              parseInt(option.rewardBonusInTenthPerc),
              options[index].rewardBonusInTenthPerc
            );
          });
        },
      }));

    it('returns option data', () =>
      useMethodsOn(
        ForceTokenSale,
        options.map((_, index) => ({
          // We get each option's data
          method: 'getOption',
          args: [index],
          onReturn: (option) => {
            // And we check that each option has the correct values
            assert.strictEqual(parseInt(option[0]), options[index].lockPeriod);
            assert.strictEqual(
              parseInt(option[1]),
              options[index].numOfPurchases
            );
            assert.strictEqual(
              parseInt(option[2]),
              options[index].rewardBonusInTenthPerc
            );
          },
        }))
      ));
  });

  describe('ForceTokenSaleTest', () => {
    it('returns all deposits', () => {
      const userDepositData = generateUserDepositData(5);

      // We set up the user deposits
      return setUpUserDeposits(ForceTokenSale, userDepositData).then(() =>
        useMethodOn(ForceTokenSale, {
          // We get all deposits from the contract
          method: 'getAllDeposits',
          onReturn: (deposits) => {
            assert.strictEqual(deposits.length, userDepositData.length);

            // And we check that each deposit has the correct values
            deposits.forEach(
              ({ amountDeposited, option, depositor, purchasesMade }, i) => {
                assert.strictEqual(
                  parseInt(amountDeposited),
                  userDepositData[i].tlosAmount
                );
                assert.strictEqual(
                  parseInt(option),
                  userDepositData[i].optionIndex
                );
                assert.strictEqual(depositor, userDepositData[i].account);
                // On deposit, we always trigger the initial purchase,
                // so we assert that purchasesMade is 1
                assert.strictEqual(parseInt(purchasesMade), 1);
              }
            );
          },
        })
      );
    });

    it('returns deposit data', () => {
      const userDepositData = generateUserDepositData(5);

      // We set up the user deposits
      return setUpUserDeposits(ForceTokenSale, userDepositData).then(() =>
        useMethodsOn(
          ForceTokenSale,
          userDepositData.map(({ tlosAmount, optionIndex, account }, i) => ({
            // We get each deposit's data
            method: 'getDeposit',
            args: [i],
            onReturn: ({ option, amountDeposited, depositor }) => {
              // And we check that each deposit has the correct values
              assert.strictEqual(parseInt(option), optionIndex);
              assert.strictEqual(parseInt(amountDeposited), tlosAmount);
              assert.strictEqual(depositor, account);
            },
          }))
        )
      );
    });

    it('returns all user deposits', () => {
      const userDepositData = generateUserDepositData(5);
      const users = Array.from(
        new Set(userDepositData.map(({ account }) => account))
      );

      // We set up the user deposits
      return setUpUserDeposits(ForceTokenSale, userDepositData).then(() =>
        useMethodsOn(
          ForceTokenSale,
          users.map((account) => ({
            // We get each user's deposits
            method: 'getAllUserDeposits',
            args: [account],
            onReturn: (deposits) => {
              const userDeposits = userDepositData.filter(
                (d) => d.account === account
              );

              // And we check that each deposit has the correct values
              assert.strictEqual(deposits.length, userDeposits.length);

              deposits.forEach(({ amountDeposited, option }, i) => {
                assert.strictEqual(
                  parseInt(amountDeposited),
                  userDeposits[i].tlosAmount
                );
                assert.strictEqual(
                  parseInt(option),
                  userDeposits[i].optionIndex
                );
              });
            },
          }))
        )
      );
    });

    const generateUserDeposits = (length) =>
      newArray(length, () => ({
        option: randomInt(0, options.length - 1),
        amount: randomInt(10000, 100000),
        depositedAt: timeInSecs() - randomInt(3 * month, 3 * year),
        user: accounts[randomInt(1, 3)],
      }));

    const addUserDeposits = (
      ForceTokenSale,
      userDeposits = generateUserDeposits(5)
    ) =>
      useMethodsOn(
        ForceTokenSale,
        userDeposits.map(({ option, amount, depositedAt, user }) => ({
          method: 'addDepositTest',
          args: [option, amount, depositedAt, user],
          account: accounts[0],
        }))
      );

    it('returns all deposits and available purchases', async () => {
      const ForceTokenSaleTest = await getForceTokenSaleTest();
      const userDeposits = generateUserDeposits(5);

      // We add the user deposits
      return addUserDeposits(ForceTokenSaleTest, userDeposits).then(() =>
        useMethodOn(ForceTokenSaleTest, {
          method: 'getAllDepositsAndAvailablePurchases',
          onReturn: (depositsAndAvailablePurchases) => {
            const deposits = depositsAndAvailablePurchases[0];
            const availablePurchases = depositsAndAvailablePurchases[1].map(
              (ap) => parseInt(ap)
            );

            // And we check that each deposit has the correct values
            assert.strictEqual(deposits.length, userDeposits.length);

            deposits.forEach(
              ({ amountDeposited, option, depositor, depositedAt }, i) => {
                assert.strictEqual(
                  parseInt(amountDeposited),
                  userDeposits[i].amount
                );
                assert.strictEqual(parseInt(option), userDeposits[i].option);
                assert.strictEqual(depositor, userDeposits[i].user);
                assert.strictEqual(
                  parseInt(depositedAt),
                  userDeposits[i].depositedAt
                );
              }
            );

            // We check that each available purchase is greater than 0,
            // as each deposit triggers an initial purchase
            assert.ok(availablePurchases.every((ap) => ap > 0));
          },
        })
      );
    });

    it('increments purchases made on deposits', async () => {
      const ForceTokenSaleTest = await getForceTokenSaleTest();
      const length = 5;
      const userDeposits = generateUserDeposits(length);

      return addUserDeposits(ForceTokenSaleTest, userDeposits).then(() =>
        useMethodsOn(ForceTokenSaleTest, [
          ...newArray(length, (i) => ({
            // We increment the purchases made on each deposit
            method: 'incrementPurchasesMadeTest',
            args: [i, i + 1],
            account: accounts[0],
          })),
          {
            method: 'getAllDeposits',
            onReturn: (deposits) => {
              deposits.forEach(({ purchasesMade }, i) => {
                // And we check that each deposit has the correct values
                assert.strictEqual(parseInt(purchasesMade), i + 1);
              });
            },
          },
        ])
      );
    });

    it('correctly calculates available purchases', async () => {
      const time = timeInSecs();
      const ForceTokenSaleTest = await getForceTokenSaleTest(time);
      const times = [1, ...options.map((o) => o.lockPeriod)];
      const userDeposits = options.map((_, i) => ({
        tlosAmount: 10000,
        optionIndex: i,
        account: accounts[randomInt(1, 3)],
      }));

      return setUpUserDeposits(ForceTokenSaleTest, userDeposits).then(() =>
        useMethodsOn(
          ForceTokenSaleTest,
          times.flatMap((t) => [
            {
              // We skip to each option's lock period end time
              method: 'setTimestamp',
              args: [time + t],
              account: accounts[0],
            },
            t >= 3 * month
              ? {
                  // We increment the purchases made on random deposits.
                  // We do this to test that the available purchases
                  // are correctly calculated
                  method: 'incrementPurchasesMadeTest',
                  args: [randomInt(0, userDeposits.length - 1), 1],
                  account: accounts[0],
                }
              : { then: () => {} },
            {
              method: 'getAllDepositsAndAvailablePurchases',
              onReturn: (depositsAndAvailablePurchases) => {
                const deposits = depositsAndAvailablePurchases[0];
                const availablePurchases = depositsAndAvailablePurchases[1].map(
                  (ap) => parseInt(ap)
                );
                const days = Math.floor(t / day);

                deposits.forEach(
                  ({ option, purchasesMade: _purchasesMade }, i) => {
                    const optionMaxDays = Math.floor(
                      options[parseInt(option)].lockPeriod / day
                    );
                    const optionMaxPurchases =
                      options[parseInt(option)].numOfPurchases;
                    const purchasesMade = parseInt(_purchasesMade);
                    const periodFinished = days >= optionMaxDays;

                    if (periodFinished) {
                      // If the lock period has finished, we assert that
                      // all purchases should be available
                      assert.strictEqual(
                        availablePurchases[i] + purchasesMade,
                        optionMaxPurchases
                      );
                    }
                  }
                );
              },
            },
          ])
        )
      );
    });
  });

  describe('DEXAdapterHandler', () => {
    it('has reference to DEXAdapter', () =>
      useMethodOn(ForceTokenSale, {
        // We get the DEXAdapter address
        method: 'getDexAdapter',
        onReturn: (dexAdapter) => {
          // And we check that it is the correct address
          assert.strictEqual(dexAdapter, UniswapV2DEXAdapter.options.address);
        },
      }));

    it('allows owner to update DEXAdapter', async () => {
      const DexAdapterCopy = await deploy(
        getContract('UniswapV2DEXAdapter.sol'),
        [UniswapV2Router02.options.address],
        accounts[0]
      );

      return useMethodsOn(ForceTokenSale, [
        {
          // Owner sets the new DEXAdapter address
          method: 'setDexAdapter',
          args: [DexAdapterCopy.options.address],
          account: accounts[0],
        },
        {
          // We get the DEXAdapter address from the contract
          method: 'getDexAdapter',
          onReturn: (dexAdapter) => {
            // And we check that it is the correct address
            assert.strictEqual(dexAdapter, DexAdapterCopy.options.address);
          },
        },
      ]);
    });
  });
});
