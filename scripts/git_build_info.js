const { execSync } = require('child_process');
const fs = require('fs');

const evaluate = (cmd) =>
  execSync(cmd, { shell: 'bash', stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();

/**
 * @typedef GitBuildInfo
 * @type {object}
 * @property {string} actor - The actor who initiated the build.
 * @property {string} event - The event name that initiated the build.
 * @property {string} ref - the git ref of HEAD.
 * @property {string} commitHash - The commit hash of HEAD.
 * @property {string} shortHash - The first 7 characters of the commit hash of HEAD.
 * @property {string} branch - The branch name of HEAD.
 * @property {string} releaseName - The well-formatted release name of HEAD.
 * @property {string} tag - Git tag containing HEAD.
 * @property {string} isPullRequest - Is this build for a github pull request.
 */

const getReleaseName = (commitHash, branch, tag) => {
  if (tag) {
    return `stable/${tag}`;
  }
  return `${branch}:${commitHash.substring(0, 8)}`;
};

const getPullRequestInfo = () => {
  if (!process.env.GITHUB_EVENT_PATH) return null;

  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));

  if (!event.pull_request) return null;

  return {
    headSha: event.pull_request.head.sha,
    headRef: event.pull_request.head.ref,
    baseRef: event.pull_request.base.ref,
  };
};

/**
 * Get the git build info.
 * @returns {GitBuildInfo | undefined} The build info derived from git, or undefined if not possible.
 */
exports.getGitBuildInfo = () => {
  // all git commands are wrapped in a try block so the build can still succeed outside of a git repo.
  try {
    let tag = '';
    try {
      try {
        if (process.env.GITHUB_REF && process.env.GITHUB_REF.startsWith('refs/tags/')) {
          tag = process.env.GITHUB_REF.replace('refs/tags/', '');
        }
      } catch {
        tag = evaluate('git tag -l --contains HEAD')
          .split('\n')
          .filter((it) => !!it)[0];
      }
    } catch (e) {
      console.log('No tag', e);
    }

    const isPullRequest =
      process.env.GITHUB_EVENT_NAME === 'pull_request' || process.env.GITHUB_EVENT_NAME === 'pull_request_target';

    let branch;
    let commitHash;
    if (isPullRequest) {
      const prInfo = getPullRequestInfo();
      commitHash = prInfo.headSha;
      branch = prInfo.headRef;
    } else {
      commitHash = process.env.GITHUB_SHA ? process.env.GITHUB_SHA : evaluate('git show-ref -s HEAD');
      branch = process.env.GITHUB_REF_NAME ? process.env.GITHUB_REF_NAME : evaluate('git rev-parse --abbrev-ref HEAD');
    }

    const buildInfo = {
      actor: process.env.GITHUB_ACTOR ?? evaluate("git log -1 --pretty=format:'%an <%ae>'"),
      event: process.env.GITHUB_EVENT_NAME ?? 'manual',
      ref: process.env.GITHUB_REF ? process.env.GITHUB_REF : evaluate('git show-ref HEAD').replace(/.+\//, ''),
      commitHash,
      shortHash: commitHash.substring(0, 7),
      branch,
      releaseName: getReleaseName(commitHash, branch, tag),
      tag,
      isPullRequest,
    };

    return buildInfo;
  } catch (e) {
    if (process.env.CI) {
      throw e;
    } else {
      console.warn('Git failed', e);
    }
  }

  return undefined;
};
