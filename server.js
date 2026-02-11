/**
 * Server Entry Point
 *
 * Starts the Express server on Heroku or local environment.
 */

const app = require('./server/app');

const PORT = process.env.PORT || 3000;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export for testing
module.exports = app;
