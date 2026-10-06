const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle migrations are .sql files bundled as strings (see babel.config.js).
config.resolver.sourceExts.push('sql');

// The Anthropic SDK's ES module build has an import cycle (beta messages ↔ BetaToolRunner)
// that crashes at startup in development, when Fast Refresh reads every export as a module
// loads. Its CommonJS build is safe, so resolve the SDK with the `require` condition.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@anthropic-ai/sdk' || moduleName.startsWith('@anthropic-ai/sdk/')) {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ['require', 'react-native'] },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
