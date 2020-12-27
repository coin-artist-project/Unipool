const Unipool = artifacts.require('./Unipool.sol');

const coinArtistFarmDeployerAddress = "0x63581507bF4444b062685B6C1898f8C5CD57bfFc";
const oneweek = "604800";
//const halfweek = "302400";

module.exports = async function (deployer, network, addresses) {
	// Now get all the tokens
    let rewardTokenCoin, rewardTokenCred, rewardTokenPartner, coin, cred, partner;
	if (network.indexOf('mainnet') !== -1) {
		console.log("Deploying mainnet");
		// Maniac/COIN, wake sequence/CRED, Skullspace/LINK
		rewardTokenCoin    = '0x1aff4291843a69ce54fb25c227641e2f01f43ff3';
		rewardTokenCred    = '0x33b07738f34d7b46e4d4e74442a70020762cf8ae';
		rewardTokenPartner = '0xe018ce12dfcec3a8dcc94f4c1946e1dd7c6fe310';
		coin    = '0x87b008E57F640D94Ee44Fd893F0323AF933F9195';
		cred    = '0xED7Fa212E100DFb3b13B834233E4B680332a3420';
		partner = '0x514910771af9ca656af840dff83e8264ecf986ca';

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
