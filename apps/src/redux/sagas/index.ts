import { all } from 'redux-saga/effects';
import auth from './auth';

/**
 * Root Saga
 */
function* rootSaga(): any {
	yield all([...auth]);
}

export default rootSaga;
