const { execSync } = require('child_process');
const { writeFileSync } = require('fs');

const evaluate = (cmd) => execSync(cmd, { shell: 'bash' }).toString().trim();

const built = evaluate('date -u -Iseconds');

const buildInfo = require('./git_build_info').getGitBuildInfo();
const packageInfo = require('../package.json');

const getBranchPreFix = () => {
  const edition = packageInfo.edition;

  if (edition === 'stable') {
    return 'rel';
  }
  if (buildInfo?.branch === 'master') {
    return 'dev';
  }
  if (buildInfo?.branch === 'experimental') {
    return 'exp';
  }
  return `${buildInfo?.branch ?? 'unknown'}`;
};

const version = `v${packageInfo.version}-${getBranchPreFix()}.${buildInfo?.shortHash ?? 'unknown'}`;

const object = {
  built,
  ref: buildInfo?.ref ?? '',
  sha: buildInfo?.commitHash ?? '',
  actor: buildInfo?.actor ?? '',
  event_name: buildInfo?.event ?? 'manual',
  pretty_release_name: buildInfo?.releaseName ?? '',
  version: version ?? '',
};

const outDirArg = process.argv[2];

if (!outDirArg) {
  console.error('Cannot create build_info.json without output directory.');
  process.exit(1);
}

process.chdir(outDirArg);

const filePrefixArg = process.argv[3];

if (!filePrefixArg) {
  console.error('Cannot create build_info.json without build info file prefix.');
  process.exit(1);
}

object.version = filePrefixArg + '-' + object.version;

const write = (file) => writeFileSync(file, JSON.stringify(object, null, 4));

write(`${filePrefixArg}_build_info.json`);
