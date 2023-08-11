const {
  useMethodOn,
  useMethodsOn,
  mintToAndApproveFor,
} = require('./contracts');
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
  mintToAndApproveFor(
    Token1,
    account,
    amount1,
    UniswapV2Router02.options.address
  )
    .then(() =>
      mintToAndApproveFor(
        Token2,
        account,
        amount2,
        UniswapV2Router02.options.address
      )
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
