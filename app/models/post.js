// load the things we need
var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');

// define the schema for our note model
var postSchema = mongoose.Schema({
    category    : String,
    title       : String,
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
    post        : 'text',
    tags        : 'text',
    author      : 'text',
},{
    name: "best_match_index",
    weights: {
        title: 5,
        tags: 5,
        category: 4,
        post: 3,
    }
})

// create the model for users and expose it to our app
module.exports = mongoose.model('Post', postSchema);
