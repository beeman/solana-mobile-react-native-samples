const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable JSON imports
config.resolver.sourceExts = [...config.resolver.sourceExts, 'json'];

module.exports = config;
