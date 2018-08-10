const global = require('./scr/global.js');
const express = require('express');
const bodyParser = require('body-parser');
const APIcalllogger = require('morgan');
const morgon_json = require('morgan-json');
const moment = require('moment');
const fs = require('fs');

const port = global.config.server.port || 8081;

var app = express();

var accesslog = fs.createWriteStream(global.accessLog, { flags: 'a' });
const api_log_format = morgon_json(':date[web] :method :url :remote-addr :status :res[content-length] bytes :response-time ms');
app.use(APIcalllogger(api_log_format, { stream: accesslog }));


//Use Body parser so we get info from Post and/or URL Parameters. 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Allowing Cross reference for data sharing.
app.use((req, res, next) =>{
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With, Content-Type, Accept");
	next();
});

var apihandler = require('./scr/apihandler');

app.post('/authenticate', apihandler.userAuthenticate);
app.get('/count', global.authenticate,apihandler.getCount);
app.get('/list', global.authenticate,apihandler.getBattlePlaces);
app.get('/stats', global.authenticate,apihandler.getStats);
app.get('/search', global.authenticate,apihandler.getBattles);

app.listen(port, '0.0.0.0');
console.log("server started on port " + port);
