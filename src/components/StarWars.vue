<template>
    <div>
        <div v-if="currentState === 'idle'">
            Click below to search
        </div>

        <div v-else-if="isPending">
            Searching...
        </div>

        <div v-else-if="currentState === 'fulfilled'">
            <div>Person: {{person}}</div>
            <div>Planet: {{planet}}</div>
        </div>

        <div v-else-if="currentState === 'rejected'">
            Uh oh, something went wrong!
        </div>

        <button @click="sendRequest()">
            {{ isPending ? 'Loading...' : 'Request' }}
        </button>
    </div>
</template>

<script>
import { get } from 'lodash-es';
import { Machine } from 'xstate';

const starWarsMachine = Machine({
    initial: 'idle',
    states: {
        idle: {
            on: { REQUEST: 'pending' },
        },
        pending: {
            initial: 'loadingPerson',
            states: {
                loadingPerson: {
                    on: {
                        SUCCESS_PERSON: {
                            loadingPlanet: {
                                actions: ['setPerson'],
                            },
                        },
                    },
                    onEntry: 'fetchPerson',
                },
                loadingPlanet: {
                    onEntry: 'fetchPlanet',
                },
            },
            on: {
                SUCCESS_PLANET: {
                    fulfilled: {
                        actions: ['setPlanet'],
                    },
                },
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

function getXStateVuexModule(name, machineConfig) {
  const lightMachine = xstate.Machine(machineConfig);

  // Reusable function for generic and action-specific mutations
  function transition(state, action) {
    console.log('Sending transition', action);
    const result = lightMachine.transition(state.currentState, action);
    state.currentState = result.value
  }

  function getMutationForAction(action) {
    return {
      [action](state) {
        return transition(state, action);
      }
    };
  }

  // Create an object with a mutation using transiton() for every action defined
  // in the machine
  const actions = Object.keys(machineConfig.states).reduce((acc, state) =>
    Object.keys(machineConfig.states[state].on)
          .filter(a => !acc[a])
          .reduce((acc2, stateAction) => Object.assign(
            acc2,
            getMutationForAction(stateAction)
          ), acc), {});

  return {
    [name]: {
      namespaced: true,
      state: {
        currentState: lightMachine.initial
      },
      mutations: {
        transition: transition,
        ...actions
      }
    }
  };
}

function slowFetch(...args) {
    return new Promise((resolve, reject) => setTimeout(
        () => (Math.random() > 0.66 ?
            reject() :
            fetch(...args).then(resolve, reject)),
        1000,
    ));
}

const data = {
    currentState: starWarsMachine.initialState.value,
    person: null,
    planet: null,
};

const actionMap = {
    fetchPerson: ({ id }, dispatch) => slowFetch(`https://swapi.co/api/people/${id}`)
        .then(res => res.json())
        .then(res => dispatch({
            type: 'SUCCESS_PERSON',
            payload: res,
        }))
        .catch(err => dispatch({
            type: 'FAILURE_PERSON',
            error: err,
        })),
    setPerson({ payload }) {
        data.person = payload;
    },
    fetchPlanet: ({ payload }, dispatch) => slowFetch(payload.homeworld)
        .then(res => res.json())
        .then(res => dispatch({
            type: 'SUCCESS_PLANET',
            payload: res,
        }))
        .catch(err => dispatch({
            type: 'FAILURE_PLANET',
            error: err,
        })),
    setPlanet({ payload }) {
        data.planet = payload;
    },
    logResult: ({ payload }) => console.log(payload),
};

function dispatchEvent(event) {
    console.log('Inside dispatch', event);
    const nextState = starWarsMachine.transition(data.currentState, event);

    console.log(nextState);
    get(nextState, 'actions', []).forEach((actionKey) => {
        console.log('actionKey', actionKey);
        if (actionMap[actionKey]) {
            actionMap[actionKey](event, dispatchEvent);
        }
    });

    data.currentState = nextState.value;
    console.log('new state', data.currentState);
}

export default {
    name: 'StarWars',
    data() {
        return data;
    },
    computed: {
        isPending() {
            return this.currentState.pending != null;
        },
    },
    methods: {
        sendRequest() {
            dispatchEvent({ type: 'REQUEST', id: 3 });
        },
    },
};
</script>

<style scoped>
</style>
