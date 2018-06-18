<template>
    <div>
        <div v-if="isIdle">
            Click below to search
        </div>

        <div v-else-if="isPending">
            Searching...
        </div>

        <div v-else-if="isFulfilled">
            <div>Person: {{person}}</div>
            <div>Planet: {{planet}}</div>
        </div>

        <div v-else-if="isRejected">
            Uh oh, something went wrong!
        </div>

        <button @click="sendRequest()">
            {{ isPending ? 'Loading...' : 'Request' }}
        </button>

        <button @click="cancelRequest()" :disabled="!isPending">
            Cancel
        </button>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'StarWars',
    computed: {
        ...mapState([
            'currentState',
            'person',
            'planet',
        ]),

        isIdle() {
            return this.currentState === 'idle';
        },
        isPending() {
            return this.currentState.pending != null;
        },
        isFulfilled() {
            return this.currentState === 'fulfilled';
        },
        isRejected() {
            return this.currentState === 'rejected';
        },
    },
    methods: {
        cancelRequest() {
            this.$store.dispatch('transition', 'CANCEL');
        },
        sendRequest() {
            this.$store.dispatch('transition', { type: 'REQUEST', id: 3 });
        },
    },
};
</script>

<style scoped>
</style>
