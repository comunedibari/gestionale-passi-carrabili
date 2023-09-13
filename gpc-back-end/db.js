var elasticsearch = require("elasticsearch");
var config = require("./config");

var client = new elasticsearch.Client({
  host: config.host,
  log: config.log
  //,requestTimeout: 100000
});

module.exports = {
  client: client
};
