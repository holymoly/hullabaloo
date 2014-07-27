// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var preferenceSchema = mongoose.Schema({

    preference   	: {
    	email 		: String,	
        editor      : String,
        mainLanguage: String,
    }

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Preference', preferenceSchema);