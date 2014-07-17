// load the things we need
var mongoose = require('mongoose');

// define the schema for our note model
var postSchema = mongoose.Schema({

        category    : String,
        title       : String,
        post        : String,
        type        : String,
        tags        : [String],
        created     : Date,
        Author      : String,
    
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Post', postSchema);
