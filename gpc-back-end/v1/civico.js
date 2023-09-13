var express = require("express");
var router = express.Router();
var config = require("../config");
const UtmConverter = require('utm-converter');
const axios = require("axios");
var md5 = require('md5');

var token = "";
var token_time = Date.now();
axios.defaults.baseURL = config.civico.baseURL;
var token_timeout_seconds = config.civico.timeout;

router.post("/", async function (req, res) {
  const obj = req.body;
  await checkToken();
  res.status(200).send(await getData(obj.indirizzo, obj.numero, obj.esponente));
});

router.post("/soloIndirizzo", async function (req, res) {
  const obj = req.body;
  await checkToken();
  res.status(200).send(await getDataSoloIndirizzo(obj.indirizzo));
});

router.post("/getDataSingoloMunicipio", async function (req, res) {
  const obj = req.body;
  await checkToken();
  res.status(200).send(await getDataSingoloMunicipio(obj.indirizzo, obj.numero, obj.municipio_id, obj.esponente));
});

var checkToken = async () => { //Check token validity
  var tokenTimeout = token_time + token_timeout_seconds * 1000;
  
  if (Date.now() > tokenTimeout || !token) { //Require new token
    console.log("Timeout Login: generating new token in progress...")
    await getLogin("login/doLoginNew");
  }
};

const getData = async (nomeIndirizzo, numeroIndirizzo, esponente) => {
  try {

    if(!nomeIndirizzo && !numeroIndirizzo)
      return [];

    var params = {};
    nomeIndirizzo = nomeIndirizzo.replace(/[^a-zA-Z' ]/g, "");
    params.filter = "nome_via|ILIKE|%" + nomeIndirizzo + "%";

    if (numeroIndirizzo)
      params.filter += ";numero|EQ|" + numeroIndirizzo;

    const response = await axios.post("/civico/master", params);
    var data = response.data;

    if (!Array.isArray(data.result)) return { result: [] };

    if(esponente) {
      data.result = data.result.filter(el => el.esponente == esponente.toUpperCase());
    }

    if (data.result.length > 10)
      data = { result: data.result.slice(0, 10) }

    var converter = new UtmConverter();
    data.result.map(function (res) {
      coord = converter.toWgs({"coord":{"x":res.x,"y":res.y},"zone":33})
      res.lat = coord.coord.latitude
      res.lon = coord.coord.longitude
      return res;
    });

    return data
  } 
  catch (error) {
    console.log(error);
    return [];
  }
};

const getDataSoloIndirizzo = async (nomeIndirizzo) => {
  try {

    if(!nomeIndirizzo)
      return [];

    var params = {};
    nomeIndirizzo = nomeIndirizzo.replace(/[^a-zA-Z' ]/g, "");
    params.filter = "nome_via|ILIKE|%" + nomeIndirizzo + "%";

    const response = await axios.post("/civico/master", params);
    var  data = response.data;

    if (!Array.isArray(data.result)) return { result: [] };
    
    data.result = data.result.map(res => {
      return {
        nome_via: res.nome_via, 
        municipio: res.municipio,
        localita: res.localita
      };
    });

    let unique = [];

    data.result.forEach(x => {
      let found = false;
      unique.forEach(y => {
        if(y.nome_via == x.nome_via && y.municipio == x.municipio && y.localita == x.localita)
          found = true;
      });

      if(!found)
        unique.push(x);  
    });

    data.result = unique;

    if (data.result.length > 20)
      data = { result: data.result.slice(0, 20) }

    return data
  } 
  catch (error) {
    console.log(error);
    return [];
  }
};

const getDataSingoloMunicipio = async (nomeIndirizzo, numeroIndirizzo, municipio_id, esponente) => {
  try {

    if(!nomeIndirizzo && !numeroIndirizzo)
      return [];

    var params = {};
    params.filter = "nome_via|ILIKE|%" + nomeIndirizzo + "%";

    if (numeroIndirizzo)
      params.filter += ";numero|EQ|" + numeroIndirizzo;

    const response = await axios.post("/civico/master", params);
    var data = response.data;

    if (!Array.isArray(data.result)) return { result: [] };

    if(municipio_id) {
      data.result = data.result.filter(el => el.municipio.endsWith(municipio_id));
    }

    if(esponente) {
      data.result = data.result.filter(el => el.esponente == esponente.toUpperCase());
    }

    if (data.result.length > 10)
      data = { result: data.result.slice(0, 10) }

    var converter = new UtmConverter();
    data.result.map(function (res) {
      coord = converter.toWgs({"coord":{"x":res.x,"y":res.y},"zone":33})
      res.lat = coord.coord.latitude
      res.lon = coord.coord.longitude
      return res;
    });

    return data
  } 
  catch (error) {
    console.log(error);
    return [];
  }
};

/*Login on Ts_intelligence*/
const getLogin = async url => {
  try {
    var response = await axios.post(url, { signature: md5(config.civico.user + config.civico.pass) });
    token = response.data.result;
    axios.defaults.headers.common['it_app_auth'] = token;
    token_time = Date.now();
  } catch (error) {
    console.log(error);
    token = "fail";
  }
};

module.exports = router;
