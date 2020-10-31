const Migrations = artifacts.require('./Migrations.sol');
const ERC20Token = artifacts.require('./ERC20Token.sol');
const Unipool = artifacts.require('./Unipool.sol');

const oneweek = "604800";
const halfweek = "302400";

module.exports = async function (deployer, network) {

	// Deploy migrations first
	await deployer.deploy(Migrations);

	// Now get all the tokens
    let rewardTokenCoin, rewardTokenCred, rewardTokenTrsh, coin, cred, trsh;
	if (network.indexOf('mainnet') !== -1) {
		rewardTokenCoin = '';
		rewardTokenCred = '';
		rewardTokenTrsh = '';
		coin = '0x87b008E57F640D94Ee44Fd893F0323AF933F9195';
		cred = '';
		trsh = '';
	} else {
		// Deploy if needed
		//rewardTokenCoin = await deployer.deploy(ERC20Token, "COINW1REWARD", "COW1R");
		//rewardTokenCred = await deployer.deploy(ERC20Token, "CREDW1REWARD", "CRW1R");
		//rewardTokenTrsh = await deployer.deploy(ERC20Token, "TRSHW1REWARD", "TRW1R");
		//coin = await deployer.deploy(ERC20Token, "COINW1", "COW1");
		//cred = await deployer.deploy(ERC20Token, "CREDW1", "CRW1");
		//trsh = await deployer.deploy(ERC20Token, "TRSHW1", "TRW1");
		rewardTokenCoin = "0x74CEa454b9CeE39D18C1A319bf2749388fe33945";
		rewardTokenCred = "0xbe2e11f1fA79AbB81d1f37D4ae8916ee50A00676";
		rewardTokenTrsh = "0xF8ba140e1683C0B7C37b9583f8765A72476121E3";
		coin = "0x34bFe1342768D6553C970c826392B20EbC0411E2";
		cred = "0x3c8fbce8ed206e80aa5dfc45c8a2bcfc54235e9f";
		trsh = "0x0a0Cc964f3414672c82a13d726F0228AC4331dBe";
	}

	// Deploy the farms
	await deployer.deploy(Unipool, coin, rewardTokenCoin, halfweek);
	await deployer.deploy(Unipool, cred, rewardTokenCred, halfweek);
	await deployer.deploy(Unipool, trsh, rewardTokenTrsh, oneweek);
};
