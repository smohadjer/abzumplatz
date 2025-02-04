import { State } from '../types.js';
import { deepClone } from './utils';

class Store {
    #state: State = {
        isLoggedin: false,
    };

    getState() {
        return deepClone(this.#state);
    }

    setState(state: State) {
        this.#state = deepClone(state);
    }
}

export const store = new Store();

