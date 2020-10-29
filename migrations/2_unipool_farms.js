const Migrations = artifacts.require('./Migrations.sol');
const UnipoolFarms = artifacts.require('./UnipoolFarms.sol');

module.exports = function (deployer, network) {

    let rewardToken, uni;
	if (network.indexOf('mainnet') !== -1) {
		rewardToken = '0x87b008E57F640D94Ee44Fd893F0323AF933F9195';
		uni = '0xCCE852e473eCfDEBFD6d3fD5BaE9e964fd2A3Fa7';
	} else {
		// Rinkeby
		rewardToken = '0x81F63d3768A85Be640E1ee902Ffeb1484bC255aD';
		uni = '0xB56A869b307d288c3E40B65e2f77038F3579F868';
	}

	// Deploy
	deployer.deploy(UnipoolFarms)
		.then((_instance) => {
			return _instance.createFarm(uni, rewardToken);
		});
};
