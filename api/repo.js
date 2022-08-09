const https = require('https');

module.exports = async (req, res) => {
  res.json({
    schema_version: '3.0.0',
    packages: await Promise.all(
      req.query.url.split(',').map(getPackage)
    )
  });
};

async function getPackage(url) {
  let [owner, repo, ...branch] = url.split('/');
  branch = branch.join('/');
  let commit;
  if (branch) commit = await getJSON(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`);
  else [commit] = await getJSON(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`);
  return {
    details: `https://github.com/${owner}/${repo}`,
    releases: [{
      version: commit.commit.committer.date.split(/[^\d]+/).filter(Boolean).join('.'),
      url: `https://api.github.com/repos/${owner}/${repo}/zipball/${commit.sha}`,
      date: commit.commit.committer.date.replace('T', ' ').replace('Z', ''),
      sublime_text: '*',
    }],
  };
}

function getJSON(url) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let opts = { headers: { 'user-agent': '' } }
    https
      .get(url, opts, res => {
        res
          .on('data', data => chunks.push(data))
          .once('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))))
          .once('error', reject)
      })
      .once('error', reject)
      .end();
  });
}
