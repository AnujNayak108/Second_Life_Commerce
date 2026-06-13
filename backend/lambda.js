const serverless = require('serverless-http');
const app = require('./server');

// Wrap the Express app for AWS Lambda / API Gateway
module.exports.handler = serverless(app);
