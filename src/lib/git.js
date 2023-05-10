const core = require('@actions/core');
const bot = require('./asana');
const axios = require('axios');

const gitEvent = async (asanaPAT, asanaSecret, pr, target, prState, doNotMoveSections) => {
  const ASANA_TASK_LINK_REGEX = /https:\/\/app.asana.com\/(\d+)\/(?<project>\d+)\/(?<taskId>\d+).*/ig;
  if (pr != null) {
    core.info('Handling PR event...');
    const prUrl = pr.html_url;
    // const prIsMerged = pr.merged;
    const prBody = pr.body;
    const prNumber = pr.number;
    const prTitle = pr.title;

    let taskIDs = [];
    let rawParseUrlTask;
    let res;
    core.debug(prBody);
    while ((rawParseUrlTask = ASANA_TASK_LINK_REGEX.exec(prBody)) !== null) {
      taskIDs.push(rawParseUrlTask.groups.taskId);
    }
    
    core.info('TaskIDs:')
    core.info(taskIDs);

    for (const taskID of taskIDs) {
      let commentStatus = true;
      if (asanaSecret !== '') {
        // This happens only when the PR is created. Otherwise we don't need to link the issue
        core.info('prState')
        if (prState === 'OPEN') {
          const axiosInstance = axios.create({
            baseURL: 'https://github.integrations.asana.plus/custom/v1',
            headers: {
              Authorization: `Bearer ${asanaSecret}`,
            }
          });
          core.info('HI')
          const result = await axiosInstance.post('actions/widget', {
            allowedProjects: [],
            blockedProjects: [],
            pullRequestDescription: prBody,
            pullRequestName: prTitle,
            pullRequestNumber: prNumber,
            pullRequestURL: prUrl, 
          });
    
          core.info(result.status);
        }
        commentStatus = false;
      } else {
        commentStatus = true;
      }

      res = await bot(asanaPAT, taskID, target, prState, prUrl, prTitle, prNumber, commentStatus, doNotMoveSections);
      core.setOutput('res', res);
    }
  }
};

module.exports = gitEvent;
