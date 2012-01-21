/*
 * WhoSaidIt
 * server.js
 */

var https = require('https');
var express = require('express');

var app = express.createServer();

var page_size = 50;

var graph_api = function(path, callback) {
    var options = {
        host: 'graph.facebook.com',
        port: 443,
        path: path,
        method: 'GET'
    };
    
    var req = https.request(options, function(res) {
        var data = '';
        
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            callback(JSON.parse(data));
        });
    });
    req.end();
    
    req.on('error', function(e) {
        callback(null);
    });
};

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});

app.get('/', function(req, res) {
    res.redirect("/index.html");
});

var get_random_friend = function(token, probability, page, callback) {
    var path = '/me/friends?access_token=' + token + '&limit=10' + '&offset=' + (page * page_size);
    graph_api(path, function (ret) {
        if (ret == null) {
            callback(null);
        }
        
        if (ret.data.length == 0) {
            get_random_friend(token, 1.0, Math.floor(Math.random() * page), callback); 
        }
        else if (Math.random() > probability) {
            get_random_friend(token, (probability * 0.5), page + 1, callback); 
        }
        else {
            var offset = Math.floor(Math.random() * ret.data.length);
            var path = '/' + ret.data[offset].id + '?access_token=' + token;
            graph_api(path, function (ret) {
                callback(ret);
            });
        }
    });
};

var get_random_quote = function(token, id, probability, callback) {
    var path = '/' + id + '/statuses?access_token=' + token;
    graph_api(path, function (ret) {
        if ((ret == null) || (ret.data.length == 0)) {
            callback(null);
        }
        else {
            var offset = Math.floor(Math.random() * ret.data.length);
            callback(ret.data[offset]);
        }
    });
};

var get_entry = function(token, callback) {
    get_random_friend(token, 0.5, 0, function (person) {
        if (person == null) {
            console.log("retry - bad person");
            get_entry(token, callback);
        }
        else {
            var friend1 = person;
            get_random_friend(token, 0.5, 0, function (person) {
                if ((person == null) || (person.id == friend1.id)) {
                    console.log("retry - bad person");
                    get_entry(token, callback);
                }
                else {
                    var friend2 = person;
                    var chosen_one = (Math.floor(Math.random() * 2) == 0) ? friend1 : friend2;
                    
                    get_random_quote(token, chosen_one.id, 1, function (quote) {
                        if ((quote == undefined) || (quote == null)) {
                            console.log("retry - bad quote");
                            get_entry(token, callback);
                        }
                        else {
                            console.log("done");
                            callback(friend1, friend2, quote);
                        }
                    });
                }
            });
        }
    });
};

app.get('/get_entry', function(req, res) {
    get_entry(req.query.token, function (friend1, friend2, quote) {
        console.log('sent');
        res.json({
            friend1: friend1,
            friend2: friend2,
            quote: quote
        });
    });
});

app.listen(3000);
