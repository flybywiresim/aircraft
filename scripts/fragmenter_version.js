const buildInfo = require('./git_build_info').getGitBuildInfo();
const packageInfo = require('../package.json');

let version;
if (packageInfo.edition === 'stable') {
  version = `v${packageInfo.version}`;
} else {
  const hash = buildInfo?.shortHash;

  if (!hash) {
    console.error('[!] buildInfo.shortHash is falsy');
    process.exit(-1);
  }

  version = buildInfo.shortHash;
}

module.exports = { version };
