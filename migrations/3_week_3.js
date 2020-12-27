const Unipool = artifacts.require('./Unipool.sol');

const coinArtistFarmDeployerAddress = "0x63581507bF4444b062685B6C1898f8C5CD57bfFc";
const oneweek = "604800";
//const halfweek = "302400";

module.exports = async function (deployer, network, addresses) {
	// Now get all the tokens
    let rewardTokenCoin, rewardTokenCred, rewardTokenPartner, coin, cred, partner;
	if (network.indexOf('mainnet') !== -1) {
		console.log("Deploying mainnet");
		// Punk/COIN, hypercore/CRED, Frequency/WHALE 
		rewardTokenCoin    = '0x22972f3900d6fd68dc8c35249936b16f21b0b836';
		rewardTokenCred    = '0x4982e5c944a6aa5a6aa12e48bb5a4c0b70424080';
		rewardTokenPartner = '0x0b078bac82e277ed7b9cefb91935ef72dca6e0de';
		coin    = '0x87b008E57F640D94Ee44Fd893F0323AF933F9195';
		cred    = '0xED7Fa212E100DFb3b13B834233E4B680332a3420';
		partner = '0x9355372396e3f6daf13359b7b607a3374cc638e0';

		// Deploy the farms
		await deployer.deploy(Unipool, coin, rewardTokenCoin, oneweek);
		let coinInstance = await Unipool.deployed();
		await coinInstance.setRewardDistribution(coinArtistFarmDeployerAddress);

		await deployer.deploy(Unipool, cred, rewardTokenCred, oneweek);
		let credInstance = await Unipool.deployed();
		await credInstance.setRewardDistribution(coinArtistFarmDeployerAddress);

		await deployer.deploy(Unipool, partner, rewardTokenPartner, oneweek);
		let partnerInstance = await Unipool.deployed();
		await partnerInstance.setRewardDistribution(coinArtistFarmDeployerAddress);
	} else {
		console.log("Not on mainnet");
	}
};
