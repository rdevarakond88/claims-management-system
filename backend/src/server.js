// Load environment variables
require('dotenv').config();

// Validate environment configuration before starting the app
const { validateEnv, getConfig } = require('./utils/validateEnv');

try {
  validateEnv();
  console.log('✅ Environment variables validated successfully');
} catch (error) {
  console.error('❌ Failed to start server due to environment validation errors');
  process.exit(1);
}

const config = getConfig();
const app = require('./app');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Environment: ${config.nodeEnv}`);
  console.log(`✅ Logging: ${config.logLevel}${config.enableFileLogging ? ' (file logging enabled)' : ''}`);
  console.log(`✅ CORS origins: ${config.corsOrigins.length} configured`);
});
