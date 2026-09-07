// Sentry initialization — must be imported before anything else in index.js so
// errors from app startup are captured. The DSN comes from EXPO_PUBLIC_SENTRY_DSN
// in the project .env file (inlined by Expo CLI at bundle time); the
// react-native-config keys are a secondary override. Falls back to the built-in
// default DSN so the app reports errors with zero configuration.
import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';

// Added to integrations below; src/navigation registers its NavigationContainer
// ref on this so route changes become breadcrumbs and named transactions.
export const reactNavigationIntegration = Sentry.reactNavigationIntegration();

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || Config.SENTRY_DSN ||
  'https://17abdf33e55216ab3bfade984ccf0b89@o4512044306530304.ingest.us.sentry.io/4512044817383424';
const environment =
  process.env.EXPO_PUBLIC_SENTRY_ENV ||
  Config.SENTRY_ENV ||
  (__DEV__ ? 'development' : 'production');

Sentry.init({
  dsn,
  environment,
  integrations: [reactNavigationIntegration],
  // request/screen spans on every navigation are too noisy for release at 100%
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
});
