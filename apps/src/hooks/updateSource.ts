import * as React from 'react';
import * as Updates from 'expo-updates';
export default function updateSource() {
	const [isLoadingComplete, setLoadingComplete] = React.useState(false);
	React.useEffect(() => {
		async function loadUpdateAsync() {
			try {
				const update = await Updates.checkForUpdateAsync();
				if (update.isAvailable) {
					// logDebug('An update was found, downloading...');
					await Updates.fetchUpdateAsync();
					await Updates.reloadAsync();
					// await Updates.reloadFromCache();
				}
			} catch (e) {
				console.log(e)
			}
			finally {
				setLoadingComplete(true);
			}
		}

		loadUpdateAsync();
	}, []);

	return isLoadingComplete;
}
