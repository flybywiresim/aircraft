const { execSync } = require('child_process');
const { writeFileSync } = require('fs');

const evaluate = (cmd) => execSync(cmd, { shell: 'bash' }).toString().trim();

const GITHUB_ACTOR = process.env['GITHUB_ACTOR'] ?? evaluate('git log -1 --pretty=format:\'%an <%ae>\'');
const GITHUB_EVENT_NAME = process.env['GITHUB_EVENT_NAME'] ?? 'manual';
const GITHUB_REF = process.env['GITHUB_REF'] ?? evaluate('git show-ref HEAD').replace(/.+\//, '');
const GITHUB_SHA = process.env['GITHUB_SHA'] ?? evaluate('git show-ref -s HEAD');
const GITHUB_COMMIT_SHA = GITHUB_SHA.substring(0, 7);
const GITHUB_RELEASE_PRETTY_NAME = (require('./pretty-release-name'))();
const GITHUB_BUILT = evaluate('date -u -Iseconds');

const getBranchPreFix = () => {
    let GIT_BRANCH;
    const isPullRequest = process.env.GITHUB_REF && process.env.GITHUB_REF.startsWith('refs/pull/');
    if (isPullRequest) {
        GIT_BRANCH = process.env.GITHUB_REF.match('^refs/pull/([0-9]+)/.*$')[1];
    } else {
        GIT_BRANCH = process.env.GITHUB_REF_NAME
            ? process.env.GITHUB_REF_NAME
            : evaluate('git rev-parse --abbrev-ref HEAD');
    }
    const edition = require('../package.json').edition;

    if (edition === 'stable') {
        return 'rel';
    } else if (GIT_BRANCH === 'master') {
        return 'dev';
    } else if (GIT_BRANCH === 'experimental') {
        return 'exp';
    } else {
        return `${GIT_BRANCH}`;
    }
};

const VERSION = 'v' + require('../package.json').version + `-${(getBranchPreFix())}` + `.${GITHUB_COMMIT_SHA}`;

const object = {
    built: GITHUB_BUILT,
    ref: GITHUB_REF,
    sha: GITHUB_SHA,
    actor: GITHUB_ACTOR,
    event_name: GITHUB_EVENT_NAME ?? 'manual',
    pretty_release_name: GITHUB_RELEASE_PRETTY_NAME,
    version: VERSION,
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

const write = (file) => writeFileSync(file, JSON.stringify(object, null, 4));

write(`${filePrefixArg}_build_info.json`);
