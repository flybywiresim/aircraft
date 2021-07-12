import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import rootReducer from './reducers/rootReducer';

const configureStore = () => createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(thunk)),

);
export default configureStore;
