// load the things we need
var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');
var _ = require("underscore");

// define the schema for our note model
var postSchema = mongoose.Schema({
    category    : String,
    title       : String,
    description : String,
    post        : String,
    type        : String,
    tags        : [String],
    created     : Date,
    author      : String,
});

postSchema.plugin(textSearch);
postSchema.index({
    category    : 'text',
    title       : 'text',
    description : 'text',
    post        : 'text',
    tags        : 'text',
    author      : 'text',
},{
    name: "best_match_index",
    weights: {
        title       : 5,
        tags        : 5,
        description : 5,
        category    : 4,
        post        : 3,
    }
})

// generating a hash
postSchema.methods.findPostsSince = function(date,cb) {
    //console.log(date);
    this.model('Post').find({"created": {"$gte": new Date(date)}},'category title description',function(err,postsSince){
            if (err){
                throw err;
            }
            //console.log(_.sortBy(postsSince,'category'));
            cb(_.sortBy(postsSince,'category'));
    });
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Post', postSchema);
