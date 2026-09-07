# Build stg
cd android && ENVFILE=.env.staging && ./gradlew app:assembleRelease
# Build production
cd android && ENVFILE=.env.production && ./gradlew app:assembleRelease
# Build dev
cd android && ENVFILE=.env.dev && ./gradlew app:assembleRelease
# Run yarn

"android:staging": "react-native run-android app:--variant=stagingdebug",
"android:staging-release": "react-native run-android app:--variant=stagingrelease",
"android:prod": "react-native run-android app:--variant=productiondebug",
"android:prod-release": "react-native run-android app:--variant=productionrelease",
"ios:prod": "react-native run-ios --scheme 'AyasanProduction'",
"ios:staging": "react-native run-ios --scheme 'AysanStaging'"

# Deploy prod

Apple: teamvn.nic.develop@gmail.com / 123456@N1c
Android: teamvn.nic.develop@gmail.com / 123456?g
Expo develop: teamnicvn / 123456?g
