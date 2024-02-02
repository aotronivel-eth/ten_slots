<script setup>
import { ref, watch, computed, onMounted } from 'vue';

import arrow from '@/assets/arrow.svg';
import mask from '@/assets/symbols/mask.svg';
import symbol_0 from '@/assets/symbols/00.png';
import symbol_1 from '@/assets/symbols/01.png';
import symbol_2 from '@/assets/symbols/02.png';
import symbol_3 from '@/assets/symbols/03.png';
import symbol_4 from '@/assets/symbols/04.png';
import symbol_5 from '@/assets/symbols/05.png';
import symbol_6 from '@/assets/symbols/06.png';
import symbol_7 from '@/assets/symbols/07.png';
import symbol_8 from '@/assets/symbols/08.png';
import symbol_9 from '@/assets/symbols/09.png';

const props = defineProps({
    result: Array,
    spinning: Boolean,
    payout: BigInt
});

const symbols = [
    { id: 0, image: symbol_0 },
    { id: 1, image: symbol_1 },
    { id: 2, image: symbol_2 },
    { id: 3, image: symbol_3 },
    { id: 4, image: symbol_4 },
    { id: 5, image: symbol_5 },
    { id: 6, image: symbol_6 },
    { id: 7, image: symbol_7 },
    { id: 8, image: symbol_8 },
    { id: 9, image: symbol_9 }
];

const LAST_FRAME_TIME = ref(performance.now());
const DESIRED_FPS = 60;
const FRAME_DURATION = 1000 / DESIRED_FPS;

const NUM_REELS = 3;
const SYMBOL_SIZE = 100;
const ACCELERATION = 3;
const MAX_SPEED = 15;
const SET_HEIGHT = symbols.length * SYMBOL_SIZE;

const ACCELERATING = ref([false, false, false]);
const WAITING_TO_DECELERATE = ref([false, false, false]);
const DECELERATING = ref([false, false, false]);
const CURRENT_POSITION = ref([0, 0, 0]);
const SPEED = ref([0, 0, 0]);

watch(() => props.spinning, async (newValue) => {
    if (newValue) {
        ACCELERATING.value = [true, true, true];
    } else {
        WAITING_TO_DECELERATE.value = [true, true, true];
    }
});

const getSymbolStyle = (symbol, reelIndex, setIndex) => {
    const Y = CURRENT_POSITION.value[reelIndex] + (symbol.id * SYMBOL_SIZE) - (setIndex * SET_HEIGHT);
    return {
        "background-image": `url(${symbol.image})`,
        "transform": `translateY(${Y}px)`
    };
};

const animate = (time) => {
    const DELTA_TIME = time - LAST_FRAME_TIME.value;

    if (DELTA_TIME >= FRAME_DURATION) {
        LAST_FRAME_TIME.value = time - (DELTA_TIME % FRAME_DURATION);

        for (let index = 0; index < NUM_REELS; index++) {

            if (ACCELERATING.value[index]) {
                SPEED.value[index] = SPEED.value[index] + ACCELERATION;
            }

            if (DECELERATING.value[index]) {
                SPEED.value[index] = SPEED.value[index] - ACCELERATION;
            }

            if (SPEED.value[index] > 0) {
                if (SPEED.value[index] > MAX_SPEED) {
                    ACCELERATING.value[index] = false;
                    SPEED.value[index] = MAX_SPEED;
                }

                let NEXT_POSITION = CURRENT_POSITION.value[index] + SPEED.value[index];
                if (NEXT_POSITION >= SET_HEIGHT) {
                    NEXT_POSITION = NEXT_POSITION - SET_HEIGHT;
                }

                if (WAITING_TO_DECELERATE.value[index]) {
                    let TARGET_POSITION = SET_HEIGHT - ((props.result[index] + .3) * SYMBOL_SIZE);
                    if (TARGET_POSITION < 0) {
                        TARGET_POSITION = SET_HEIGHT + TARGET_POSITION;
                    }

                    let START_DECELERATION = false;

                    if (TARGET_POSITION == 0) {
                        START_DECELERATION = CURRENT_POSITION.value[index] > (SET_HEIGHT - SYMBOL_SIZE) && NEXT_POSITION < SYMBOL_SIZE
                    } else {
                        START_DECELERATION = CURRENT_POSITION.value[index] < TARGET_POSITION && NEXT_POSITION >= TARGET_POSITION
                    }

                    if (START_DECELERATION) {
                        WAITING_TO_DECELERATE.value[index] = false;
                        DECELERATING.value[index] = true;
                    }
                }

                CURRENT_POSITION.value[index] = NEXT_POSITION;

            } else if (SPEED.value[index] < 0) {
                DECELERATING.value[index] = false;
                SPEED.value[index] = 0;
                if (props.result[index] == 0) {
                    CURRENT_POSITION.value[index] = 0;
                } else {
                    CURRENT_POSITION.value[index] = SET_HEIGHT - (props.result[index] * SYMBOL_SIZE);
                }
            }
        }
    }

    requestAnimationFrame(animate);
};

onMounted(() => {
    CURRENT_POSITION.value = props.result.map((symbol) => symbol == 0? 0 : SET_HEIGHT - (symbol * SYMBOL_SIZE));
    requestAnimationFrame(animate);
});

</script>

<template>
        <div class="slot-machine">
            <div id="arrow_r" class="arrow" :style="`background-image: url(${arrow});`"></div>
            <div id="arrow_l" class="arrow" :style="`background-image: url(${arrow});`"></div>
            <div v-for="(reel, index) in CURRENT_POSITION" :key="index" class="reel" :id="`reel_${index}`">
                <div mask class="reelMask image" :style="`background-image: url(${mask});`"></div>
                <div v-for="symbol in symbols" :key="symbol.id" class="symbol image" :style="getSymbolStyle(symbol, index, 0)"></div>
                <div v-for="symbol in symbols" :key="symbol.id" class="symbol image" :style="getSymbolStyle(symbol, index, 1)"></div>
            </div>
        </div>
</template>

<style>
.arrow {
    width: 50px;
    height: 50px;
    top: 160px;
    position: absolute;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    z-index: 2;
}

#arrow_r {
    right: 75px;
}

#arrow_l {
    left: 75px;
    transform: rotate(180deg);
}

.reelMask {
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;
    opacity: 0.65;
}

.slot-machine {
    margin-top: 30px;
    display: flex;
    border: 9px solid white;
    border-radius: 20px;
    background-color: white;
    width: 340px;
    justify-content: space-between;
}

.reel {
    width: 100px;
    height: 200px;
    position: relative;
    overflow: hidden;
}

#reel_0 {
    border-radius: 15px 0 0 15px;
}

#reel_2 {
    border-radius: 0px 15px 15px 0;
}

.symbol {
    margin-top: 50px;
    width: 100px;
    height: 100px;
    position: absolute;
}
</style>
