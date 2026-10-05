const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle migrations are .sql files bundled as strings (see babel.config.js).
config.resolver.sourceExts.push('sql');

module.exports = config;
