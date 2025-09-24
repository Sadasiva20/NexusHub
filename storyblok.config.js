module.exports = {
  spaceId: process.env.STORYBLOK_SPACE_ID,
  oauthToken: process.env.STORYBLOK_OAUTH_TOKEN,
  managementToken: process.env.STORYBLOK_MANAGEMENT_TOKEN,
  region: 'eu', // or your region
  componentsDirectory: 'src/components/storyblok', // directory for local components
  storiesDirectory: 'src/stories', // if using stories
  datasourceDirectory: 'src/datasources', // if using datasources
};
