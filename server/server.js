/*
 * WhoSaidIt
 * server.js
 */

var https = require('https');
var express = require('express');

var app = express.createServer();

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

var get_random_friend = function(token, probability, callback) {
    var path = '/me/friends?access_token=' + token;
    graph_api(path, function (ret) {
        var offset = Math.floor(Math.random() * ret.data.length);
        var path = '/' + ret.data[offset].id + '?access_token=' + token;
        graph_api(path, function (ret) {
            callback(ret);
        });
    });
};

var get_random_quote = function(token, id, probability, callback) {
    var path = '/' + id + '/statuses?access_token=' + token;
    graph_api(path, function (ret) {
        var offset = Math.floor(Math.random() * ret.data.length);
        callback(ret.data[offset]);
    });
};

var get_entry = function(token, callback) {
    get_random_friend(token, 1, function (person) {
        var friend1 = person;
        get_random_friend(token, 1, function (person) {
            var friend2 = person;
            get_random_quote(token, friend1.id, 1, function (quote) {
                if (quote == undefined) {
                  console.log("try");
                    get_entry(token, callback)
                }
                else {
                    callback(friend1, friend2, quote);
                }
            });
        });
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
