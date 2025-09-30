const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

fs.mkdirSync(LOG_DIR, { recursive: true });

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: LOG_FILE }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
      ),
    }),
  ],
});

module.exports = logger;
