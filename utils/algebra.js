const {
  useMethodsOn,
  useMethodOn,
  mintToAndApproveFor,
} = require('./contracts');
const { getDeployedContract } = require('./useWeb3');

const getPriceFromTick = (tick) => 1.0001 ** tick;

const getSqrtRatioAtTick = (tick) => {
  const price = getPriceFromTick(tick);
  const sqrtRatioX96 = Math.sqrt(price) * 2 ** 96;
  return Math.floor(sqrtRatioX96);
};

const addLiquidity = (
  SwapRouter,
  AlgebraFactory,
  TestAlgebraCallee,
  Token1,
  Token2,
  algebraPoolContract,
  tradeAmount,
  owner
) => {
  let AlgebraPool;
  let zeroToOne;
  const liquidityDesired = 1n * 10n ** 9n;
  const token1Amount = 1n * 10n ** 18n;
  const token2Amount = token1Amount;
  const q96 = 2n ** 96n;
  const encodedPrice = q96;
  const topTick = 6000;
  const bottomTick = -6000;

  return useMethodsOn(AlgebraFactory, [
    {
      // We need to create a pool for the tokens we want to trade
      method: 'createPool',
      args: [Token1.options.address, Token2.options.address],
      account: owner,
    },
    {
      // We get the address of the pool we just created
      method: 'poolByPair',
      args: [Token1.options.address, Token2.options.address],
      onReturn: () => {},
    },
  ])
    .then(async (poolAddress) => {
      // We save the deployed pool contract in a variable
      AlgebraPool = await getDeployedContract(algebraPoolContract, poolAddress);
      const token0 = await useMethodOn(AlgebraPool, {
        method: 'token0',
        onReturn: () => {},
      });
      // We check if the token we want to trade is token0 or token1
      // This is done so we know which amount to look at in the Swap
      // event emitted by the pool contract
      zeroToOne = token0 === Token1.options.address;
    })
    .then(() =>
      mintToAndApproveFor(
        Token1,
        owner,
        token1Amount,
        TestAlgebraCallee.options.address
      )
    )
    .then(() =>
      mintToAndApproveFor(
        Token2,
        owner,
        token2Amount,
        TestAlgebraCallee.options.address
      )
    )
    .then(() =>
      mintToAndApproveFor(
        Token1,
        owner,
        tradeAmount,
        SwapRouter.options.address
      )
    )
    .then(() =>
      useMethodOn(AlgebraPool, {
        // We initialize the pool with the initial price
        method: 'initialize',
        args: [encodedPrice],
        account: owner,
      })
    )
    .then(() =>
      useMethodsOn(TestAlgebraCallee, [
        {
          // We add the liquidity to the pool through
          // an intermediate contract that will call the
          // AlgebraPool contract and has the algebraSwapCallback
          method: 'mint',
          args: [
            AlgebraPool.options.address,
            owner,
            bottomTick,
            topTick,
            liquidityDesired,
          ],
          account: owner,
        },
      ])
    )
    .then(() => ({
      AlgebraPool,
      zeroToOne,
    }));
};

module.exports = {
  getSqrtRatioAtTick,
  addLiquidity,
};
