const assert = require('assert');
const contracts = require('../compile');
const { deploy, getAccounts } = require('../utils/useWeb3');

const tokenContract = contracts['MyToken.sol'].MyToken;

describe('MyToken tests', () => {
  let accounts, MyToken;

  beforeEach(async () => {
    accounts = await getAccounts();
    MyToken = await deploy(tokenContract, [], accounts[0]);
  });

  describe('MyToken', () => {
    it('deploys successfully', () => {
      assert.ok(MyToken.options.address);
    });
  });
});
