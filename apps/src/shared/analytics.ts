export const shouldCollectAnalytics = (
  environment: string | undefined,
  isDevelopmentBuild: boolean
): boolean => {
  const resolvedEnvironment =
    environment || (isDevelopmentBuild ? "development" : "production");
  return resolvedEnvironment !== "local" && resolvedEnvironment !== "development";
};
