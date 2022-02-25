const { execSync } = require('child_process');

// Find first tag pointing to HEAD
const tag = execSync('git tag -l --contains HEAD').toString().split('\n').filter((it) => !!it)[0];

if (tag) {
    console.log(`stable/${tag}`);
} else {
    // Alternatively, get branch and short SHA. Remove slashes from branch so that this can be used as a sentry.io release name
    const branch = (execSync('git rev-parse --abbrev-ref HEAD').toString().trim()).replaceAll(/[/\\]/g, '.');

    const ghSha = process.env['GITHUB_SHA'];

    let sha = ghSha;
    if (!sha) {
        try {
            sha = execSync('git show-ref -s HEAD').toString();
        } catch (e) {
            sha = 'unknown';
        }
    }

    console.log(`${branch}:${sha.substring(0, 8)}`);
}
