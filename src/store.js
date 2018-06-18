/* eslint-disable no-param-reassign */

import Vue from 'vue';
import Vuex from 'vuex';
import { get } from 'lodash-es';
import { Machine } from 'xstate';

Vue.use(Vuex);

function slowFetch(...args) {
    return new Promise((resolve, reject) => setTimeout(
        () => (Math.random() > 0.66 ?
            reject() :
            fetch(...args).then(resolve, reject)),
        1000,
    ));
}

const starWarsMachine = Machine({
    initial: 'idle',
    states: {
        idle: {
            on: { REQUEST: 'pending' },
            onEntry: 'clearData',
        },
        pending: {
            initial: 'loadingPerson',
            states: {
                loadingPerson: {
                    on: {
                        SUCCESS_PERSON: 'loadingPlanet',
                    },
                    onEntry: 'fetchPerson',
                },
                loadingPlanet: {
                    onEntry: 'fetchPlanet',
                },
            },
            on: {
                CANCEL: 'idle',
                SUCCESS_PLANET: 'fulfilled',
                FAILURE_PERSON: 'rejected',
                FAILURE_PLANET: 'rejected',
            },
        },
        fulfilled: {
            on: { REQUEST: 'pending' },
        },
        rejected: {
            on: { REQUEST: 'pending' },
        },
    },
});

export default new Vuex.Store({
    state: {
        currentState: starWarsMachine.initialState.value,
        person: null,
        planet: null,
    },
    mutations: {
        SET_STATE(state, newState) {
            state.currentState = newState;
        },
        SET_PERSON(state, person) {
            state.person = person;
        },
        SET_PLANET(state, planet) {
            state.planet = planet;
        },
    },
    actions: {
        transition(store, evt) {
            const nextState = starWarsMachine.transition(store.state.currentState, evt);
            get(nextState, 'actions', []).forEach(action => store.dispatch(action, evt));
            store.state.currentState = nextState.value;
        },
        fetchPerson(store, { id }) {
            return slowFetch(`https://swapi.co/api/people/${id}`)
                .then(res => res.json())
                .then((res) => {
                    store.commit('SET_PERSON', res);
                    store.dispatch('transition', { type: 'SUCCESS_PERSON', payload: res });
                }, () => store.dispatch('transition', { type: 'FAILURE_PERSON' }));
        },
        fetchPlanet(store, { payload }) {
            return slowFetch(payload.homeworld)
                .then(res => res.json())
                .then((res) => {
                    store.commit('SET_PLANET', res);
                    store.dispatch('transition', { type: 'SUCCESS_PLANET', payload: res });
                }, () => store.dispatch('transition', { type: 'FAILURE_PLANET' }));
        },
        clearData(store) {
            store.commit('SET_PERSON', null);
            store.commit('SET_PLANET', null);
        },
    },
});
