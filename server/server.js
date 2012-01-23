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
var recursion_limit = 5;

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

var get_entry = function(token, callback, error, iteration) {
    if (iteration > recursion_limit){
        error();
    } else {
        get_random_friends(token, 2, function (friends) {
            var chosen_one = (Math.floor(Math.random() * 2) == 0) ? friends[0] : friends[1];
            get_random_quote(token, chosen_one.uid, function (quote) {
                callback(friends[0], friends[1], quote);
            }, function () {
                console.log("retry - could not retrieve quote, iteration "+iteration);
                get_entry(token, callback, error, iteration+1);
            });
        }, function () {
            console.log("retry - could not retrieve friends, iteration "+iteration);
            get_entry(token, callback, error, iteration+1);
        });
    }
};

var correct_reponse = function(my_uid, post_uid, correct, callback, error) {
    var key = (correct == 'true') ? post_uid+"-t" : post_uid+"-f";
    db.hget("user:" + my_uid, key, function (err, saved_obj) {
        if (saved_obj == null) {
            db.hset("user:" + my_uid, key, 1);
        }
        else {
            db.hset("user:" + my_uid, key, parseInt(saved_obj) + 1);
        }
        
        db.hget("user:" + my_uid, post_uid+"-t", function (err, saved_obj_t) {
            db.hget("user:" + my_uid, post_uid+"-f", function (err, saved_obj_f) {
                if (saved_obj_t == null) {
                    saved_obj_t = '0';
                }
                if (saved_obj_f == null) {
                    saved_obj_f = '0';
                }
                callback(parseInt(saved_obj_t), parseInt(saved_obj_f));
            });
        });
    });
};

var reponses = function(my_uid, callback, error) {
    db.hgetall("user:" + my_uid, function (err, saved_obj) {
        console.dir(saved_obj);
        callback(saved_obj);
    });
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
    }, 0);
});

app.get('/response', function(req, res) {
    correct_reponse(req.query.my_uid, req.query.post_uid, req.query.correct, function (t_count, f_count) {
        res.json({
            t : t_count,
            f : f_count
        });
    }, function () {
        res.json({
            error : "An error occurred"
        });
    });
});

app.get('/scores', function(req, res) {
    reponses(req.query.my_uid, function (results) {
        res.json(results);
    }, function () {
        res.json({
            error : "An error occurred"
        });
    });
});

app.listen(3000);
