import { defineStore } from 'pinia';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { networkNames, gameAddress, supportedChainIds } from '@/helpers/blockchainConstants';
import { useGameStore } from './game';

let _metamaskProvider = null;
let _ethersProvider = null;
let _ethersSigner = null;
let _gameStore = null;

const fixedEthereumProvider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth");

export const useEthereumStore = defineStore({
  id: 'ethereum',

  state: () => ({
    initialized: false,
    connecting: false,
    connected: false,
    address: '',
    ENS: null,
    chainId: '',
    networkName: '',
    error: null,
    balance: null
  }),

  getters: {
    networkOk: (state) => state.initialized && state.connected && supportedChainIds.includes(state.chainId) && (state.error == null),
    fixedEthereumProvider: () => fixedEthereumProvider,
    fixedScrollProvider: () => fixedScrollProvider,
    ethersProvider: () => _ethersProvider,
    ethersSigner: () => _ethersSigner,
    displayBalance: (state) => {
      if (state.balance == null) { return "0"; }
      let floatBalance = parseFloat(ethers.formatEther(state.balance));
      return parseFloat(floatBalance.toFixed(4)).toString();
    }
  },

  actions: {
    shortAddress(len) {
      if (this.address.length == 0) { return ""; }
      if (this.ENS != null) { return this.ENS; }
      return `${this.address.substring(0, Math.floor(len / 2))}...${this.address.substring(this.address.length - Math.floor(len / 2))}`;
    },

    async init(force = false) {
      console.log(`ethereum: init(${force})`);

      _gameStore = useGameStore();

      const metamaskProvider = await detectEthereumProvider();
      if (metamaskProvider) {
        _metamaskProvider = metamaskProvider;
        if (_ethersSigner != null) {
          await this.login();
        } else {
          if ((localStorage.getItem("wasConnected") === "true") || force) {
            await this.connect();
          }
        }
      } else {
        this.error = "Metamask not found";
      }

      this.initialized = true;
    },

    async connect() {
      console.log("ethereum: connect()");

      if (_metamaskProvider !== window.ethereum) {
        this.error = "Ethereum changed. Multiple wallets installed?";
        return this.logout();
      }

      _ethersProvider = new ethers.BrowserProvider(_metamaskProvider);
      this.connecting = true;

      try {
        let _chainId = await _metamaskProvider.request({ method: 'eth_chainId' });

        if (!_chainId.toString().startsWith("0x")) {
          _chainId = parseInt(_chainId).toString(16);
        }
        this.chainId = _chainId.toString();
        console.log(this.chainId);

        _metamaskProvider.on('chainChanged', this.handleChainChanged);

        if (this.chainId in networkNames) {
          this.networkName = networkNames[this.chainId];
        } else {
          this.networkName = "Unknown Network";
        }

        await this.handleAccountsChanged();
        _metamaskProvider.on('accountsChanged', (accounts) => { this.handleAccountsChanged(accounts); });

        _metamaskProvider.on("disconnect", (code, reason) => {
          setTimeout(() => { this.logout(); }, 3000);
        });
      } catch (err) {
        console.log(err);
        this.logout();
      }
    },

    async switchToNetwork(chainId) {
      console.log(`ethereum: switchNetwork(${chainId})`);

      if (!supportedChainIds.includes(chainId)) {
        return console.log(`ChainId ${chainId} not supported`);
      }

      try {
        await _metamaskProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainId }]
        });
      } catch (err) {
        if (err.code === 4902) {
          try {
            await _metamaskProvider.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfigs[chainId]]
            });
          }
          catch (err2) {
            console.log(` > Could not add ${networkNames[chainId]}`);
          }
        }
      }
    },

    handleChainChanged(chainId) {
      console.log(`ethereum: handleChainChanged(${chainId})`);
      window.location.reload();
    },

    async handleAccountsChanged(acc) {
      console.log(`ethereum: handleAccountsChanged(${acc})`);

      if (!!!_metamaskProvider || !!!_ethersProvider) { throw (Error("No provider Found")); }

      let accounts = [];
      let accountWasUndefined = false;

      if (acc == undefined) {
        accountWasUndefined = true;
        try {
          accounts = await _metamaskProvider.request({ method: 'eth_requestAccounts' });
        } catch (err) {
          throw (err);
        }
      } else {
        accounts = acc;
      }

      if (accounts.length === 0) {
        this.logout();
      } else if (accounts[0] !== this.address) {
        if (!accountWasUndefined) {
          window.location.reload();
        } else {
          console.log(' -> Setting account: ' + accounts[0]);
          this.address = ethers.getAddress(accounts[0]);
          _ethersSigner = await _ethersProvider.getSigner(this.address);
          this.login();
        }
      }
    },

    async login() {
      console.log("ethereum: login()");

      if (!!!_metamaskProvider || !!!_ethersProvider || !!!_ethersSigner) {
        return this.logout();
      };

      this.findENS();

      try {

        this.$patch({
          initialized: true,
          connected: true,
          connecting: false
        });

        if (this.networkOk) {
          _gameStore.init();
          this.updateBalance();
        }

        localStorage.setItem("wasConnected", true);

      } catch (err) {
        console.log(err);
        this.logout();
      }
    },

    async findENS() {
      try {
        let ens = await fixedEthereumProvider.lookupAddress(this.address);
        this.ENS = ens;
      } catch (err) {
        this.ENS = null;
      }
    },

    async updateBalance() {
      let balance = await _ethersProvider.getBalance(this.address);
      this.balance = balance;
    },

    logout() {
      console.log("ethereum: logout()");
      if (_metamaskProvider != null) {
        _metamaskProvider.removeAllListeners();
      }
      this.$reset();
      this.initialized = true;
    }

  }
});