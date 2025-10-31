// Simple API smoke test for dev server
const base = process.env.API_BASE || 'http://localhost:3001';

async function check(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status} ${res.statusText} for ${url}: ${text.slice(0,200)}`);
  }
  return res.json().catch(() => ({}));
}

(async () => {
  try {
    // Health
    const health = await check(`${base}/health`);
    if (!health || !health.status) throw new Error('Health missing status');

    // Flights (dev GET)
    const flights = await check(`${base}/api/flights/search`);
    if (!flights.success) throw new Error('Flights search not successful');

    // Hotels (dev GET)
    const hotels = await check(`${base}/api/hotels/search`);
    if (!hotels.success) throw new Error('Hotels search not successful');

    // Weather (dev GET)
    const weather = await check(`${base}/api/weather/forecast/London`);
    if (!weather.success) throw new Error('Weather forecast not successful');

    // AI Planner (dev POST)
    const ai = await check(`${base}/api/ai-planner/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: 'London', duration: 3, budget: 1000, travelers: 2 })
    });
    if (!ai.success) throw new Error('AI itinerary not successful');

    console.log('API smoke OK');
    process.exit(0);
  } catch (err) {
    console.error('API smoke FAILED:', err.message);
    process.exit(1);
  }
})();
