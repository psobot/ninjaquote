/*
 * WhoSaidIt
 * server.js
 */

var express = require('express');
var opengraph = require('./opengraph');

var app = express.createServer();

var page_size = 250;

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});

var get_random = function(type, token, probability, page, callback, error) {
    var path = '/' + type + '?access_token=' + token + '&limit=' + page_size  + '&offset=' + (page * page_size);
    opengraph.api(path, function (ret) {
        if ((ret == null) || (ret.data.length == 0)) {
            error();
        }
        else if (ret.data.length == 0) {
            get_random(type, token, 1.0, Math.floor(Math.random() * page), callback, error); 
        }
        else if (Math.random() > probability) {
            get_random(type, token, (probability * 0.5), page + 1, callback, function () {
                callback(ret.data[Math.floor(Math.random() * ret.data.length)]);
            }); 
        }
        else {
            callback(ret.data[Math.floor(Math.random() * ret.data.length)]);
        }
    });
};

var get_random_friend = function(token, callback, error) {
    get_random('me/friends', token, 0.5, 0, function(person_entry) {
        var path = '/' + person_entry.id + '?access_token=' + token;
        opengraph.api(path, function (person) {
            callback(person);
        });
    }, error);
};

var get_random_quote = function(token, id, callback, error) {
    get_random(id + '/statuses', token, 0.5, 0, callback, error);
};

var get_entry = function(token, callback, error) {
    get_random_friend(token, function (friend1) {
        get_random_friend(token, function (friend2) {
            if (friend1.id == friend2.id) {
                console.log("retry - duplicate friend 2");
                get_entry(token, callback, error);
            }
            else {
                var chosen_one = (Math.floor(Math.random() * 2) == 0) ? friend1 : friend2;
                get_random_quote(token, chosen_one.id, function (quote) {
                    callback(friend1, friend2, quote);
                }, function() {
                    console.log("retry - bad quote");
                    get_entry(token, callback, error);
                });
            }
        }, function() {
            console.log("retry - bad friend 2");
            get_entry(token, callback, error);
        });
    }, function() {
        console.log("retry - bad friend 1");
        get_entry(token, callback, error);
    });
};

app.get('/get_entry', function(req, res) {
    get_entry(req.query.token, function (friend1, friend2, quote) {
        res.json({
            friend1: friend1,
            friend2: friend2,
            quote: quote
        });
    });
});

app.listen(3000);
