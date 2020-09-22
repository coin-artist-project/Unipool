const Migrations = artifacts.require('./Migrations.sol');
const Cred = artifacts.require('./Cred.sol');
const Unipool = artifacts.require('./Unipool.sol');

module.exports = function (deployer, network) {

	let coin, uni;
	if (network.indexOf('mainnet') !== -1) {
		coin = '0x87b008E57F640D94Ee44Fd893F0323AF933F9195';
		uni = '0xCCE852e473eCfDEBFD6d3fD5BaE9e964fd2A3Fa7';
	} else {
		// Rinkeby
		coin = '0x81F63d3768A85Be640E1ee902Ffeb1484bC255aD';
		uni = '0xB56A869b307d288c3E40B65e2f77038F3579F868';
	}

	// Initial mint of CRED for the staking contract
	let credMint = 10000 * 100;

	// Deploy all
	let credInst;
	deployer.deploy(Migrations)
		.then(() => {
			return deployer.deploy(Cred);
		})
		.then((inst) => {
			credInst = inst;
			return deployer.deploy(Unipool, uni, coin, credInst.address);
		})
		.then((uniInst) => {
			return credInst.mint(uniInst.address, credMint);
		});
};
