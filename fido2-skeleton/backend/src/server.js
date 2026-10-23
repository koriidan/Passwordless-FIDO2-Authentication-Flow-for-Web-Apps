import { createApp } from './app.js';
import { config } from './config/index.js';
import './db/index.js'; // initializes the SQLite schema on startup

const app = createApp();
app.listen(config.port, () => {
  console.log(`FIDO2 backend listening on http://localhost:${config.port}`);
  console.log(`  RP ID: ${config.rpID} · expecting frontend origin: ${config.origin}`);
});
