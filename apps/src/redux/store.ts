// @flow
import { applyMiddleware, compose, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createSagaMiddleware from 'redux-saga';
import reducers from './reducers';
import sagas from './sagas';
import logger from 'redux-logger';

class Store {
	store: any;
	persistor;

	constructor() {
		// Config persistStore
		const config = {
			key: 'root',
			keyPrefix: '',
			storage: AsyncStorage,
			blacklist: ['tools'],
			whitelist: ['auth','language'],
		};
		const reducer = persistReducer(config, reducers);

		// Redux saga
		const sagaMiddleware = createSagaMiddleware();

		// Connect to DevTools
		const composeEnhancers = compose;

		// Create store
		const enhancer = composeEnhancers(applyMiddleware(...[sagaMiddleware, logger]));
		this.store = createStore(reducer, enhancer);
		// Create persistor
		this.persistor = persistStore(this.store);
		// Run saga
		sagaMiddleware.run(sagas);
	}
}

export default new Store();
