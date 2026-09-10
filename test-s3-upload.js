const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

async function run() {
  const s3 = new S3Client({ region: "ap-southeast-1" });
  const command = new PutObjectCommand({
    Bucket: "popdrop-assets-98b5ce56",
    Key: "private/documents/test-upload.txt",
    ContentType: "text/plain",
  });
  
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  console.log("Upload URL:", uploadUrl);
  
  const https = require('https');
  const url = new URL(uploadUrl);
  
  const req = https.request(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': 13
    }
  }, (res) => {
    console.log("STATUS:", res.statusCode);
    res.on('data', d => process.stdout.write(d));
  });
  
  req.on('error', e => console.error(e));
  req.write("Hello Popdrop");
  req.end();
}
run();
