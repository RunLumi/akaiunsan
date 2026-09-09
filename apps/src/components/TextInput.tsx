import * as React from 'react';
import {
	TextInput as DefaultTextInput,
	TextStyle,
	StyleProp,
} from 'react-native';
import Styles from '../shared/Styles';

interface Props {
	style: StyleProp<TextStyle>;
	[key: string]: any;
}

export const TextInput = (props: Props) => {
	return (
		<DefaultTextInput
			{...props}
			maxFontSizeMultiplier={Styles.typography.maxFontSizeMultiplier}
			style={props.style}
		/>
	);
}
