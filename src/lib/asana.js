const asana = require('asana');
const core = require('@actions/core');

const asanaBot = async (asanaPat, taskID, target, prState, prUrl, prTitle, prNumber, commentStatus, doNotMoveSections) => {
  const client = asana.Client.create({
    'defaultHeaders': {
      'asana-enable': 'new_user_task_lists,new_goal_memberships',
    },
  }).useAccessToken(asanaPat);

  core.debug(`TaskID: ${taskID}`);
  try {
    const task = await client.tasks.findById(taskID);
    const projects = task.projects;
    target = JSON.parse(target);
    let out = [];
    let foundFlag = false;
    for (const proj of projects) {
      const sections = await client.sections.findByProject(proj.gid);
  
      doNotMoveSections = JSON.parse(doNotMoveSections);
      if (doNotMoveSections.length > 0) {
        for (const members of task.memberships) {
          if (members.project.gid === proj.gid) {
            for (const doNotSec of doNotMoveSections) {
              if (members.section.gid === doNotSec) {
                continue
              } 
            }
          }
        }
      }
  
      try {
        const targetSection = await sections.find((sec) => sec.name === target[prState]);
        if (targetSection) {
          foundFlag = true;
          await client.sections.addTask(targetSection.gid, { task: taskID });
          out.push(`Moved ${task.name} to ${targetSection.name} in ${proj.name}`);
        } else {
          out.push(`Unable to move ${task.name} to ${target[prState]} in ${proj.name} as section doesn't exist.`)
        }
      } catch(err) {
        core.debug(err);
        out.push(`Unable to move ${task.name} to ${target[prState]} in ${proj.name} as section doesn't exist.`)
      }
    }
  
    if (commentStatus) {
      let comment;
      if (prState === 'OPEN') {
        comment = {
          text: `🔓 PR opened\n--------\n${prTitle}\n------------\nView: ${prUrl}`
        };
      }
  
      await client.tasks.addComment(taskID, comment);
    }
  
    if (prState === 'CLOSED') {
      await client.tasks.addComment(taskID, {
        text: `🛑 Closed Pull Request #${prNumber}.\n View: ${prUrl}`,
      });
    } else if (prState === 'MERGED') {
      await client.tasks.addComment(taskID, {
        text: `🎉 Merged Pull Request #${prNumber}\n${prTitle}\nView: ${prUrl}`,
      });
    } else if (prState === 'CHANGES_REQUESTED') {
      await client.tasks.addComment(taskID, {
        text: `❌ Changes request for PR #${prNumber}\n-> View: ${prUrl}`,
      });
    } else if (prState === 'APPROVED') {
      await client.tasks.addComment(taskID, {
        text: `✅ PR Approved\n-------------------\n${prTitle}\n-------------------\nView: ${prUrl}`
      });
    }
  
    if (!foundFlag) {
      return [`No tasks found for the project and the sections mentioned`];
    } else {
      return out;
    }
  } catch (err) {
    core.debug(err);
  }
};

module.exports = asanaBot;
