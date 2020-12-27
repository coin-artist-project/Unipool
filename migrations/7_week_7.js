const Unipool = artifacts.require('./Unipool.sol');

const coinArtistFarmDeployerAddress = "0x63581507bF4444b062685B6C1898f8C5CD57bfFc";
const twoweek = "1209600";
//const oneweek = "604800";
//const halfweek = "302400";

module.exports = async function (deployer, network, addresses) {
	// Now get all the tokens
    let rewardTokenCoin, rewardTokenCred, rewardTokenPartner, coin, cred, partner;
	if (network.indexOf('mainnet') !== -1) {
		console.log("Deploying mainnet");
		// CYBVB/COIN, NOONE/CRED, CONST/RNG
		rewardTokenCoin    = '0xb8588f8fe1c2a8656bee8ffdee1c1469a0556be6';
		rewardTokenCred    = '0x0a7ef13bf9ebaabbb7912b7f859b164a725e8de7';
		rewardTokenPartner = '0x3bbffaa97cae3514eceebbcd9b5d3840ecf71301';
		coin    = '0x87b008E57F640D94Ee44Fd893F0323AF933F9195';
		cred    = '0xED7Fa212E100DFb3b13B834233E4B680332a3420';
		partner = '0xa2f96EF6ed3d67A0352e659B1E980f13e098619F';

		// Deploy the farms
		await deployer.deploy(Unipool, coin, rewardTokenCoin, twoweek);
		let coinInstance = await Unipool.deployed();
		await coinInstance.setRewardDistribution(coinArtistFarmDeployerAddress);

		await deployer.deploy(Unipool, cred, rewardTokenCred, twoweek);
		let credInstance = await Unipool.deployed();
		await credInstance.setRewardDistribution(coinArtistFarmDeployerAddress);

		await deployer.deploy(Unipool, partner, rewardTokenPartner, twoweek);
		let partnerInstance = await Unipool.deployed();
		await partnerInstance.setRewardDistribution(coinArtistFarmDeployerAddress);
	} else {
		console.log("Not on mainnet");
	}
};
