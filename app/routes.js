// load up the post model
var Post       = require('../app/models/post');
var Preference = require('../app/models/preference');
var fs = require('fs');
module.exports = function(app, passport) {

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/', function(req, res) {
		res.render('index.ejs');
	});

	// PROFILE SECTION =========================
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user
		});
	});

	// POST SECTION =========================
	app.get('/post', isLoggedIn, function(req, res) {
        var files = fs.readdirSync('./public/ace/src-min/');
        process.nextTick(function() {
	        Preference.findOne({ 'preference.email' : req.user.local.email }, function(err, preference) {
	        	if (err)
               		throw err;

				res.render('post.ejs', {
					srchTerm	: '',
					category 	: '',
					title 		: '',
		            description : '',
					type 		: '',
					post 		: '',
					tags		: '',
		            result      : undefined,
		            theme       : files,
		            editor 		: preference.preference.editor,
		            mode 		: preference.preference.mainLanguage
				});
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
                    	console.log(err);
                    	response(true,false);
                    }                       

                    // check to see if theres already a post with that title
                    if (post) {
                        console.log('post already exists');
                        response(false,true,req);
                    } else {
                        // create the post
                        var newPost            	 = new Post();
                        console.log(newPost);
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
                            	console.log(err);
                            	throw err;
                            	response(true,false,req);
                            }
                                
                            console.log(newPost);
                            response(false,false,req);
                        });
                    }
                });
	            

				var response = function(err,exists,req){
                    var files = fs.readdirSync('./public/ace/src-min/');
					//error and exists need to be finished(Reporting to website)
					res.render('post.ejs', { 
						srchTerm	: '',
						category 	: req.body.Category,
						title 		: req.body.Title,
                        description : req.body.Description,
						type 		: req.body.Type,
						post 		: req.body.Post,
						tags		: req.body.Tags,
                        result      : undefined,
                        theme       : files,
                        editor 		: req.body.Theme,
		            	mode 		: req.body.Mode
					});
				};
			});
		});

		// Search ============================
		// save/update the post
		app.post('/search', isLoggedIn, function(req, res) {
			console.log(req.body);
             // Use post model for search
          
            Post.textSearch(req.body.srchTerm,{project : 'title description'}, function (err, output) {
                if (err){
                    console.log(err);
                }
            
                var files = fs.readdirSync('./public/ace/src-min/');
    			res.render('post.ejs', { 
    				srchTerm	: req.body.srchTerm,
    				category 	: '',
    				title 		: '',
                    description : '',
    				type 		: '',
    				post 		: '',
    				tags		: '',
                    result      : output.results,
                    theme       : files,
                    selID       : -1,
                    editor 		: req.body.themeSearch,
		            mode 		: req.body.modeSearch
    			});
            });
		});

        // Select ============================
        // Select a post from search list
        app.post('/select', isLoggedIn, function(req, res) {
            console.log(req.body);

            //Get back search results
            Post.textSearch(req.body.srchTerm,{project : 'title description'}, function (err, output) {
                if (err){
                    console.log(err);
                }
                console.log(output);
                //find seleted post for rendering
                Post.findById(req.body.select, function (err, result) {
                    if (err){
                        console.log(err);
                    }
                    console.log(result);
                    var files = fs.readdirSync('./public/ace/src-min/');
                    res.render('post.ejs', { 
                        srchTerm    : req.body.srchTerm,
                        category    : result.category,
                        title       : result.title,
                        description : result.description,
                        type        : result.type,
                        post        : result.post,
                        tags        : result.tags,
                        result      : output.results,
                        theme       : files,
                        selID       : req.body.selID,
                        editor 		: req.body.themeSel,
		           		mode 		: req.body.modeSel
                    });
                });
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
			successRedirect : '/profile', // redirect to the secure profile section
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
			successRedirect : '/profile', // redirect to the secure profile section
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

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}
