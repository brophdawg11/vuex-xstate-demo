<template>
    <div id="app">
        <StarWars />
        <hr>
        <StarWarsVuex />
    </div>
</template>

<script>
import StarWars from './components/StarWars.vue';
import StarWarsVuex from './components/StarWarsVuex.vue';

export default {
    name: 'app',
    components: {
        StarWars,
        StarWarsVuex,
    },
};
</script>

<style>
</style>
