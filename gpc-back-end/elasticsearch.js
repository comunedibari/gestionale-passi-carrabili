var express = require("express");
var elastic = express();
const proxy = require("express-request-proxy");
var config = require("./config");
var router = express.Router();
global.__root = __dirname + "/";

const basicAuth = require('express-basic-auth')
 
elastic.use(basicAuth({
    users: { 'elastic': 'password' }
}))

// Add headers
elastic.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,Authorization,x-access-token,Access-token, requiredgroup"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

elastic.all("/", proxy({ url: "http://localhost:9200"  }));

module.exports = elastic;
