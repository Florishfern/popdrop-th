const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/upload/secure?file=test.png&type=image/png',
  method: 'GET',
  headers: {
    // Need a valid session cookie, but since we don't have it, we might get 401 Unauthorized
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
