var request = require('request');
var config = require('../config');

async function startJob() {

    try {

        console.info(`Starting job Scadenziario at ${new Date().toLocaleString()}`);

        let response = await new Promise(function (resolve, reject) {
            request.get({
                url: `${config.scadenziario.scadenziario_url}`,
                strictSSL: false
            }, function (error, response, body) {
                if (error)
                    reject(error);
                else
                    resolve(response);
            });
        });
        
        if(response)
            console.log(`>> Response Job Scadenziario ${response.statusCode} ${response.statusMessage} ${response.body}`);


    } catch (error) {
        console.error(error)
    } finally {
        console.info(`Ending job Scadenziario at ${new Date().toLocaleString()}`);

        process.exit(0)
    }
}


module.exports = {
    startJob
}

