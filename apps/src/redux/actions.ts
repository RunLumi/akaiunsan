export const TYPES = {
	AUTH: {
		PROFILE:'UpdateUser',
		LOGIN: 'Types/Auth/Login',
		LOG_OUT: 'Types/Auth/LogOut',
	},
	TOOLS: {
		OPEN_PICKER: 'Tools/OpenPicker',
		CLOSE_PICKER: 'Tools/ClosePicker',
		NOTIFICATION: 'Tools/Notificaiton'
	},
	LANGUAGE:'Update/Language',

};

export const success: (arg0: string) => string = (type: string) => {
	return `${type}/SUCCESS`;
};

export const failure: (arg0: string) => string = (type: string) => {
	return `${type}/FAILURE`;
};
