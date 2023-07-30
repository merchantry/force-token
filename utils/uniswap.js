const { useMethodOn, useMethodsOn } = require('./contracts');
const { timeInSecs } = require('./helper');

/**
 * Adds liquidity to the UniswapV2Router02 contract for the given tokens and amounts.
 */
const addLiquidity = (
  UniswapV2Router02,
  Token1,
  Token2,
  amount1,
  amount2,
  account
) =>
  useMethodsOn(Token1, [
    {
      method: 'mint',
      args: [account, amount1],
      account,
    },
    {
      method: 'approve',
      args: [UniswapV2Router02.options.address, amount1],
      account,
    },
  ])
    .then(() =>
      useMethodsOn(Token2, [
        {
          method: 'mint',
          args: [account, amount2],
          account,
        },
        {
          method: 'approve',
          args: [UniswapV2Router02.options.address, amount2],
          account,
        },
      ])
    )
    .then(() =>
      useMethodOn(UniswapV2Router02, {
        method: 'addLiquidity',
        args: [
          Token1.options.address,
          Token2.options.address,
          amount1,
          amount2,
          1,
          1,
          account,
          timeInSecs() + 100000,
        ],
        account,
      })
    );

const calculateOutAmount = (amountIn, reserveIn, reserveOut) => {
  const fee = 0.003;
  const amountInWithFee = amountIn * (1 - fee);
  return Math.floor(
    (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)
  );
};

module.exports = {
  addLiquidity,
  calculateOutAmount,
};
