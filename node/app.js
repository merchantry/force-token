const Web3 = require('web3');
const { schedule, everyMinute } = require('../utils/cronJob');
const contracts = require('../compile');
const { useMethodOn, compiledContractMap } = require('../utils/contracts');

const getContract = compiledContractMap(contracts);

const PROVIDER = process.argv[2] || undefined;
const PRIVATE_KEY = process.argv[3] || undefined;
const SALE_CONTRACT_ADDRESS = process.argv[4] || undefined;

if (!PROVIDER) {
  throw new Error('No provider specified');
}

if (!PRIVATE_KEY) {
  throw new Error('No private key specified');
}

if (!SALE_CONTRACT_ADDRESS) {
  throw new Error('No sale contract address specified');
}

const web3Provider = new Web3.providers.HttpProvider(PROVIDER);
const web3 = new Web3(web3Provider);

const account = web3.eth.accounts.privateKeyToAccount('0x' + PRIVATE_KEY);
const ForceTokenSale = new web3.eth.Contract(
  getContract('ForceTokenSale.sol').abi,
  SALE_CONTRACT_ADDRESS
);

web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

schedule(everyMinute, async () => {
  const depositsAndAvailablePurchases = await useMethodOn(ForceTokenSale, {
    method: 'getAllDepositsAndAvailablePurchases',
    onReturn: () => {},
  });

  const availablePurchases = depositsAndAvailablePurchases[1].map((ap) =>
    parseInt(ap)
  );
  const purchaseIsAvailable = availablePurchases.some((ap) => ap > 0);
  if (!purchaseIsAvailable) return;

  await useMethodOn(ForceTokenSale, {
    method: 'completeAllOutstandingPurchases',
  });
});
