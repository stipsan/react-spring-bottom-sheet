module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        tarballDir: 'release',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: 'release/*.tgz',
        // Issues are disabled on this repo, so trying to file one on failure only
        // buries the real error under a second one
        failComment: false,
        failTitle: false,
        successComment: false,
      },
    ],
    '@semantic-release/git',
  ],
  preset: 'angular',
  branches: ['main'],
}
