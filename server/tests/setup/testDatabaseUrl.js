// Tests use their own database so they never touch development data.
// TEST_DATABASE_URL wins; otherwise "_test" is appended to the DATABASE_URL database name.
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env'), quiet: true });

function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL or TEST_DATABASE_URL to run the tests');

  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `${url.pathname.replace(/^\//, '').replace(/_test$/, '')}_test`;
  return url.toString();
}

module.exports = { testDatabaseUrl };
