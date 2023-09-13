var config = require('../config');
var db = require('../db');

function checkAuth(req, res, next) {

  let requiredGroup = req.headers.requiredgroup;

  db.client.get({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: req.user.group_id
  }).then(function (resp) {
    let groups = resp._source;

    if (groups[requiredGroup] == true)
      next();
    else
      return res.status(503).send({ auth: false, message: 'You are not authorized.' });

  }).catch((err) => {
    return res.status(err.status).send({ auth: false, message: 'You are not authorized.' });
  });
}

module.exports = checkAuth;