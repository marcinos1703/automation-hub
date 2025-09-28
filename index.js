const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { createLogger, format, transports } = require('winston');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'logs.json');
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.File({ filename: LOG_FILE })],
});

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (err) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, '[]', 'utf8');
  }
}

async function ensureLogDir() {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

async function readLogs() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await ensureDataFile();
      return [];
    }
    throw err;
  }
}

async function writeLogs(logs) {
  await fs.writeFile(DATA_FILE, JSON.stringify(logs, null, 2), 'utf8');
}

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/logs', async (req, res) => {
  try {
    const logs = await readLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read logs.' });
  }
});

app.post('/log', async (req, res) => {
  const { message } = req.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const entry = {
    timestamp: new Date().toISOString(),
    source: 'manual',
    message: message.trim(),
  };

  try {
    await ensureDataFile();
    await ensureLogDir();
    const logs = await readLogs();
    logs.push(entry);
    await writeLogs(logs);
    logger.info(entry.message, entry);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save log entry.' });
  }
});

async function startServer() {
  try {
    await ensureLogDir();
    await ensureDataFile();
    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
