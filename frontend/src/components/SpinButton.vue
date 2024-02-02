<script setup>
import { useGameStore } from '@/stores/game';
const gameStore = useGameStore();

const emit = defineEmits(['spin']);

const spin = () => {
    emit('spin');
};
</script>

<template>
    <div class="flex-column-center">
        <button id="spinButton" class="button" @click="spin">
            <div id="spinText" class="text-bold">
                SPIN
            </div>
        </button>
        <div id="betSize">
            <span class="bold">BET: </span> {{gameStore.formattedBet}} ETH
        </div>
    </div>
</template>
  
<style scoped>
.bold {
    font-weight: 800;
}

#spinButton {
    width: 300px;
    height: 100px;
    margin-top: 30px;
    font-size: 5rem;
    border-width: 8px;
    position: relative;
}

#spinText {
    position: relative;
    top: -26px;
    left: -7px;
}

#betSize {
    font-size: 1.5rem;
    margin-top: 5px;
    font-weight: bold;
}
</style>
  