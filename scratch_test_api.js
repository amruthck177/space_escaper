const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(body)
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(body)
        });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- STARTING API VERIFICATION TESTS ---');
  try {
    // 1. Register Player
    console.log('\n1. Testing POST /api/players');
    const pRes = await post('/api/players', { username: 'TestPilot_99' });
    console.log('Response:', pRes.statusCode, pRes.body);

    // 2. Submit Score
    console.log('\n2. Testing POST /api/scores');
    const sRes = await post('/api/scores', { username: 'TestPilot_99', score: 1450, difficulty: 'normal' });
    console.log('Response:', sRes.statusCode, sRes.body);

    // 3. Get overall Leaderboard
    console.log('\n3. Testing GET /api/leaderboard');
    const lRes = await get('/api/leaderboard');
    console.log('Response:', lRes.statusCode, `Fetched ${lRes.body.length} scores. Top score:`, lRes.body[0]);

    // 4. Get player personal best / history
    console.log('\n4. Testing GET /api/players/TestPilot_99/scores');
    const histRes = await get('/api/players/TestPilot_99/scores');
    console.log('Response:', histRes.statusCode, histRes.body);
  } catch (err) {
    console.error('API Verification Test failed:', err);
  }
}

runTests();
