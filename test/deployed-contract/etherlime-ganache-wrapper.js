const etherlime = require('./../../index.js');
const ethers = require('ethers')
const chai = require('chai')
const assert = chai.assert;
const config = require('./../config.json');
const ICOTokenContract = require('./../testContracts/ICOToken.json');
const Greetings = require('./../testContracts/Greetings.json');
const store = require('./../../logs-store/logs-store');
const ganacheSetupConfig = require('./../../cli-commands/ganache/setup');

const defaultConfigs = {
	gasPrice: config.defaultGasPrice,
	gasLimit: config.defaultGasLimit
}

describe('EtherlimeGanacheWrapper tests', () => {
	store.initHistoryRecord();

	describe('Initialization', async () => {
		let deployer;

		beforeEach(async () => {
			deployer = new etherlime.EtherlimeGanacheDeployer();
		})

		it('should create correct wrapper', () => {
			const wrapper = new etherlime.EtherlimeGanacheWrapper(Greetings, config.randomAddress, deployer.wallet, deployer.provider);

			assert.isDefined(wrapper.contract, 'The newly created wrapper does not have a contract ethers.Contract');
			assert.deepEqual(wrapper.wallet, deployer.wallet, "The stored wallet was not the inputted one")
			assert.deepEqual(wrapper.provider, deployer.provider, "The stored provider was not the inputted one")
			assert.deepEqual(wrapper.contractAddress, config.randomAddress, "The stored contract address was not the inputted one")
			assert.deepEqual(wrapper.contractAddress, config.randomAddress, "The stored contract address was not the inputted one")
			assert.isFunction(wrapper.setGreetings, 'The newly created wrapper does not have ethers.Contract function setGreetings');
			assert.isFunction(wrapper.getGreetings, 'The newly created wrapper does not have ethers.Contract function setGreetings');
			assert.lengthOf(wrapper.instances, 10, 'The newly created wrapper does not have 10 contracts for the 10 ganache accounts')
			assert.isObject(wrapper.instancesMap, 'The newly created wrapper does not have 10 contracts for the 10 ganache accounts')
		})

	})

	describe('Verbose waiting for transaction', async () => {

		let deployer;
		let contractWrapper;

		beforeEach(async () => {
			deployer = new etherlime.EtherlimeGanacheDeployer(undefined, undefined, defaultConfigs);
			contractWrapper = await deployer.deploy(ICOTokenContract);
		});

		it('should wait for transaction correctly', async () => {
			const label = 'Transfer Ownership';
			const transferTransaction = await contractWrapper.transferOwnership(config.randomAddress, defaultConfigs);
			const result = await contractWrapper.verboseWaitForTransaction(transferTransaction, label);
			assert(result.hasOwnProperty('transactionHash'), 'There is no transactionHash property of the result');
			assert(result.hasOwnProperty('blockHash'), 'There is no blockHash property of the result');
			assert(result.hasOwnProperty('logs'), 'There is no logs property of the result');
			assert(result.hasOwnProperty('events'), 'There is no events property of the result');
			assert(result.hasOwnProperty('status'), 'There is no status property of the result');
			const currentRecord = store.getCurrentWorkingRecord();
			const lastAction = currentRecord.actions[currentRecord.actions.length - 1];
			assert.strictEqual(lastAction.deployerType, 'EtherlimeGanacheWrapper', 'Deployer Type not set correctly');
			assert.strictEqual(lastAction.nameOrLabel, label, 'Label not set correctly');
			assert.strictEqual(lastAction.transactionHash, transferTransaction.hash, 'Transaction hash not set correctly');
			assert(lastAction.status == 0, 'status not set correctly');
		});

		it('should wait for transaction without label correctly', async () => {
			const label = 'Transfer Ownership';
			const transferTransaction = await contractWrapper.transferOwnership(config.randomAddress, defaultConfigs);
			const result = await contractWrapper.verboseWaitForTransaction(transferTransaction);
			assert(result.hasOwnProperty('transactionHash'), 'There is no transactionHash property of the result');
			assert(result.hasOwnProperty('blockHash'), 'There is no blockHash property of the result');
			assert(result.hasOwnProperty('logs'), 'There is no logs property of the result');
			assert(result.hasOwnProperty('events'), 'There is no events property of the result');
			assert(result.hasOwnProperty('status'), 'There is no status property of the result');
			const currentRecord = store.getCurrentWorkingRecord();
			const lastAction = currentRecord.actions[currentRecord.actions.length - 1];
			assert.strictEqual(lastAction.deployerType, 'EtherlimeGanacheWrapper', 'Deployer Type not set correctly');
			assert.strictEqual(lastAction.nameOrLabel, 'EtherlimeGanacheWrapper', 'Label not set correctly');
			assert.strictEqual(lastAction.transactionHash, transferTransaction.hash, 'Transaction hash not set correctly');
			assert(lastAction.status == 0, 'status not set correctly');
		})

	})

	describe('Calling non-deployer methods', async () => {

		let deployer;
		let deployedContract;
		let notDeployer;

		beforeEach(async () => {
			deployer = new etherlime.EtherlimeGanacheDeployer(undefined, undefined, defaultConfigs);
			notDeployer = new ethers.Wallet(ganacheSetupConfig.accounts[5].secretKey, deployer.provider);
			deployedContract = await deployer.deploy(ICOTokenContract);
			await deployedContract.mint(notDeployer.address, 10000);
		});

		it('should call contract correctly via index', async () => {
			const tx = await deployedContract.from(5).transfer(config.randomAddress, 500)
			assert.strictEqual(tx.from, notDeployer.address, "The address of the tx sender is not the one of account 5")
		});

		it('should call contract correctly via string address', async () => {
			const tx = await deployedContract.from('0xDa8A06F1C910CAB18aD187be1faA2b8606C2ec86').transfer(config.randomAddress, 500)
			assert.strictEqual(tx.from, notDeployer.address, "The address of the tx sender is not the one of notDeployer")
		});

		it('should call contract correctly via wallet instance', async () => {
			const tx = await deployedContract.from(notDeployer).transfer(config.randomAddress, 500)
			assert.strictEqual(tx.from, notDeployer.address, "The address of the tx sender is not the one of notDeployer")
		});

		it('should call contract correctly via new wallet instance', async () => {
			let newRandomWallet = ethers.Wallet.createRandom();
			newRandomWallet = await newRandomWallet.connect(deployer.provider);

			await deployedContract.mint(newRandomWallet.address, 10000);

			await notDeployer.sendTransaction({
				to: newRandomWallet.address,
				value: ethers.utils.parseEther('1.0')
			});

			const tx = await deployedContract.from(newRandomWallet).transfer(config.randomAddress, 500)
			assert.strictEqual(tx.from, newRandomWallet.address, "The address of the tx sender is not the one of newRandomWallet")
		});

		it('should throw on invalid from', async () => {
			assert.throws(() => deployedContract.from(14.6), Error, "Unrecognised input parameter. It should be index, address or wallet instance")
		});

	})

});