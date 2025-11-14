import 'reflect-metadata';
import { AppDataSource } from './config/data-source.js';
import app from './app.js';
import { config } from 'dotenv';
config();

const PORT = 4000;



async function initWithRetry(maxAttempts = 5) {
  let attempt = 0;
  let lastErr;

  while (attempt < maxAttempts) {
    try {
      console.log(`[db] init attempt ${attempt + 1}/${maxAttempts}`);
      await AppDataSource.initialize();
      console.log('[db] init OK');
      return;
    } catch (err) {
      lastErr = err;
      const delay = Math.min(1000 * 2 ** attempt, 15000);
      console.error(`[db] init failed: ${err?.message} — retry în ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }

  throw lastErr;
}

initWithRetry()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[api] listening on http://localhost:${PORT} (pid=${process.pid})`);
    });
  })
  .catch((err) => {
    console.error('DB init fatal:', err);
    process.exit(1);
  });

  