// Sentry initialization — must be imported before anything else in index.js so
// errors from app startup are captured. The DSN comes from EXPO_PUBLIC_SENTRY_DSN
// in the project .env file (inlined by Expo CLI at bundle time); the
// react-native-config keys are a fallback while the flavor-based .env setup is
// still in place. When no DSN is present, Sentry stays completely disabled.
import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';

// Added to integrations below; src/navigation registers its NavigationContainer
// ref on this so route changes become breadcrumbs and named transactions.
export const reactNavigationIntegration = Sentry.reactNavigationIntegration();

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || Config.SENTRY_DSN;
const environment =
  process.env.EXPO_PUBLIC_SENTRY_ENV ||
  Config.SENTRY_ENV ||
  (__DEV__ ? 'development' : 'production');

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    integrations: [reactNavigationIntegration],
    // request/screen spans on every navigation are too noisy for release at 100%
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
}
