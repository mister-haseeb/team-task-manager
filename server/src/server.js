require('dotenv').config({ quiet: true });
const app = require('./app');

const PORT = process.env.PORT || 5050;

// Express 5 passes listen errors (e.g. port already in use) to this callback
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Could not start server on port ${PORT}: ${err.message}`);
    process.exit(1);
  }
  console.log(`API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
