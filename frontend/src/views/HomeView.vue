<script setup>
import { ref } from 'vue';
import Slots from '../components/Slots.vue';
import SpinButton from '../components/SpinButton.vue';
import ConnectButton from '../components/ConnectButton.vue';
import { useEthereumStore } from '@/stores/ethereum';
import { useGameStore } from '@/stores/game';

const ethereumStore = useEthereumStore();
const gameStore = useGameStore();

const getLightStyle = (n) => {
  const angle = (n - 1) * (360 / 32);
  const radius = 312;
  const radians = (angle * Math.PI) / 180;
  const x = -30 + radius + radius * Math.cos(radians);
  const y = -30 + radius + radius * Math.sin(radians);
  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)'
  };
}

const goToTen = () => {
  window.open('https://ten.xyz/', '_blank');
}
</script>

<template>
  <div v-if="!ethereumStore.connected || !ethereumStore.networkOk">
    <ConnectButton />
  </div>
  <div v-else id="allContainer" class="flex-column-center">
    <div id="navBar">
      <div id="accountBalance">
        {{ ethereumStore.displayBalance }} ETH
      </div>
      <ConnectButton />
    </div>
    <div id="contents">
      <div id="firstCircle" class="circle">
        <div id="secondCircle" class="circle">
          <div v-for="n in 32" :key="n" class="smallLight" :style="getLightStyle(n)"></div>
          <div id="slotsContainer" class="flex-column-center" v-if="true">
            <Slots :result="gameStore.result" :spinning="gameStore.isSpinning" :payout="gameStore.payout" />
            <div id="transactionContainer">
              <div class="flex-column-center" v-if="gameStore.transactionStatus == null">
                <SpinButton @spin="gameStore.spin" />
                <div class="flex-column-center full-width">
                  <div><span class="text-bold text-golden">TREASURY: </span>{{ gameStore.displayTreasury }} ETH</div>
                  <div><span class="text-bold text-grey">HOUSE EDGE: </span>{{ gameStore.displayHouseEdge }} %</div>
                </div>
              </div>
              <div class="flex-column-center full-width-and-height" v-if="gameStore.transactionStatus == ''">
                <div class="message">{{ gameStore.transactionMessage }}</div>
              </div>
              <div id="flex-column-center full-width-and-height" v-if="gameStore.transactionStatus == 'pending'">
                <div class="message">{{ gameStore.transactionMessage }}</div>
              </div>
              <div class="flex-column-center full-width-and-height" v-if="gameStore.transactionStatus == 'error'">
                <div class="text-title">{{ gameStore.transactionStatus }}</div>
                <div class="text-error message">{{ gameStore.transactionMessage }}</div>
                <div class="smallButton button" @click="gameStore.resetTransaction">GO BACK</div>
              </div>
              <div class="flex-column-center full-width-and-height" v-if="gameStore.transactionStatus == 'success' && gameStore.payout > 0n">
                <div class="text-title golden">YOU WIN!</div>
                <div><span class="text-bold grey">PAYOUT: </span>{{ gameStore.formattedPayout }} ETH</div>
                <div><span class="text-bold grey">MULTIPLIER: </span>x{{ gameStore.multiplier }}</div>
                <div class="smallButton button" @click="gameStore.resetTransaction">GO BACK</div>
              </div>
              <div class="flex-column-center full-width-and-height" v-if="gameStore.transactionStatus == 'success' && gameStore.payout == 0n">
                <div class="text-title">YOU LOSE</div>
                <div class="message">Better luck next time</div>
                <div class="smallButton button" @click="gameStore.resetTransaction">GO BACK</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="tenLink" class="flex-row-center">
        MADE POSSIBLE BY <div id="tenImage" class="image" @click="goToTen"></div> ENCRYPTED ROLLUP
      </div>
    </div>
  </div>
</template>

<style>
#allContainer {
  min-height: 900px;
  height: 100vh;
  width: 90vw;
}

.smallButton {
  background-color: var(--bg-color);
  padding: 10px;
  margin-top: 20px;
}

#tenLink {
  font-size: 1.5rem;
  margin: 30px;
  min-width: 660px;
}

#tenImage {
  width: 100px;
  height: 40px;
  background-image: url('@/assets/ten.svg');
  margin: 0px 10px;
  cursor: pointer;
}

#transactionContainer {
  height: 220px;
}

#navBar {
  width: 100%;
  height: 90px;
  margin: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: var(--bg-color);
}

#accountBalance {
  font-size: 1.5rem;
  margin-right: 20px;
}

#contents {
  position: relative;
  height: 850px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.circle {
  border-radius: 100%;
  position: relative;
}

#firstCircle {
  position: absolute;
  left: 50%;
  top: 0%;
  transform: translate(-50%, 0%);
  width: 700px;
  height: 700px;
  background: var(--bg-color);
  border: 12px solid white;
  z-index: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

#secondCircle {
  width: 575px;
  height: 575px;
  background: var(--bg-color);
  border: 6px solid white;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.smallLight {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 0 10px 10px rgba(255, 255, 255, 0.25);
  z-index: 3;
}

#slotsContainer {
  width: 500px;
  height: 500px;
  z-index: 2;
}
</style>
