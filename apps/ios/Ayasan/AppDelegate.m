#import "AppDelegate.h"
#import <Firebase/Firebase.h>
#import <Firebase.h>

// @generated begin react-native-maps-import - expo prebuild (DO NOT MODIFY) sync-f2f83125c99c0d74b42a2612947510c4e08c423a
#if __has_include(<GoogleMaps/GoogleMaps.h>)
#import <GoogleMaps/GoogleMaps.h>
#endif
// @generated end react-native-maps-import

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
#import <FBSDKApplicationDelegate.h>

//#import <UMCore/UMModuleRegistry.h>
//#import <UMReactNativeAdapter/UMNativeModulesProxy.h>
//#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>
//#import <EXSplashScreen/EXSplashScreenService.h>
//#import <UMCore/UMModuleRegistryProvider.h>
#import <RNGoogleSignin/RNGoogleSignin.h>
#if defined(FB_SONARKIT_ENABLED) && __has_include(<FlipperKit/FlipperClient.h>)
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

//@interface AppDelegate () <RCTBridgeDelegate>
//
//@property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;
//@property (nonatomic, strong) NSDictionary *launchOptions;
//
//@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#if defined(FB_SONARKIT_ENABLED) && __has_include(<FlipperKit/FlipperClient.h>)
  InitializeFlipper(application);
#endif
  
  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }
// @generated begin react-native-maps-init - expo prebuild (DO NOT MODIFY) sync-c79f8044392eac5cfee4b2612df579fdc9a654ed
#if __has_include(<GoogleMaps/GoogleMaps.h>)
  [GMSServices provideAPIKey:@"AIzaSyD6rt8Bo6w4maFl8LBeX7zYczkEJfulwco"];
#endif
// @generated end react-native-maps-init
//  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
//  self.launchOptions = launchOptions;
//  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
//  #ifdef DEBUG
//    [self initializeReactNativeApp];
//  #else
//    EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
//    controller.delegate = self;
//    [controller startAndShowLaunchScreen:self.window];
//  #endif
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  id rootViewBackgroundColor = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTRootViewBackgroundColor"];
  if (rootViewBackgroundColor != nil) {
    rootView.backgroundColor = [RCTConvert UIColor:rootViewBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  [super application:application didFinishLaunchingWithOptions:launchOptions];

  return YES;
}

//- (RCTBridge *)initializeReactNativeApp
//{
//  // RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];
//  RCTBridge *bridge = [self.reactDelegate createBridgeWithDelegate:self launchOptions:launchOptions];
//  // RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
//  UIView *rootView = [self.reactDelegate createRootViewWithBridge:bridge moduleName:@"main" initialProperties:nil];
//  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
//
//  // UIViewController *rootViewController = [UIViewController new];
//  UIViewController *rootViewController = [self.reactDelegate createRootViewController];
//  rootViewController.view = rootView;
//  self.window.rootViewController = rootViewController;
//  [self.window makeKeyAndVisible];
//  [super application:application didFinishLaunchingWithOptions:launchOptions];
//
//  return bridge;
// }

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
//  NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge];
  // If you'd like to export some custom RCTBridgeModules that are not Expo modules, add them here!
//  return extraModules;
  return @[];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
 #ifdef DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
 #else
//  return [[EXUpdatesAppController sharedInstance] launchAssetUrl];
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
 #endif
}

//- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success {
//  appController.bridge = [self initializeReactNativeApp];
//  EXSplashScreenService *splashScreenService = (EXSplashScreenService *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXSplashScreenService class]];
//  [splashScreenService showSplashScreenFor:self.window.rootViewController];
//}

// Linking API
// - (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
//     [[FBSDKApplicationDelegate sharedInstance] application:application
//                                                  openURL:url
//                                                  options:options];
//    [RCTLinkingManager application:application openURL:url options:options];
//    return YES;
// }
- (BOOL)application:(UIApplication *)application openURL:(nonnull NSURL *)url options:(nonnull NSDictionary<NSString *,id> *)options {
  return [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url options:options] || [RNGoogleSignin application:application openURL:url options:options];
}
// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

@end
