// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var preferenceSchema = mongoose.Schema({
    	email 		: String,	
        editor      : String,
        mainLanguage: String,
        newsletter  : Boolean,
});

// get user which subscribed to the newsletter
preferenceSchema.methods.findNewsletterUser = function(cb) {
    this.model('Preference').find({ 'newsletter' : true }, 'email',function(err,emails){
        if (err){
            throw err;
        }
        cb(emails);
    });
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Preference', preferenceSchema);