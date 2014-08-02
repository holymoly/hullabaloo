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
        //console.log(req.user.email);
        User.findOne({ 'email' : req.user.email },'admin', function(err, user) {
            if (err)
                throw err;
            User.find({},'admin locked email' , function(err,allUser){
                if (err)
                    throw err;
                Preference.find({},'newsletter email', function(err, newsletter) {
                    if (err)
                        throw err;
                    console.log(newsletter);
                    res.render('profile.ejs', {
                        user        : req.user,
                        admin       : user.admin,
                        allUser     : allUser,
                        newsletter  : newsletter
                    });
                });
            });
        });
	});

	// POST SECTION =========================
	app.get('/post', isLoggedIn, function(req, res) {
        process.nextTick(function() {
	        Preference.findOne({ 'email' : req.user.email }, function(err, data) {
                if (err)
                    throw err;
                findCategories(function(categories){
                    renderPost(
                        '',
                        '',
                        categories,
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        data.editor,
                        data.mainLanguage,
                        '',  
                        '',           
                        res);
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
                            renderPost(
                                '',
                                req.body.Category,
                                categories,
                                req.body.Title,
                                req.body.Description,
                                req.body.Post,
                                req.body.Tags,
                                undefined,
                                '',
                                req.body.Theme,
                                req.body.Mode,
                                true, 
                                post._id,               
                                res);
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
                        newPost.Author      = req.user.email;

                        newPost.save(function(err) {
                            if (err){
                                throw err;
                            	response(true,false,req);
                            }
                           
                            findCategories(function(categories){
                                renderPost(
                                    '',
                                    req.body.Category,
                                    categories,
                                    req.body.Title,
                                    req.body.Description,
                                    req.body.Post,
                                    req.body.Tags,
                                    undefined,
                                    '',
                                    req.body.Theme,
                                    newPost.type,
                                    false, 
                                    undefined,               
                                    res);
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
                    doc.Author      = req.user.email,
                    
                    findCategories(function(categories){
                        doc.save(
                            renderPost(
                                    '',
                                    req.body.Category,
                                    categories,
                                    req.body.Title,
                                    req.body.Description,
                                    req.body.Post,
                                    req.body.Tags,
                                    undefined,
                                    '',
                                    req.body.Theme,
                                    doc.type,
                                    false, 
                                    undefined,               
                                    res)
                        );
                    });
                });
            });
        });

        
        // Update User settings ================
        // save/update the user settings
        app.post('/updateUser', isLoggedIn, function(req, res) {
            // asynchronous
            process.nextTick(function() {
                User.findOne({ 'email' : req.body.User },'admin', function(err, user) {
                    if (err)
                        throw err;

                    if(req.body.Admin==='on'){
                        user.admin = true;
                    }else{
                        user.admin = false;
                    }

                    if(req.body.Locked==='on'){
                        user.locked = true;
                    }else{
                        user.locked = false;
                    }

                    Preference.findOne({ 'email' : req.body.User }, function(err, preference) {
                        if (err)
                            throw err;

                        if(req.body.Newsletter==='on'){
                            preference.newsletter = true;
                        }else{
                            preference.newsletter = false;
                        }
                        preference.save(function(){
                            if (err)
                                throw err;
                        });
                        user.save(function(){
                            if (err)
                                throw err;
                            User.find({},'admin locked email' , function(err,allUser){
                                if (err)
                                    throw err;

                                Preference.find({},'newsletter email', function(err, newsletter) {
                                    if (err)
                                        throw err;
                                    res.render('profile.ejs', {
                                        user        : req.user,
                                        admin       : user.admin,
                                        allUser     : allUser,
                                        newsletter  : newsletter
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        // Update User settings ================
        // save/update the user settings
        app.post('/updateNewsletter', isLoggedIn, function(req, res) {
            // asynchronous
            
            process.nextTick(function() {
                User.findOne({ 'email' : req.body.User },'admin', function(err, user) {
                    if (err)
                        throw err;

                    Preference.findOne({ 'email' : req.body.User }, function(err, preference) {
                        if (err)
                            throw err;
                        if(req.body.Newsletter==='on'){
                            preference.newsletter = true;
                        }else{
                            preference.newsletter = false;
                        }
                        preference.save(function(){
                            if (err)
                                throw err;
                        });

                        User.find({},'admin locked email' , function(err,allUser){
                            if (err)
                                throw err;

                            Preference.find({},'newsletter email', function(err, newsletter) {
                                if (err)
                                    throw err;
                                res.render('profile.ejs', {
                                    user        : req.user,
                                    admin       : user.admin,
                                    allUser     : allUser,
                                    newsletter  : newsletter
                                });
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
                Preference.findOne({ 'email' : req.user.email }, function (err, doc) {
                    if (err){
                        console.log(err);
                        throw err;
                        response(true,req);
                    }
                    console.log(req.body.Theme);
                    doc.editor      = req.body.Theme,
                    findCategories(function(categories){
                        doc.save(
                            renderPost(
                                    '',
                                    req.body.Category,
                                    categories,
                                    req.body.Title,
                                    req.body.Description,
                                    req.body.Post,
                                    req.body.Tags,
                                    undefined,
                                    '',
                                    req.body.Theme,
                                    req.body.Mode,
                                    false, 
                                    -1,              
                                    res)
                        );
                    });
                });
            });
        });
        
		// Search ============================
		// save/update the post
		app.post('/search', isLoggedIn, function(req, res) {
            //if search string is empty return all posts
            console.log(req.body);
                if (req.body.searchTerm === ''){
                    Post.find({}, function (err, result) {
                        if (err){
                            console.log(err);
                        }
                        findCategories(function(categories){
                            render(req.body.searchTerm,categories,result,req.body.Theme,req.body.Mode,res);
                        });
                    });
                }else{
                    Post.textSearch(req.body.searchTerm,{project : 'title description'}, function (err, output) {
                        if (err){
                            console.log(err);
                        }
                        if(output.results.length !== 0){
                            processArray(0,output.results,req,res,render);
                        }else{
                            findCategories(function(categories){
                                render(req.body.searchTerm,categories,[],req.body.Theme,req.body.Mode,res);
                            });
                        }
                    });
                }

                function render(searchTerm,categories,result,theme,mode,res){
                    renderPost(
                                searchTerm,
                                '',
                                categories,
                                '',
                                '',
                                '',
                                '',
                                result,
                                -1,
                                theme,
                                mode,
                                '', 
                                '',                
                                res);
                }
		});

        // Select ============================
        // Select a post from search list
        app.post('/select', isLoggedIn, function(req, res) {
            Post.findById(req.body.Select, function (err, post) {
                if (err){
                    console.log(err);
                }
                //Get back search results
                if (req.body.searchTerm === ''){
                    Post.find({}, function (err, result) {
                        if (err){
                            console.log(err);
                        }
                        findCategories(function(categories){
                            render(req.body.searchTerm,categories,result,req.body.Theme,req.body.Mode,res);
                        });
                    });
                }else{
                    Post.textSearch(req.body.searchTerm,{project : 'title description'}, function (err, result) {
                        if (err){
                            console.log(err);
                        }
                        processArray(0,result.results,req,res,render);
                        
                    });
                }

                function render(searchTerm,categories,result,theme,mode,res){
                    renderPost(
                                searchTerm,
                                post.category,
                                categories,
                                post.title,
                                post.description,
                                post.post,
                                post.tags,
                                result,
                                req.body.selID,
                                theme,
                                post.type,
                                '', 
                                '',                
                                res);
                }
            }); 
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
        User.findOne({ 'email' : req.user.email }, function(err, user) {
            if (err)
                throw err;
            user.remove();
        });
        Preference.findOne({ 'email' : req.user.email }, function(err, preference) {
            if (err)
                throw err;
            preference.remove();
        });
        res.redirect('/');
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
            cb(req.body.searchTerm,categories,array,req.body.Theme,req.body.Mode,res);
        });
    }else{
        processArray(index+1,array, req, res, cb);
    }
}

//render default post page
function renderPost(searchTerm,category,categories,title,description,post,tags,result,selID,editor,mode,exists,id,res){
    var themes = fs.readdirSync('./public/ace/src-min/');
    console.log(mode);
    res.render('post.ejs', {
        searchTerm  : searchTerm,
        category    : category,
        categories  : categories, 
        title       : title,
        description : description,
        post        : post,
        tags        : tags,
        result      : result,
        theme       : themes,
        selID       : selID,
        editor      : editor,
        mode        : mode,
        exists      : exists,
        id          : id,
    });
}

function findCategories(cb){
    Post.find({}, 'category', function (err, categories) {
        if (err)
            throw err;
        cb(_.uniq(_.map(categories, function(element){ return element.category;})));
    }); 
}
