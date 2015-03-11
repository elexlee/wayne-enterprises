var fs = require('fs');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('_BArrEkgdN35APiBHkFK4A');


var mailer = {};

mailer.queueMail = function() {
	mailer.db.query("SELECT email FROM users WHERE last_email_sent <= now() - interval '1 day';", [], function (err, result) {
		if (err) {
			console.log(err);
		}
		else {
			for (var i = 0; i < result.rows.length; i++) {
				mailer.db.query("UPDATE users SET sequence = 'Q2' WHERE email = ($1);", [result.rows[i].email]);
			}
			mailer.sendQueuedMailTwo();
		}
	});
	mailer.db.query("SELECT email FROM users WHERE last_email_sent <= now() - interval '7 days';", [], function (err, result) {
		if (err) {
			console.log(err);
		}
		else {
			for (var j = 0; j < result.rows.length; j++) {
			mailer.db.query("UPDATE users SET sequence = 'Q3' WHERE email = ($1);", [result.rows[j].email]);
			mailer.sendQueuedMailThree();
		}
	});
}

mailer.sendQueuedMailTwo = function() {
	mailer.db.query("SELECT email, sequence FROM users WHERE sequence = 'Q2';", [], function (err, result) {
		if (err) {
			console.log("error sendQueuedMail");
			throw err;
		} else {
			mailer.secondEmail(result.rows);
		}
	});
}

mailer.sendQueuedMailThree = function() {
	mailer.db.query("SELECT email, sequence FROM users WHERE sequence = 'Q3';", [], function (err, result) {
		if (err) {
	    	console.log("error sendQueuedMail");
	    	throw err;
		} else {
			mailer.thirdEmail(result.rows);
		}
	});
}

mailer.sendInitialMessage = function() {
	//Query for new uesrs
	mailer.db.query("SELECT email, sequence FROM users WHERE sequence IS NULL;", [], function (err, result) {
    	if (err) {
    		console.log("error sendInitialMessage");
    	} else {
    		mailer.db.query("UPDATE users SET sequence = 'Q1' WHERE sequence IS NULL;");
    		mailer.firstEmail(result.rows);
    	}
  	})
	//Send the email to new users using mandrill
}

mailer.firstEmail = function(users) {
	var messageBody = mailer.messageBodyFromSequence('Q1');
	// var message = {
	// 	"template_name": "email_Q1",
	// 	"template_content": [
 //    		{
 //        		"name": "Welcome",
 //        		"content": messageBody.toString()
 //    		}
	// 	],
	// 	"message": {
 //    		"from_email":"newsletter@WayneEnterprises.com",
 //    		"to": users,
 //    		"subject": "Wayne Enterprises R&D",
	// 	}		
	// }
	// console.log(message);
	var message = {
			"html": messageBody.toString(),
		    "subject": "Wayne Enterprises R&D",
		    "from_email": "newsletter@WayneEnterprises.com",
		    "from_name": "Lucius Fox",
		    "to": users
	    }
	mailer.sendEmail(message);
	mailer.db.query("UPDATE users SET sequence = 'S1' WHERE sequence = 'Q1';");
	mailer.db.query("UPDATE users SET last_email_sent = current_timestamp WHERE sequence = 'S1';");
}


mailer.secondEmail = function(users) {
	var messageBody = mailer.messageBodyFromSequence('Q2');
	// var message = {
	// 	"template_name": "email_Q2",
	// 	"template_content": [
 //    		{
 //        		"name": "Tumbler",
 //        		"content": messageBody.toString()
 //    		}
	// 	],
	// 	"message": {
 //    		"from_email":"newsletter@WayneEnterprises.com",
 //    		"to": users,
 //    		"subject": "Wayne Enterprises R&D",
	// 	}		
	// }
	var message = {
			"html": messageBody.toString(),
		    "subject": "Wayne Enterprises R&D",
		    "from_email": "newsletter@WayneEnterprises.com",
		    "from_name": "Lucius Fox",
		    "to": users
	    }
	mailer.sendEmail(message);
	mailer.db.query("UPDATE users SET sequence = 'S2' WHERE sequence = 'Q2';");
	mailer.db.query("UPDATE users SET last_email_sent = current_timestamp WHERE sequence = 'S2';");
}

mailer.thirdEmail = function(users) {
	var messageBody = mailer.messageBodyFromSequence('Q3');
	// var message = {
	// 	"template_name": "email_Q3",
	// 	"template_content": [
 //    		{
 //        		"name": "Bruce Wayne",
 //        		"content": messageBody.toString()
 //    		}
	// 	],
	// 	"message": {
 //    		"from_email":"newsletter@WayneEnterprises.com",
 //    		"to": users,
 //    		"subject": "Wayne Enterprises R&D",
	// 	}		
	// }
	var message = {
			"html": messageBody.toString(),
		    "subject": "Wayne Enterprises R&D",
		    "from_email": "newsletter@WayneEnterprises.com",
		    "from_name": "Lucius Fox",
		    "to": users
	    }
	mailer.sendEmail(message);
	mailer.db.query("UPDATE users SET sequence = 'S3' WHERE sequence = 'Q3';");
	mailer.db.query("UPDATE users SET last_email_sent = current_timestamp WHERE sequence = 'S3';");
}

mailer.sendEmail = function(message) {
	mandrill_client.messages.send({"message": message, "async": true, "ip_pool": false}, function(result) {
		console.log(result);
	}, function(e) {
	    // Mandrill returns the error as an object with name and message keys
	   console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	});
	// mandrill_client.messages.sendTemplate({"template_name": message.template_name, "template_content": message.template_content, "message": message.message, "async": true, "ip_pool": false}, function(result) {
	// 	console.log(result);
	// }, function(e) {
	//     // Mandrill returns the error as an object with name and message keys
	//    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	// });
}

mailer.messageBodyFromSequence = function(seq) {
	if (seq === 'Q1') {
		return mailer.emailTemplates[0];
	} else if (seq === 'Q2') {
		return mailer.emailTemplates[1];
	} else if (seq === 'Q3') {
		return mailer.emailTemplates[2];
	}
}

mailer.populateTemplatesArray = function(emailTemplates) {
	mailer.emailTemplates = emailTemplates;
}

mailer.getEmailTemplates = function(callback) {
	var count = 0;
	var templates = [];
	fs.readFile('./mail_templates/email_Q1.html', function (err, data) {
		if (err) {
			console.log(err);
		} else {
			count++;
			templates[0] = data;
			if (count === 3) {
				callback(templates);
			}
		}
	});
	fs.readFile('./mail_templates/email_Q2.html', function (err, data) {
		if (err) {
			console.log(err);
		} else {
			count++;
			templates[1] = data;
			if (count === 3) {
				callback(templates);
			}
		}
	});
	fs.readFile('./mail_templates/email_Q3.html', function (err, data) {
		if (err) {
			console.log(err);
		} else {
			count++;
			templates[2] = data;
			if (count === 3) {
				callback(templates);
			}
		}
	});
}

module.exports = mailer;



