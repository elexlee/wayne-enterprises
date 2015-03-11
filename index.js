var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var pg = require("pg");
var mailer = require("./mailer");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var conString = process.env["DATABASE_URL"];
var db;

pg.connect(conString, function(err, client) {
	if (err) {
	console.log("db not defined");
    console.log(err);
  } else {
    db = client;
    mailer.db = db;
	mailer.getEmailTemplates(mailer.populateTemplatesArray);
    mailer.queueMail();
  }
});

//logging middleware
app.use(function (req, res, next) {
	console.log("Request at ", req.path);
	next();
});
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/static'));
app.set('view engine', 'ejs');

//Respond to POST requests
app.post("/submit", function (req, res, next) {
	console.log(req.body);
	if (validateEmail(req.body.email)) {
		db.query("INSERT INTO users (email) VALUES ($1);", [req.body.email], function (err, result) {
		    if (err) {
		      res.status(500).send(err);
		    } else {
		    	res.sendFile(__dirname + '/views/submit.html');
		    	mailer.sendInitialMessage(db);
		    }
	  	});
	}
	else {
		res.send("<p>" + req.body["email"] + "is not a valid email address</p>");
	}
});

app.get("/users", function (req, res) {
	db.query("SELECT * FROM users", function (err, result) {
		if (err) {
    		res.status(500).send(err);
    	} else {
    		var users = result.rows;
      		res.render("users", {"users" : users});
      	}
	});
});

function validateEmail(email) { 
    var regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regEx.test(email);
} 


var port = process.env["PORT"];
app.listen(port);

// EJS = embedded javascript