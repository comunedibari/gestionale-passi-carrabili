const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger.json'
const endpointsFiles = [
    './auth/AuthController.js',
    './controller/PassiCarrabiliController.js',
    './controller/UtilityController.js',
    './controller/UserController.js',
    './v1/civico.js',
    './v1/Controller.js',
    './v1/violations.js'
]

swaggerAutogen(outputFile, endpointsFiles).then(() => {
    require('./server.js')
})