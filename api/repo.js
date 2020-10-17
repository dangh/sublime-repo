const { Octokit } = require('@octokit/rest');

const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

module.exports = async (req, res) => {
  let [owner, repo, ...branch] = req.query.url.split('/');
  branch = branch.join('/');
  let octokit = new Octokit({ auth: GITHUB_ACCESS_TOKEN });
  let ref;
  if (branch) {
    ref = (await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` })).data;
  } else {
    let [master, main] = await Promise.all([
      octokit.git.getRef({ owner, repo, ref: `heads/master` }).catch(err => {}),
      octokit.git.getRef({ owner, repo, ref: `heads/main` }).catch(err => {}),
    ]);
    branch = master ? 'master' : 'main';
    ref = (master || main).data;
  }
  let { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: ref.object.sha });
  let commitDate = new Date(commit.committer.date);
  let detailsUrl = `https://github.com/${owner}/${repo}`;
  if (!['master', 'main'].includes(branch)) detailsUrl += `/tree/${branch}`;
  res.json({
    schema_version: '3.0.0',
    packages: [{
      details: detailsUrl,
      releases: [{
        version: strftime(commitDate, '%Y.%m.%d.%H.%M.%S'),
        url: `https://github.com/${owner}/${repo}/archive/${branch}.zip`,
        date: strftime(commitDate, '%Y-%m-%d %H:%M:%S'),
        sublime_text: '*'
      }]
    }]
  });
};

function strftime(date, format) {
  return format.replace(/%[a-zA-Z]/g, c => {
    switch (c[1]) {
      case 'Y': return date.getFullYear();
      case 'y': return String(date.getFullYear()).slice(-2);
      case 'm': return String(date.getMonth() + 1).padStart(2, '0');
      case 'n': return date.getMonth() + 1;
      case 'd': return String(date.getDate()).padStart(2, '0');
      case 'e': return date.getDate();
      case 'H': return String(date.getHours()).padStart(2, '0');
      case 'I': return String(date.getHours() % 12).padStart(2, '0');
      case 'k': return date.getHours();
      case 'l': return date.getHours() % 12;
      case 'M': return String(date.getMinutes()).padStart(2, '0');
      case 'S': return String(date.getSeconds()).padStart(2, '0');
      default: return c;
    }
  });
}
