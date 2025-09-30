const express = require('express');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const logger = require('./src/services/logger');


const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'logs.json');







async function ensureDataFile() {
  try {
    await fsp.access(DATA_FILE);
  } catch (err) {
    await fsp.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fsp.writeFile(DATA_FILE, '[]', 'utf8');
  }
}



async function readLogs() {
  try {
    const content = await fsp.readFile(DATA_FILE, 'utf8');
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
  await fsp.writeFile(DATA_FILE, JSON.stringify(logs, null, 2), 'utf8');
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
