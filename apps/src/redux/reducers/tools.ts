import { success, TYPES } from '../actions';

const INITIAL_STATE = {
	picker: {
		isShow: false,
		data: [],
		selected: '',
		callback: () => {},
	},
	notification: 0
};

export default function toolsReducer(
	state = INITIAL_STATE,
	action: { type: string; payload: any },
) {
	switch (action.type) {
		case TYPES.TOOLS.OPEN_PICKER: {
			return { ...state, picker: { ...action.payload, isShow: true } };
		}
		case TYPES.TOOLS.CLOSE_PICKER: {
			return { ...state, picker: INITIAL_STATE.picker };
		}
		case TYPES.TOOLS.NOTIFICATION: {
			return { ...state, notification: action.payload};
		}
		default:
			return state;
	}
}
