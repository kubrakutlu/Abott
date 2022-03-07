const github = require('@actions/github');
const core = require('@actions/core');

const utils = require('./src/utils/utils');
const git = require('./src/lib/git');

const run = async () => {
  utils.validateTrigger(github.context.eventName);

  const pullRequest = github.context.payload.pull_request;
  let prState = '';
  const target = core.getInput('target');
  const asanaPAT = core.getInput('asana-pat');
  const githubToken = core.getInput('GITHUB_TOKEN');
  const asanaSecret = core.getInput('ASANA_SECRET');

  const client = github.getOctokit(githubToken);
  const reviews =  await client.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: github.context.payload.pull_request.number,
  });

  console.log(JSON.stringify(reviews));

  if (reviews.length === 0) {
    prState = 'OPENED';
  } else {
    const state = reviews[reviews.length - 1].state;
    prState = state;
  }

  await git(asanaPAT, asanaSecret, pullRequest, target, prState);
}

try {
  run();
} catch(err) {
  console.log(err);
  if (err instanceof Error) {
    core.setFailed(err.message);
  } else {
    core.setFailed('Unknown error');
  }
}