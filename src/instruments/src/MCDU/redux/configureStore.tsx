import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import rootReducer from './reducers/rootReducer';

export const store = createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(thunk)),
);

export type MCDUState = ReturnType<typeof store.getState>

export type MCDUDispatch = typeof store.dispatch
