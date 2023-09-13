var express = require("express");
var api = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
var path = require("path");
var db = require("./db");
global.__root = __dirname + "/";
global.__rootController = __dirname + "/controller";

// Add headers
api.use(function(req, res, next) {
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

api.get("/api", function(req, res) {
  res.status(200).send("API works.");
});

api.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

var AuthController = require(__root + "auth/AuthController");
api.use("/api/auth", AuthController);

var v1Controller = require(__root + "v1/Controller");
api.use("/api/v1", v1Controller);

var UserController = require(__rootController + "/UserController");
api.use("/api/user", UserController);

var PassiCarrabiliController = require(__rootController + "/PassiCarrabiliController");
api.use("/api/passicarrabili", PassiCarrabiliController);

var PanchineController = require(__rootController + "/PanchineController");
api.use("/api/panchine", PanchineController);

var UtilityController = require(__rootController + "/UtilityController");
api.use("/api/utility", UtilityController);

module.exports = api;
