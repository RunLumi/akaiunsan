import { FontAwesome, SimpleLineIcons, AntDesign } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as React from 'react';

export default function useCachedResources() {
	const [isLoadingComplete, setLoadingComplete] = React.useState(false);
	React.useEffect(() => {
		async function loadResourcesAndDataAsync() {
			try {
				// Load fonts
				await Font.loadAsync({
					...FontAwesome.font,
					...SimpleLineIcons.font,
					...AntDesign.font,
				});
			} catch (e) {
				console.error('Loading Font Error', e);
			} finally {
				setLoadingComplete(true);
			}
		}

		loadResourcesAndDataAsync();
	}, []);

	return isLoadingComplete;
}
