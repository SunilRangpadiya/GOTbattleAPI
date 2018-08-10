// grab the things we need
const global = require('../scr/global.js');

var mongoose = require('mongoose');
mongoose.connect(global.config.dbconnection,{ useNewUrlParser: true });

var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({  
  apikey: { type: String, required: true, unique: true },
  secret: { type: String, required: true },  
},{collection: 'userMaster'});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;