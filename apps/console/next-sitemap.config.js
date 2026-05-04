/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://graycup.org",
  generateRobotsTxt: true, // (optional)
  // ...other options
};
