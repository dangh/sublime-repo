const { Octokit } = require('@octokit/rest');

const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

module.exports = async (req, res) => {
  let [owner, repo, ...branch] = req.query.url.split('/');
  branch = (branch.join('/') || 'master');
  let octokit = new Octokit({ auth: GITHUB_ACCESS_TOKEN });
  let { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
  let { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: ref.object.sha });
  let commitDate = new Date(commit.committer.date);
  res.json({
    schema_version: '3.0.0',
    packages: [{
      details: `https://github.com/${owner}/${repo}${branch != 'master' ? `/tree/${branch}` : ''}`,
      releases: [{
        version: strftime(commitDate, '%Y%m%d.%H%M%S.0'),
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
