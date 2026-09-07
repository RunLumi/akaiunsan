import React from 'react';
import { StackActions } from '@react-navigation/native';
export const navigationRef = React.createRef<any>();
export const NavigationRoot = {
	navigate: function navigate(name: string, params?: any) {
		navigationRef.current?.navigate(name, params);
	},

	push: function push(name: string, params?: any) {
		navigationRef.current?.dispatch(StackActions.push(name, params));
	},

	replace: function replace(name: string, params?: any) {
		const replaceAction = StackActions.replace(name, params);
		navigationRef.current?.dispatch(replaceAction);
	},

	pop: function pop(count?: number) {
		const popAction = StackActions.pop(count);
		navigationRef.current?.dispatch(popAction);
	},

	reset: function reset(props: any) {
		navigationRef.current?.reset(props);
	},

	popToTop: function popToTop() {
		navigationRef.current?.dispatch(StackActions.popToTop());
	},
};
