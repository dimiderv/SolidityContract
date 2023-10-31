require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: "0.8.19",
  gasReporter: {
    enabled: true
  },
  networks: {
    hardhat: {
    },
    polygon_mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: ['779ff33e08f8a1ee821f1d8c6a70f40157697d025f2f1bf718b0c6f8eb36ff7f']
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: 'ZBM23PFQEEWTQP4V8YR7VRGZ1QAIGR4WXH'
    }
  }
};