const userMaster = require("../model/usermaster");
const battleinfo = require("../model/battleinfo");
const global = require("./global");
const q = require('q');

var getBattleCount = (resolve, reject) => {
    const FUNC_NAME = " getBattleCount()";
    try {
        var deferred = q.defer();
        battleinfo.countDocuments({}, (err, battleCount) => {
            if (err) {
                console.log(err.message + FUNC_NAME);
                deferred.reject("failed to load battle count");

            } else {
                deferred.resolve(battleCount);
            }

        });
        return deferred.promise;
    } catch (err) {
        console.log(err.message + FUNC_NAME);
        deferred.reject(err);
    }
}

const getDefenderData = (resolve, reject) => {
    const FUNC_NAME = " getDefenderData()";
    try {
        battleinfo.find({ "defender_size": { $gt: 0 } }, { _id: 0, defender_size: 1 }, (err, defenderdata) => {
            if (err) {
                console.log(err.message + FUNC_NAME);
                reject("failed to load DefenderData.");
            } else {
                // object of the user      
                var responseObj = {};
                if (defenderdata.length > 0) {
                    var result = [];
                    var totalDefender = 0;
                    defenderdata.forEach((u) => {
                        result.push(u.defender_size)
                        totalDefender += u.defender_size;
                    });
                    result.sort((a, b) => a - b);

                    responseObj.max = result[result.length - 1];
                    responseObj.min = result[0];
                    responseObj.avg = 0;
                    getBattleCount().then((results) => {
                        if (results > 0)
                            responseObj.avg = parseFloat(totalDefender / results);

                        resolve(responseObj);
                    }).catch((reason) => {
                        console.log(reason + FUNC_NAME);
                        reject("failed to load DefenderData.")
                    });


                } else {
                    responseObj.defender_size.max = 0;
                    responseObj.defender_size.min = 0;
                    responseObj.defender_size.avg = 0;
                    resolve(responseObj);
                }
                // response.send(obj);
                // console.log(obj);

            }
        });
    } catch (err) {
        console.log(err.message + FUNC_NAME);
        reject("failed to load DefenderData.");
    }
}

const getBattleType = (resolve, reject) => {
    const FUNC_NAME = " getBattleType()";
    try {
        battleinfo.distinct('battle_type', { "battle_type": { $nin: ["", null] } }, function (err, battletypes) {
            if (err) {
                console.log(err.message + FUNC_NAME);
                reject("failed to load getBattleType.");
            } else {
                resolve(battletypes);
            }
        });
    } catch (err) {
        console.log(err.message + FUNC_NAME);
        reject("failed to load getBattleType.");
    }
}

const getAttackerOutcome = (resolve, reject) => {
    const FUNC_NAME = " getAttackerOutcome()";
    try {
        battleinfo.aggregate([
            {
                "$group": {
                    "_id": "$attacker_outcome",
                    "count": { "$sum": 1 }
                }
            }
        ], function (err, attackeroutcome) {
            if (err) {
                console.log(err.message + FUNC_NAME);
                reject("failed to load getAttackerOutcome.");
            }
            else {
                var attackerOutcomeData = {};
                if(attackeroutcome.length > 0)
                {
                    attackeroutcome.forEach((element) =>{
                        if(element._id == "loss" || element._id == "win")
                        {
                            attackerOutcomeData[element._id] = element.count;
                        }
                    });
                }                
                resolve(attackerOutcomeData);
            }
        });
    } catch (err) {
        console.log(err.message + FUNC_NAME);
        reject("failed to load getAttackerOutcome.");
    }
}

const mostActive = (resolve, reject, fieldName) => {
    const FUNC_NAME = " mostActive()";
    try {

        var query = JSON.stringify([{
            "$group": {
                "_id": "$<<fieldname>>",
                "<<fieldname>>": { "$sum": 1 }
            }
        }, { "$sort": { "<<fieldname>>": -1 } }, { "$limit": 1 }])
        if (fieldName == undefined || fieldName == "") {
            console.log("Invalid field name" + FUNC_NAME);
            reject("failed to load getAttackerOutcome.");
            return;
        }
        query = query.replace(/<<fieldname>>/g, fieldName);

        battleinfo.aggregate([
            JSON.parse(query)
        ], function (err, mostactive) {
            if (err) {
                console.log(err.message + FUNC_NAME);
                reject("failed to load mostActive.");
            } else {
                
                var mostActiveData = "";
                if(mostactive.length > 0){
                    mostActiveData = mostactive[0]._id;
                }
                resolve(mostActiveData);
            }
        });
    } catch (err) {
        console.log(err.message + FUNC_NAME);
        reject("failed to load mostActive.");
    }
}


const getBattleStats = () => {

    // Create an array of promises
    var promises = [];

    promises.push(new Promise((resolve, reject) => {
        mostActive(resolve, reject, "attacker_king");
    }));

    promises.push(new Promise((resolve, reject) => {
        mostActive(resolve, reject, "defender_king");
    }));

    promises.push(new Promise((resolve, reject) => {
        mostActive(resolve, reject, "region");
    }));

    promises.push(new Promise((resolve, reject) => {
        mostActive(resolve, reject, "name");
    }));

    promises.push(new Promise((resolve, reject) => {
        getDefenderData(resolve, reject);
    }));

    promises.push(new Promise((resolve, reject) => {
        getBattleType(resolve, reject);
    }));

    promises.push(new Promise((resolve, reject) => {
        getAttackerOutcome(resolve, reject);
    }));

    return Promise.all(promises);
}

module.exports = {
    getCount: (request, response) => {
        getBattleCount().then((results) => {            
            response.send(`total ${results} battle has taken place`);
        }).catch((reason) => {
            console.log('Some async call failed:');
            console.log(' --> ', reason);
            response.send(reason);
        });
    },

    getBattlePlaces: (request, response) => {
        const FUNC_NAME = " getBattlePlaces()";
        try {

            battleinfo.distinct('location', { "location": { $nin: ["", null] } }, (err, battlePlaces) => {
                if (err) {
                    console.log(err.message + FUNC_NAME);
                    response.send("something went wrong");
                    return;
                }
                response.send(battlePlaces);
            });
        } catch (err) {
            console.log(err.message + FUNC_NAME);
            response.send("something went wrong");
        }
    },

    getStats: (request, response) => {
        
        getBattleStats().then((results) => {                        
            var responseData = {};
            responseData.most_active = {};
            for(var i = 0; i < results.length; i++){

                switch(i){
                    case 0:{
                        responseData.most_active.attacker_king = results[i];
                    }break;
                    case 1:{
                        responseData.most_active.defender_king = results[i];
                    }break;
                    case 2:{
                        responseData.most_active.region = results[i];
                    }break;
                    case 3:{
                        responseData.most_active.name = results[i];
                    }break;
                    case 4:{
                        responseData.defender_size = results[i];
                    }break;
                    case 5:{
                        responseData.battle_type = results[i];
                    }break;
                    case 6:{
                        responseData.attacker_outcome = results[i];
                    }break;

                }
            }
            response.send(responseData);
        }, (reason) => {
            console.log('Some async call failed:');
            console.log(' --> ', reason);
        });

        // mostActive();
        // getDefenderData();
        // getBattleType();
        // getAttackerOutcome();        

    },

    getBattles: (request, response) => {
        const FUNC_NAME = " getBattlePlaces()";
        try {
            var query = {};
            for (key in request.query) {

                switch (key) {
                    case "king": {
                        query.$or = [];
                        query.$or.push({ "attacker_king": request.query[key] });
                        query.$or.push({ "defender_king": request.query[key] });
                    }
                        break;
                    case "location": {
                        query.location = request.query[key];
                    }
                        break;
                    case "type": {
                        query.battle_type = request.query[key];
                    }
                        break;
                    default: {
                        console.log(`${key} is not handled in search criteria`)
                    }
                }
            }

            battleinfo.distinct('name', query, (err, battles) => {
                if (err) {
                    console.log(err.message + FUNC_NAME);
                    response.send("something went wrong");
                    return;
                }
                response.send(battles);
            });
        } catch (err) {
            console.log(err.message + FUNC_NAME);
            response.send("something went wrong");
        }
    },


    userAuthenticate: (request, response) => {
        const FUNC_NAME = " userAuthenticate() ";
        var responseData = {};
        responseData.statuscode = 1;
        responseData.errorstring = "";

        try {
            var userData = request.body;
            responseData.requestid = userData.requestid;
            if (userData.apikey == undefined || userData.apikey == ""
                || userData.secret == undefined || userData.secret == "") {
                responseData.statuscode = -1;
                responseData.errorstring = "Invalid APIKey or Secret";
                response.send(responseData);
                return;
            }
            //validate user 
            var userKey = userData.apikey + "-" + userData.secret;
            var clinetInfo = global.APIKeyManager[userKey];
            if (clinetInfo != undefined) {
                global.checkAndGenerateJWT(clinetInfo, responseData, userKey, userMaster);
                response.send(responseData);
                return;
            }
            else {

                userMaster.find({ "apikey": userData.apikey }, (err, user) => {
                    if (err) {
                        console.log(err.message + FUNC_NAME);
                        responseData.statuscode = -1;
                        responseData.errorstring = "Failed to generate token. Please try again.";
                        response.send(responseData);
                        return;
                    }
                    //check and generate token                
                    if (user.length > 0) {
                        if (user[0].secret == userData.secret) {
                            global.checkAndGenerateJWT(user[0], responseData, userKey, userMaster);
                            response.send(responseData);
                            return;
                        }
                    }

                    responseData.statuscode = -1;
                    responseData.errorstring = "Invalid apikey and secret.";


                    response.send(responseData);
                });
            }
        } catch (err) {
            console.log(err.message + FUNC_NAME);
            responseData.statuscode = -1;
            responseData.errorstring = "Failed to generate token. Please try again.";
            response.send(responseData);
        }
    },
};