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
		// Creencia/COIN, Tri-Power/CRED, Thinking Clearly/RNG
		rewardTokenCoin    = '0x51720681a0cbcde8ab602f0eb9643986eb2b70ff';
		rewardTokenCred    = '0x971e22a354fe026faf437dd283a21fd5bf57b4fa';
		rewardTokenPartner = '0xbbb60df786de6f9f5a79f1fec7d371045d7dec0c';
		coin    = '0x87b008E57F640D94Ee44Fd893F0323AF933F9195';
		cred    = '0xED7Fa212E100DFb3b13B834233E4B680332a3420';
		partner = '0xa2f96EF6ed3d67A0352e659B1E980f13e098619F';

		// Deploy the farms
		//await deployer.deploy(Unipool, coin, rewardTokenCoin, twoweek);
		//let coinInstance = await Unipool.deployed();
		//await coinInstance.setRewardDistribution(coinArtistFarmDeployerAddress);

		//await deployer.deploy(Unipool, cred, rewardTokenCred, twoweek);
		//let credInstance = await Unipool.deployed();
		//await credInstance.setRewardDistribution(coinArtistFarmDeployerAddress);
//
		//await deployer.deploy(Unipool, partner, rewardTokenPartner, twoweek);
		//let partnerInstance = await Unipool.deployed();
		//await partnerInstance.setRewardDistribution(coinArtistFarmDeployerAddress);
	} else {
		console.log("Not on mainnet");
	}
};
