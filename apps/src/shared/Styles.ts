import Theme from "./theme";

export default {
	margin: {
		horizontal: 20,
		vertical: 10,
	},
	shadow: {
		shadowColor: Theme.shadow.float.shadowColor,
		shadowOpacity: 0.2,
		shadowOffset: { width: 0, height: 0 },
		shadowRadius: 6,
		elevation: 3,
	},
	typography: {
		// Preserve accessibility scaling while preventing extreme system sizes
		// from making controls unusable or pushing important content off-screen.
		maxFontSizeMultiplier: 1.3,
		h1: 32,
		h2: 24,
		h3: 18,
		title: 16,
		normal: 14,
		footnode: 10,
	},
};
