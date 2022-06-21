const { execSync } = require('child_process');
const { writeFileSync } = require('fs');

const evaluate = (cmd) => execSync(cmd, { shell: 'bash' }).toString().trim();

const GITHUB_ACTOR = process.env['GITHUB_ACTOR'] ?? evaluate('git log -1 --pretty=format:\'%an <%ae>\'');
const GITHUB_EVENT_NAME = process.env['GITHUB_EVENT_NAME'] ?? 'manual';
const GITHUB_REF = process.env['GITHUB_REF'] ?? evaluate('git show-ref HEAD').replace(/.+\//, '');
const GITHUB_SHA = process.env['GITHUB_SHA'] ?? evaluate('git show-ref -s HEAD');
const GITHUB_RELEASE_PRETTY_NAME = (require('./pretty-release-name'))();
const GITHUB_BUILT = evaluate('date -u -Iseconds');

const object = {
    built: GITHUB_BUILT,
    ref: GITHUB_REF,
    sha: GITHUB_SHA,
    actor: GITHUB_ACTOR,
    event_name: GITHUB_EVENT_NAME ?? 'manual',
    pretty_release_name: GITHUB_RELEASE_PRETTY_NAME,
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

write(`build_info.json`);
write(`${filePrefixArg}_build_info.json`);
