import { put, takeLatest } from 'redux-saga/effects';
import { success, TYPES } from '../actions';

function* login(value: { payload: any; type: string }) {
	yield put({ type: success(TYPES.AUTH.LOGIN), payload: value.payload });
}

function* logout(action: { callback?: () => void }) {
	yield put({ type: success(TYPES.AUTH.LOG_OUT) });
	if (typeof action?.callback === 'function') action.callback();
}

export default [takeLatest(TYPES.AUTH.LOG_OUT, logout)];
