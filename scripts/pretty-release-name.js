const { execSync } = require('child_process');

// Find first tag pointing to HEAD
const tag = execSync('git tag -l --contains HEAD').toString().split('\n').filter((it) => !!it)[0];

if (tag) {
    console.log(`stable/${tag}`);
} else {
    // Alternatively, get branch and short SHA
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const sha = execSync('git show-ref -s HEAD').toString().substring(0, 8);

    console.log(`${branch}/${sha}`);
}
