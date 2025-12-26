const https = require('https');

async function fetchJson(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function test() {
  // Get token
  const credRes = await fetchJson('https://auth.useb.co.kr/oauth/get-client-secret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test_stayg.dev@gmail.com',
      password: 'stayg.dev251215!@#'
    })
  });

  const clientId = credRes.data.data.client_id;
  const clientSecret = credRes.data.data.client_secret;
  const basicAuth = Buffer.from(clientId + ':' + clientSecret).toString('base64');

  const tokenRes = await fetchJson('https://auth.useb.co.kr/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + basicAuth
    }
  });

  const token = tokenRes.data.jwt;
  console.log('Token obtained\n');

  // Your data from OCR
  const name = "이정규";
  const juminNo1 = "010331";
  const juminNo2 = "3201411";
  const issueDate = "20200818";

  // Test different issueDate formats for 주민등록증
  const issueDateFormats = [
    "20200818",     // YYYYMMDD
    "200818",       // YYMMDD
    "2020-08-18",   // YYYY-MM-DD
    "2020.08.18",   // YYYY.MM.DD
    "20.08.18",     // YY.MM.DD
  ];

  console.log('=== Testing Resident ID with different issueDate formats ===\n');

  for (let i = 0; i < issueDateFormats.length; i++) {
    const req = {
      userName: name,
      juminNo1: juminNo1,
      juminNo2: juminNo2,
      issueDate: issueDateFormats[i]
    };

    console.log('Test ' + (i + 1) + ': issueDate = "' + issueDateFormats[i] + '"');

    const res = await fetchJson('https://api3.useb.co.kr/status/idcard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(req)
    });

    console.log('Result:', res.data.error_code || 'SUCCESS', '-', res.data.message);

    if (res.data.success) {
      console.log('\nSUCCESS! Full response:', JSON.stringify(res.data, null, 2));
      break;
    }
    console.log('');
  }
}

test().catch(console.error);
