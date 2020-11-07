const Unipool = artifacts.require('./Unipool.sol');

const oneweek = "604800";
const halfweek = "302400";

module.exports = async function (deployer, network, addresses) {
	// Now get all the tokens
    let rewardTokenCoin, rewardTokenCred, rewardTokenPartner, coin, cred, partner;
	if (network.indexOf('mainnet') !== -1) {
		console.log("Deploying mainnet");
		rewardTokenCoin    = '0xe85a37e3fbcf9ec782f06477604de8c211b5c218';
		rewardTokenCred    = '0x71d0d05c9772803ccfd4f39ae0e61b35f2792c2f';
		rewardTokenPartner = '0xbbcdee12f16696f887a009b059561561d4479b45'; // CBOP
		coin    = '0x87b008E57F640D94Ee44Fd893F0323AF933F9195';
		cred    = '0xED7Fa212E100DFb3b13B834233E4B680332a3420';
		partner = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'; // UNI

		// Deploy the farms
		await deployer.deploy(Unipool, coin, rewardTokenCoin, halfweek);
		await deployer.deploy(Unipool, cred, rewardTokenCred, halfweek);
		await deployer.deploy(Unipool, partner, rewardTokenPartner, oneweek);
	} else {
		console.log("Not on mainnet");
	}
};
