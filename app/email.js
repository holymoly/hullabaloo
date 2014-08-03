var nodemailer = require('nodemailer');
var mailConfig = require('../config/emailAccount.js');
var Preference = require('../app/models/preference');
var schedule = require('node-schedule');
var Post       = require('../app/models/post');
var _ = require("underscore");

//needed for rendering html email
var ejs = require('ejs')
  , fs = require('fs')
  , htmlNewsletter = fs.readFileSync('./email/newsletter.ejs', 'utf8'); 

//**********Setting Date for newsletter email**************
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 1;
rule.hour = 6;
rule.minute = 0;

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    host: mailConfig.newsletter.host,
    port: 25,
    auth: {
        user: mailConfig.newsletter.user,
        pass: mailConfig.newsletter.password
    },
    debug: true
});

//Starting scheduled job
var j = schedule.scheduleJob(rule, function(){
    
    //Get posts of last week
    var oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    var oldPosts = new Post;
    oldPosts.findPostsSince(oneWeekAgo.toISOString(),function(postsSince){
        preference = new Preference;
        preference.findNewsletterUser(function(emails){
            var messageHtml = ejs.render(htmlNewsletter,{ data : postsSince });
            var receiver = _.map(emails, function(element){ return element.email;}).join();

            var mailOptions = {
                from: mailConfig.newsletter.email, // sender address
                bcc: receiver, // list of receivers
                subject: 'hullabaloo news', // Subject line
                //text: postsSince, // plaintext body
                html: messageHtml // html body
            };
             // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                }else{
                    console.log('Message sent: ' + info.response);
                }
            });
        });
    })
});

// create the model for users and expose it to our app
module.exports = transporter;