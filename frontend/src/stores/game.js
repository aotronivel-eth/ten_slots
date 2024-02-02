import { defineStore } from 'pinia';
import { useEthereumStore } from './ethereum';
import { gameAddress } from '@/helpers/blockchainConstants';
import { ethers } from 'ethers';

import SLOTS_ABI from './abi/slots.json';

let _ethereumStore = null;
let _slotsContract = null;

export const useGameStore = defineStore({
    id: 'Game',

    state: () => ({
        loading: true,
        contractAddress: null,
        bet: ethers.parseEther("0.00001"),
        result: [
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10)
        ],
        payout: null,
        multiplier: null,
        treasury: null,
        houseEdge: null,
        gotResult: false,
        transactionStatus: null,
        transactionMessage: "",
        transactionHash: "",
    }),

    getters: {
        transactionUrl: (state) => {
            return `https://testnet.tenscan.io/tx/${state.transactionHash}`;
        },
        displayTreasury: (state) => {
            if (state.treasury == null) { return "0"; }
            let floatBalance = parseFloat(ethers.formatEther(state.treasury));
            return parseFloat(floatBalance.toFixed(4)).toString();
        },
        displayHouseEdge: (state) => {
            if (state.houseEdge == null) { return "0" }
            const formathouseEdge = Number(state.houseEdge) / Number(100);
            return parseFloat(formathouseEdge.toFixed(2)).toString();
        },
        isSpinning: (state) => {
            if (state.transactionStatus == null || state.transactionStatus == "success" || state.transactionStatus == "error" || state.gotResult) { return false; }
            return true;
        },
        formattedBet: (state) => {
            return (parseFloat(ethers.formatEther(state.bet))).toString();
        },
        formattedPayout: (state) => {
            if (state.payout == null) { return "0" };
            return (parseFloat(ethers.formatEther(state.payout))).toString();
        }
    },

    actions: {
        async init() {
            console.log("slots: init()");
            _ethereumStore = useEthereumStore();
            this.contractAddress = gameAddress[_ethereumStore.chainId];
            _slotsContract = new ethers.Contract(this.contractAddress, SLOTS_ABI, _ethereumStore.ethersSigner);
            _slotsContract.on("SpinResult", async (playerAddress, spinners, payout, multiplier, treasury) => {
                this.gotResult = true;
                this.result = spinners.map(bn => Number(bn));
                setTimeout(() => {
                    if (playerAddress == _ethereumStore.address) {
                        this.payout = payout;
                        this.multiplier = Number(multiplier) / Number(100);
                        this.transactionStatus = "success";
                        this.transactionMessage = "Transaction successful!";
                        this.gotResult = false;
                    }
                    this.treasury = treasury;
                }, 1000);
            });

            await this.update();
        },

        async update() {
            console.log("slots: update()");
            if (_slotsContract != null) {
                try {
                    const contractBalance = await _slotsContract.balance();
                    this.treasury = contractBalance;
                    const houseEdge = await _slotsContract.houseEdge();
                    this.houseEdge = houseEdge;
                } catch (e) {
                    console.error(e);
                    this.treasury = null;
                    this.houseEdge = null;
                }
            }
        },

        async spin() {
            if (_slotsContract != null) {
                this.resetTransaction();
                try {
                    this.transactionStatus = "";
                    this.transactionMessage = "Waiting for user signature...";
                    const tx = await _slotsContract.spinReel({
                        value: this.bet
                    });
                    this.transactionStatus = "pending";
                    this.transactionMessage = "Transaction pending...";
                    this.transactionHash = tx.hash;
                    await tx.wait();
                } catch (e) {
                    this.transactionStatus = "error";
                    this.transactionMessage = e.code;
                }
            }
        },

        resetTransaction() {
            this.transactionStatus = null;
            this.transactionMessage = "";
            this.transactionHash = "";
        }
    }
});