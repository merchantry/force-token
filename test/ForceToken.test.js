const assert = require('assert');
const contracts = require('../compile');
const { deploy, getAccounts } = require('../utils/useWeb3');

const tokenContract = contracts['ForceToken.sol'].ForceToken;

const name = 'Force Token';
const symbol = 'FORCE';

describe('ForceToken tests', () => {
  let accounts, ForceToken;

  beforeEach(async () => {
    accounts = await getAccounts();
    ForceToken = await deploy(tokenContract, [name, symbol], accounts[0]);
  });

  describe('ForceToken', () => {
    it('deploys successfully', () => {
      assert.ok(ForceToken.options.address);
    });
  });
});
