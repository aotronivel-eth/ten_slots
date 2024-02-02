<script setup>
import { ref } from 'vue';
import { useEthereumStore } from '@/stores/ethereum';
const ethereumStore = useEthereumStore();

const isAddressHovered = ref(false);

function connectButtonAction() {
    if (ethereumStore.networkOk) {
        ethereumStore.logout();
    } else {
        if (!ethereumStore.connected && !ethereumStore.connecting) {
            ethereumStore.connect();
        } else if (ethereumStore.connected) {
            ethereumStore.logout();
        }
    }
}

function goToTenConnect() {
    window.open('https://testnet.ten.xyz/', '_blank');
}
</script>

<template>
    <div v-if="!ethereumStore.connected">
        <div id="connectButton" class="button text-bold" @click="connectButtonAction">
            Connect
        </div>
    </div>
    <div v-else-if="!ethereumStore.networkOk">
        <div class="flex-column-center">
            <div class="connectText">
                Connect to Ten Testnet to play
            </div>
            <div class="connectTextLink text-bold" @click="goToTenConnect">
                https://testnet.ten.xyz/
            </div>

        </div>
    </div>
    <div v-else>
        <div id="addressButton" class="button text-bold" @click="connectButtonAction" @mouseover="isAddressHovered = true"
            @mouseleave="isAddressHovered = false" :class="{ 'hovered': isAddressHovered }">
            {{ isAddressHovered ? 'Disconnect' : ethereumStore.shortAddress(12) }}
        </div>
    </div>
</template>

<style scoped>
.button {
    min-width: 200px;
}

#addressButton {
    height: 50px;
    font-size: 2rem;
    position: relative;
    font-size: 1rem !important;
}

#connectButton {
    font-size: 2rem;
    line-height: 3rem;
    height: 80px;
}

.connectText {
    font-size: 1rem;
    margin-top: 10px;
}

.connectTextLink {
    font-size: 1.25rem;
    margin-top: 10px;
    text-decoration: underline;
    cursor: pointer;
}
</style>
  