var express = require("express");
var fs = require("fs");
var path = require("path");
var db = require("./db");
global.__root = __dirname + "/";

if (fs.existsSync(__dirname + "/dist")) {
  var app = express();
  // Add headers
  app.use(function(req, res, next) {
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
      "X-Requested-With,content-type,Authorization,x-access-token,Access-token,requiredgroup"
    );

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);

    // Pass to next layer of middleware
    next();
  });

  app.use(express.static(__dirname + "/dist"));

  app.get("/*", function(req, res) {
    res.sendFile(path.join(__dirname + "/dist/index.html"));
  });
}
module.exports = app;
