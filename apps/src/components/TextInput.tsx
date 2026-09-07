import * as React from 'react';
import {
	TextInput as DefaultTextInput,
	TextStyle,
	StyleProp,
} from 'react-native';

interface Props {
	style: StyleProp<TextStyle>;
	[key: string]: any;
}

export const TextInput = (props: Props) => {
	return <DefaultTextInput {...props} style={props.style} />;
}
