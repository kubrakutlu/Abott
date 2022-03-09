const asana = require('asana');

const asanaBot = async (asanaPat, taskID, target, prState, prUrl, prTitle, prNumber, commentStatus) => {
  const client = asana.Client.create().useAccessToken(asanaPat);

  const task = await client.tasks.findById(taskID);
  const projects = task.projects;
  target = JSON.parse(target);
  let out = [];
  let foundFlag = false;
  for (const proj of projects) {
    const sections = await client.sections.findByProject(proj.gid);
    const targetSection = await sections.find((sec) => sec.name === target[prState]);
    if (targetSection) {
      foundFlag = true;
      await client.sections.addTask(targetSection.gid, { task: taskID });
      out.push(`Moved ${task.name} to ${targetSection.name} in ${proj.name}`);
    }

    if (prState === 'CLOSED') {
      await client.tasks.addComment(taskID, {
        text: `Closed Pull Request #${prNumber}.\n View: ${prUrl}`,
      });
    }

    if (prState === 'MERGED') {
      await client.tasks.addComment(taskID, {
        text: `Merged Pull Request #${prNumber}\n${prTitle}\nView: ${prUrl}`,
      });
    }

    if (prState === 'CHANGES_REQUESTED') {
      await client.tasks.addComment(taskID, {
        text: `Changes request for PR #${prNumber}\n-> View: ${prUrl}`,
      });
    }

    if (commentStatus) {
      let comment;
      if (prState === 'APPROVED') {
        comment = {
          text: `✅ PR Approved\n-------------------\n${prTitle}\n-------------------\nView: ${prUrl}`
        };
      } else if (prState === 'OPENED') {
        comment = {
          text: `PR opened\n--------\n${prTitle}\n------------\nView: ${prUrl}`
        };
      }
  
      await client.tasks.addComment(taskID, comment);
    }
  }

  if (!foundFlag) {
    return [`No tasks found for the project and the sections mentioned`];
  } else {
    return out;
  }
};

module.exports = asanaBot;