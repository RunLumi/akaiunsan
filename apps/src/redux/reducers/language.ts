import { success, TYPES } from '../actions';

const INITIAL_STATE = {
	language: 'en'
};

export default function languageReducer(
	state = INITIAL_STATE,
	action: { type: string; payload: any },
) {
	switch (action.type) {
		case success(TYPES.LANGUAGE):
			const { language } = action.payload;
			return { ...state,language };
		default:
			return state;
	}
}
