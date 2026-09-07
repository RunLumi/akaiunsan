import { combineReducers } from 'redux';
import auth from './auth';
import tools from './tools';
import language from './language';

const rootReducers = combineReducers({
	auth,
	tools,
	language
});

export default rootReducers;

export type RootState = ReturnType<typeof rootReducers>;
