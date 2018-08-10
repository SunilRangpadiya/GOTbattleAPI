exports.config = require("../config.json");
const moment = require('moment');
const fs = require('fs');
const cronJob = require('cron').CronJob;


//logging 
var LoggingDir = exports.config.server.LoggingDir;
if (LoggingDir == undefined)
LoggingDir = "./logs/";

if (!fs.existsSync(LoggingDir)) {
    // Create the directory if it does not exist
    fs.mkdirSync(LoggingDir);
}
    
var currntdate = moment(new Date()).format("YYYYMMDD");
var logDir = LoggingDir + currntdate;
if (!fs.existsSync(logDir)) {
	// Create the directory if it does not exist
	fs.mkdirSync(logDir);
}

exports.accessLog = logDir + "/" + currntdate + "_access.log";
var jwtAuthCheckLog = logDir + "/" + currntdate + "_jwtAuthCheck.log";

//change date wise logfile
var loginJob = new cronJob({
	cronTime: '10 00 00 * * *',
	onTick: updateLogFile,
	start: true,
	timezone: 'Asia/Kolkata'
});

function updateLogFile() {
	currntdate = moment(new Date()).format("YYYYMMDD");
	logDir = LoggingDir + currntdate;
	if (!fs.existsSync(logDir)) {
		// Create the directory if it does not exist
		fs.mkdirSync(logDir);
	}

	exports.accessLog = logDir + "/" + currntdate + "_access.log";	
	jwtAuthCheckLog = logDir + "/" + currntdate + "_jwtAuthCheck.log";
};


//jwt authentication
exports.JWT_SECRET = "instarem|BattleAPI";
exports.APIKeyManager = {};
exports.jwt = require('jsonwebtoken');

var getElapsedTime = () =>{
	return moment().hour(23).minute(59).second(0).diff(moment(),'seconds');
	// return 10;
}

var generateJWT =  (payload) =>{
	const FUNC_NAME = " generateJWT()";
	try {
		var expiresIn = getElapsedTime();
		return exports.jwt.sign(payload, exports.JWT_SECRET, { expiresIn: expiresIn });
	}
	catch (err) {
		console.log(err.message + FUNC_NAME);
		return undefined;		
	}
};

exports.checkAndGenerateJWT = (clientInfo,responseData,userKey,userMaster) => {
	try {
		var decode = exports.jwt.verify(clientInfo.jwttoken, exports.JWT_SECRET);
		responseData.token = clientInfo.jwttoken;
	} catch (err) {
		var payload = {};
		payload.apikey = clientInfo.apikey;
		payload.secret = clientInfo.secret;
		var token = generateJWT(payload);
		if (token != undefined) {
			responseData.token = token;
			clientInfo.jwttoken = responseData.token;
			//set jwttoken
			// query = "CALL stp_UserAuthenticate( 2,'" + clientInfo.sAPIKey + "','" + clientInfo.sAPISecretKey + "','" + token + "')";
			var query = { 'apikey': clientInfo.apikey };
						
			userMaster.findOneAndUpdate(query, {$set: { "jwttoken" : clientInfo.jwttoken}},{new : true});
		} 
	}
	if(responseData.token == undefined) {
		responseData.statuscode = -1;
		responseData.errorstring = "Failed to generate token. Please try again.";
	}else{
		responseData.errorstring = "token generated successfully";
	}	
	exports.APIKeyManager[userKey] = clientInfo;  
};

exports.authenticate = (request, response , next) => {
	const FUNC_NAME = " authenticate()";
    var token;
    var responseData = {};
	responseData.status = -1;
	responseData.errorstring = "Authentication Failed.";
    var logData = {};
    logData.errMessage = "Unauthorized Access.";
    logData.remoteAdd = request._remoteAddress;
    logData.jwtToken = token;
    logData.timestamp = moment(new Date()).format("YYYY-DD-MM HH:mm:ss:ms");
    try {
        token = request.headers.authorization;
        if(token == undefined){
            fs.appendFile(jwtAuthCheckLog, JSON.stringify(logData) + "\n", function (err) {
                if (err) console.log(err.message + FUNC_NAME);
            });                       
            return response.status(401).json(responseData);        
        }
		var decode = exports.jwt.verify(token, exports.JWT_SECRET);        		
         next();
    }catch(error) {  
        fs.appendFile(jwtAuthCheckLog, JSON.stringify(logData) + "\n", function (err) {
            if (err) console.log(err.message + FUNC_NAME);
        });
        return response.status(401).json(responseData);       
    }   
};