import { success, TYPES } from '../actions';

const INITIAL_STATE = {
	token: '',
	user: null,
	loading: false
};

export default function authReducer(
	state = INITIAL_STATE,
	action: { type: string; payload: any },
) {
	switch (action.type) {
		case success(TYPES.AUTH.LOGIN):
			const { token } = action.payload;
			return { ...state, token };
		case success(TYPES.AUTH.PROFILE):
			const { user } = action.payload;
			return { ...state, user };
		case success(TYPES.AUTH.LOG_OUT):
			return INITIAL_STATE;
		default:
			return state;
	}
}
