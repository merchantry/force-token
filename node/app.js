const Web3 = require('web3');
const contracts = require('../compile');
const { useMethodOn } = require('../utils/contracts');
const { schedule, everyMinute } = require('../utils/cronJob');

const PROVIDER = process.argv[2] || undefined;
const PRIVATE_KEY = process.argv[3] || undefined;
const CONTRACT_ADDRESS = process.argv[4] || undefined;

if (!PROVIDER) {
  throw new Error('No provider specified');
}

if (!PRIVATE_KEY) {
  throw new Error('No private key specified');
}

if (!CONTRACT_ADDRESS) {
  throw new Error('No sale contract address specified');
}

const web3Provider = new Web3.providers.HttpProvider(PROVIDER);
const web3 = new Web3(web3Provider);

const account = web3.eth.accounts.privateKeyToAccount('0x' + PRIVATE_KEY);

web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

schedule(everyMinute, async () => {
  // Do something every minute
});
