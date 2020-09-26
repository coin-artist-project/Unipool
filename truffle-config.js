const fs = require('fs');
const HDWalletProvider = require('truffle-hdwallet-provider');

const infura_key = fs.readFileSync(__dirname + "/.infura").toString().trim();
const rinkeby_private_key = fs.readFileSync(__dirname + "/.secret.rinkeby.key").toString().trim();
const mainnet_private_key = fs.readFileSync(__dirname + "/.secret.mainnet.key").toString().trim();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: 'localhost',
      port: 9545,
      network_id: '*',
      gas: 8000000,
      gasPrice: 1000000000, // web3.eth.gasPrice
    },
    coverage: {
      host: 'localhost',
      port: 8555,
      network_id: '*',
      gas: 8000000,
      gasPrice: 1000000000, // web3.eth.gasPrice
    },
    rinkeby: {
      provider: () => new HDWalletProvider(
        rinkeby_private_key,
        'https://rinkeby.infura.io/v3/' + infura_key
      ),
      gas: 6721975,
      gasPrice: 80000000000, // 80 gwei
      network_id: '4'
    },
    mainnet: {
      provider: () => new HDWalletProvider(
        mainnet_private_key,
        'https://mainnet.infura.io/v3/' + infura_key
      ),
      gas: 6721975,
      gasPrice: 80000000000, // 80 gwei
      network_id: '1'
    }
  },
  compilers: {
    solc: {
      version: '0.5.12',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        }
      }
    },
  },
  mocha: { // https://github.com/cgewecke/eth-gas-reporter
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      gasPrice: 10,
      onlyCalledMethods: true,
      showTimeSpent: true,
      excludeContracts: ['Migrations']
    }
  }
};
