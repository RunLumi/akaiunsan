import React from 'react';
import { NavigationContainerRef, StackActions } from '@react-navigation/native';
import { RootStackParamList, RouteName } from './routes';

export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Route names are checked against the typed ParamList at every call site;
// the dispatcher internals stay loose because React Navigation's union-name
// navigate overloads don't accept a union `name` argument directly.
export const NavigationRoot = {
	navigate: function navigate(name: RouteName, params?: any) {
		(navigationRef.current as any)?.navigate(name, params);
	},

	push: function push(name: RouteName, params?: any) {
		navigationRef.current?.dispatch(StackActions.push(name, params));
	},

	replace: function replace(name: RouteName, params?: any) {
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
