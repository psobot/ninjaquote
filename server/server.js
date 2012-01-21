/*
 * WhoSaidIt
 * server.js
 */

var express = require('express');
var redis = require("redis");
var opengraph = require('./opengraph');

var app = express.createServer();
app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});

var db = redis.createClient();
db.on("error", function (err) {
    console.log("DB Error:" + err);
});

var page_size = 250;

var get_random_friends = function(token, num, callback, error) {
    var query = 'SELECT+uid2+FROM+friend+WHERE+uid1=me()';
    opengraph.fql(query, token, function (res) {
        if ((res == null) || (res.data == null) || (res.data.length < num)) {
            error();
        }
        else {
            var friends_ids = new Array();
            for (var i = 0; i < num; i++) {
                var friend_id = res.data[Math.floor(Math.random() * res.data.length)];
                if (friends_ids.indexOf(friend_id.uid2) == -1) {
                    friends_ids.push(friend_id.uid2);
                }
                else {
                    i--;
                }
            }
            var query = 'SELECT+uid,first_name,last_name+FROM+user+WHERE+';
            for (var i = 0; i < friends_ids.length; i++) {
                query = query + "uid=" + friends_ids[i];
                if (i < friends_ids.length - 1) {
                    query = query + '+OR+';
                }
            }
            opengraph.fql(query, token, function (res) {
                if ((res == null) || (res.data == null) || (res.data.length != num)) {
                    error();
                }
                else {
                    callback(res.data);
                }
            });
        }
    });
};

var get_random_quote = function(token, id, callback, error) {
    var query = 'SELECT+uid,status_id,message+FROM+status+WHERE+uid='+id;
    opengraph.fql(query, token, function (res) {
        if ((res == null) || (res.data == null) || (res.data.length < 1)) {
            error();
        }
        else {
            var entry = res.data[Math.floor(Math.random() * res.data.length)];
            callback(entry);
        }
    });
};

var get_entry = function(token, callback, error) {
    get_random_friends(token, 2, function (friends) {
        var chosen_one = (Math.floor(Math.random() * 2) == 0) ? friends[0] : friends[1];
        get_random_quote(token, chosen_one.uid, function (quote) {
            callback(friends[0], friends[1], quote);
        }, function () {
            console.log("retry - could not retrieve quote");
            get_entry(token, callback, error);
        });
    }, function () {
        console.log("retry - could not retrieve friends");
        get_entry(token, callback, error);
    });
};

var correct_reponse = function(token, status_id, response, callback, error) {
    /*
    db.hset("user:alex", entry.uid.toString()+"-t", 1);
    db.hget("user:alex", entry.uid.toString()+"-t", function (err, saved_obj) {
        console.dir(parseInt(saved_obj) + 1);
    });
    
    db.hset("user:alex", entry.uid.toString()+"-f", 1);
    db.hget("user:alex", entry.uid.toString()+"-f", function (err, saved_obj) {
        console.dir(parseInt(saved_obj) + 1);
    });
    */
};

app.get('/get_entry', function(req, res) {
    get_entry(req.query.token, function (friend1, friend2, quote) {
        res.json({
            friend1: friend1,
            friend2: friend2,
            quote: quote
        });
    }, function () {
        res.json({
            error : "An error occurred"
        });
    });
});

app.get('/response', function(req, res) {
    correct_reponse(req.query.token, req.query.status_id, req.query.user, function (correct_user) {
        res.json(correct_user);
    }, function () {
        res.json({
            error : "An error occurred"
        });
    });
});

app.listen(3000);
