var pjson = require('./package.json');
const scadenziario = require('./service/Scadenziario'); 

console.info(`Starting job ${pjson.version} ...`);

scadenziario.startJob();