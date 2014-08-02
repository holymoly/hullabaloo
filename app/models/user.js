// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
        email        : String,
        password     : String,
        admin        : Boolean,
        locked       : Boolean,
});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

// checks if user is admin
userSchema.methods.checkIfUserIsAdmin = function(user,cb) {
    this.model('User').findOne({ 'email' : user},'admin', function(err, isAdmin) {
        if (err){
            throw err;
        }
        cb(isAdmin);
    });
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);

