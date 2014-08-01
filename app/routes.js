// load up the post model
var Post       = require('../app/models/post');
var Preference = require('../app/models/preference');
var User = require('../app/models/user');
var fs = require('fs');
var _ = require("underscore");

module.exports = function(app, passport) {

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// PROFILE SECTION =========================
	app.get('/profile', isLoggedIn, function(req, res) {
        //console.log(req.user.local.email);
        User.findOne({ 'local.email' : req.user.local.email },'local.admin', function(err, user) {
            if (err)
                throw err;
            User.find({},'local.admin local.locked local.email' , function(err,allUser){
                if (err)
                    throw err;
                console.log(allUser);
                res.render('profile.ejs', {
                    user    : req.user,
                    admin   : user.local.admin,
                    allUser : allUser
                });
            });
        });
	});

	// POST SECTION =========================
	app.get('/post', isLoggedIn, function(req, res) {
        process.nextTick(function() {
	        Preference.findOne({ 'preference.email' : req.user.local.email }, function(err, preference) {
                if (err)
                    throw err;
                findCategories(function(categories){
                    renderDefault(
                        preference,
                        categories,
                        res
                    );
                })
			});
		});	
	});

	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

// =============================================================================
// Post ========================================================================
// =============================================================================

	// locally --------------------------------
		// Post ===============================
		// save/update the post
		app.post('/save', isLoggedIn, function(req, res) {
			console.log(req.body);
			// asynchronous
	        process.nextTick(function() {
                Post.findOne({ 'title' :  req.body.Title }, function(err, post) {
                    // if there are any errors, return the error
                    if (err){
                        throw err;
                    	response(true,false);
                    }         


                    // check to see if there is already a post with that title
                    if (post) {
                        findCategories(function(categories){
                            renderSave(false,categories,true,req,res,post._id);
                        });
                    } else {
                        // create the post
                        var newPost         = new Post();
                        newPost.category    = req.body.Category;
                    	newPost.title       = req.body.Title;
                        newPost.description = req.body.Description;
                        newPost.post        = req.body.Post;
                        newPost.type        = req.body.Mode;
                        newPost.tags        = req.body.Tags.split(",");
                        newPost.created     = new Date().toISOString();
                        newPost.Author      = req.user.local.email;

                        newPost.save(function(err) {
                            if (err){
                                throw err;
                            	response(true,false,req);
                            }
                           
                            findCategories(function(categories){
                                renderSave(false,categories,false,req,res,undefined);
                            });
                        });
                    }
                });
			});
		});

        // Post ===============================
        // save/update the post
        app.post('/update', isLoggedIn, function(req, res) {
            // asynchronous
            process.nextTick(function() {
                Post.findById(req.body.Id, function (err, doc) {
                    if (err){
                        throw err;
                        response(true,req);
                    }

                    doc.category    = req.body.Category,
                    doc.title       = req.body.Title,
                    doc.description = req.body.Description,
                    doc.post        = req.body.Post,
                    doc.type        = req.body.Mode,
                    doc.tags        = req.body.Tags.split(","),
                    doc.created     = new Date().toISOString(),
                    doc.Author      = req.user.local.email,
                    
                    findCategories(function(categories){
                        doc.save(renderSave(false,categories,false,req,res,doc._id));
                    });
                });
            });
        });

        
        // Update User settings ================
        // save/update the user settings
        app.post('/updateUser', isLoggedIn, function(req, res) {
            // asynchronous
            process.nextTick(function() {
                User.findOne({ 'local.email' : req.body.User },'local.admin', function(err, user) {
                    if (err)
                        throw err;
                    console.log(req.body);
                    if(req.body.Admin==='on'){
                        user.local.admin = true;
                    }else{
                        user.local.admin = false;
                    }

                    if(req.body.Locked==='on'){
                        user.local.locked = true;
                    }else{
                        user.local.locked = false;
                    }

                    user.save(function(){
                        if (err)
                            throw err;
                        User.find({},'local.admin local.locked local.email' , function(err,allUser){
                            if (err)
                                throw err;
                            //console.log(allUser);
                            res.render('profile.ejs', {
                                user    : req.user,
                                admin   : user.local.admin,
                                allUser : allUser
                            });
                        });
                    });
                });
            });
        });

        // Post ===============================
        // save/update the post
        app.post('/storeTheme', isLoggedIn, function(req, res) {
            console.log(req.body);
            // asynchronous
            process.nextTick(function() {
                Preference.findOne({ 'preference.email' : req.user.local.email }, function (err, doc) {
                    if (err){
                        console.log(err);
                        throw err;
                        response(true,req);
                    }
                    console.log(req.body.Theme);
                    doc.preference.editor      = req.body.Theme,
                    findCategories(function(categories){
                        doc.save(renderSave(false,categories,false,req,res,-1));
                    });
                });
            });
        });
        
		// Search ============================
		// save/update the post
		app.post('/search', isLoggedIn, function(req, res) {
            //if search string is empty return all posts
                if (req.body.searchTerm === ''){
                    Post.find({}, function (err, output) {
                        if (err){
                            console.log(err);
                        }
                        findCategories(function(categories){
                            renderSearch(output,categories,req,res);
                        });
                    });
                }else{
                    Post.textSearch(req.body.searchTerm,{project : 'title description'}, function (err, output) {
                        if (err){
                            console.log(err);
                        }
                        if(output.results.length !== 0){
                            processArray(0,output.results,req,res,renderSearch);
                        }else{
                            findCategories(function(categories){
                                renderSearch([],categories,req,res);
                            });
                        }
                    });
                }
		});

        // Select ============================
        // Select a post from search list
        app.post('/select', isLoggedIn, function(req, res) {
            //Get back search results
            if (req.body.searchTerm === ''){
                Post.find({}, function (err, output) {
                    if (err){
                        console.log(err);
                    }
                    findCategories(function(categories){
                        renderSelect(output,categories,req,res);
                    });
                });
            }else{
                Post.textSearch(req.body.searchTerm,{project : 'title description'}, function (err, output) {
                    if (err){
                        console.log(err);
                    }
                    processArray(0,output.results,req,res,renderSelect);
                    
                });
            }
        });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form
		app.get('/login', function(req, res) {
			res.render('login.ejs', { message: req.flash('loginMessage') });
		});

		// process the login form
		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/post', // redirect to the secure profile section
			failureRedirect : '/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

		// SIGNUP =================================
		// show the signup form
		app.get('/signup', function(req, res) {
			res.render('signup.ejs', { message: req.flash('signupMessage') });
		});

		// process the signup form
		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/post', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

	// locally --------------------------------
		app.get('/connect/local', function(req, res) {
			res.render('connect-local.ejs', { message: req.flash('loginMessage') });
		});
		app.post('/connect/local', passport.authenticate('local-signup', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', isLoggedIn, function(req, res) {
		var user            = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

};


//***************HELPER*************************

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
	res.redirect('/');
}

//remove score and and nested obj: from array
function processArray(index, array, req, res, cb){

    array[index] = array[index].obj;
    //check if last item index/item is reached
    if(index+1 === array.length){
        findCategories(function(categories){
            cb(array,categories,req,res);
        });
    }else{
        processArray(index+1,array, req, res, cb);
    }
}

//render default post page
function renderDefault(data,categories,res){
    var files = fs.readdirSync('./public/ace/src-min/');
    //console.log(data);
    res.render('post.ejs', {
        searchTerm  : '',
        category    : '',
        categories  : categories, 
        title       : '',
        description : '',
        type        : '',
        post        : '',
        tags        : '',
        result      : undefined,
        theme       : files,
        editor      : data.preference.editor,
        mode        : data.preference.mainLanguage
    });
}

//render page after search based on retreived data
function renderSearch(data,categories,req,res){
    var files = fs.readdirSync('./public/ace/src-min/');
    res.render('post.ejs', { 
        searchTerm  : req.body.searchTerm,
        category    : '',
        categories  : categories,
        title       : '',
        description : '',
        post        : '',
        tags        : '',
        result      : data,
        theme       : files,
        selID       : -1,
        editor      : req.body.Theme,
        mode        : req.body.Mode
    });
}

//render page after select based on retreived data
function renderSelect(data,categories,req,res){
    //find seleted post for rendering
    Post.findById(req.body.Select, function (err, result) {
        if (err){
            console.log(err);
        }
        console.log(result);
        var files = fs.readdirSync('./public/ace/src-min/');
        res.render('post.ejs', { 
            searchTerm  : req.body.searchTerm,
            category    : result.category,
            categories  : categories,
            title       : result.title,
            description : result.description,
            post        : result.post,
            tags        : result.tags,
            result      : data,
            theme       : files,
            selID       : req.body.selID,
            editor      : req.body.Theme,
            mode        : result.type,
        });
    });
}

function renderSave(err,categories,exists,req,res,id){
    var files = fs.readdirSync('./public/ace/src-min/');
    //error and exists need to be finished(Reporting to website)
    res.render('post.ejs', { 
        searchTerm  : '',
        category    : req.body.Category,
        categories  : categories,
        title       : req.body.Title,
        description : req.body.Description,
        post        : req.body.Post,
        tags        : req.body.Tags,
        result      : undefined,
        theme       : files,
        editor      : req.body.Theme,
        mode        : req.body.Mode,
        id          : id,
        exists      : exists
    });
}

function findCategories(cb){
    Post.find({}, 'category', function (err, categories) {
        if (err)
            throw err;
        cb(_.uniq(_.map(categories, function(element){ return element.category;})));
    }); 
}
