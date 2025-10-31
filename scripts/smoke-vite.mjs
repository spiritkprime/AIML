// Simple Vite dev server smoke test
const base = process.env.VITE_BASE || 'http://localhost:5173';

async function waitForServer(url, retries = 20, delayMs = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
    } catch {}
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error(`Server not ready at ${url}`);
}

(async () => {
  try {
    const html = await waitForServer(base);
    if (!html || html.length < 100) throw new Error('Unexpected response or too short');
    console.log('Vite smoke OK');
    process.exit(0);
  } catch (err) {
    console.error('Vite smoke FAILED:', err.message);
    process.exit(1);
  }
})();
