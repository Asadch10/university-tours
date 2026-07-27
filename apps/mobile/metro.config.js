// Metro config for the pnpm monorepo. Lets Metro find hoisted deps in the
// workspace root and resolve the @ucpt/* workspace packages.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so changes in workspace packages are picked up.
config.watchFolders = [workspaceRoot];

// Resolve modules from the app first, then the workspace root. Hierarchical
// lookup stays ON so Metro can find each package's nested deps in pnpm's
// .pnpm/<pkg>/node_modules layout (e.g. expo -> expo-modules-core).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
