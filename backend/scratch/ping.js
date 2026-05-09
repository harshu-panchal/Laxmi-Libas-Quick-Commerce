const http = require('http');

const testEndpoint = (path) => {
  const url = `http://localhost:5000/api/v1/bus${path}`;
  console.log(`Testing ${url}...`);
  http.get(url, (res) => {
    console.log(`PATH: ${path} | STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        console.log(`BODY: ${rawData.substring(0, 100)}`);
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
};

testEndpoint('/routes/all');
testEndpoint('/schedules/all');
testEndpoint('/bookings/all');
