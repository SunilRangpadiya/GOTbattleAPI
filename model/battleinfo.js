// grab the things we need
const global = require('../scr/global.js');

var mongoose = require('mongoose');
mongoose.connect(global.config.dbconnection,{ useNewUrlParser: true });

var Schema = mongoose.Schema;

// create a schema
var battleInfoSchema = new Schema({  
  name: { type: String, required: true},
  year: { type: Number},  
  battle_number: { type: Number},  
  attacker_king: { type: String},  
  defender_king: { type: String},  
  attacker_1: { type: String},  
  attacker_2: { type: String},  
  attacker_3: { type: String},  
  attacker_4: { type: String},  
  defender_1: { type: String},  
  defender_2: { type: String},  
  defender_3: { type: String},  
  defender_4: { type: String},  
  attacker_outcome: { type: String},  
  battle_type: { type: String},  
  major_death: { type: Number},  
  major_capture: { type: Number},  
  attacker_size: { type: Number},
  defender_size: { type: Number},
  attacker_commander: { type: String},
  defender_commander: { type: String},  
  summer: { type: Number},
  location: { type: String},
  region: { type: String},
  note: { type: String}  
},{collection: 'battleInfo'});

// the schema is useless so far
// we need to create a model using it
var BattleInfo = mongoose.model('BattleInfo', battleInfoSchema);

// make this available to our users in our Node applications
module.exports = BattleInfo;