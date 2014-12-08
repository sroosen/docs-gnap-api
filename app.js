var express = require('express'),
    app = express(),
    _ = require("underscore"),
    request = require('request'),
    cache = require("node-cache");

// create the cache that holds the releases for a repo
var releasesCache = new cache();

// enable CQRS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// proxy and cache for GitHub releases
app.get('/repos/:repoId/releases', function (req, res) {
    var repoId = req.params['repoId'];
    var releases = releasesCache.get(repoId);

    if (!_.isEmpty(releases)) {
        // releases read from cache
        res.type('application/json');
        res.send(releases[repoId]);
    } else {
        // releases not found in cache, load them from the GitHub API
        var requestOptions = {
            url: 'https://e919ac428d6944ff9f32875f3eb66a0521ba1ed5:x-oauth-basic@api.github.com/repos/infrabel/' + repoId + '/releases',
            headers: {
                'User-Agent': 'docs-gnap-api'
            }
        };

        request(requestOptions, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                releasesCache.set(repoId, body, 1800 /* 30 mins*/);
                res.type('application/json');
                res.send(body);
            } else {
                // something went wrong
                res.status(500).send({ error: 'Unable to retrieve releases from GitHub' });
            }
        })
    }
});

// start the server
var port = process.env.port || 1337;
var server = app.listen(port, function () {
    var host = server.address().address
    var port = server.address().port

    console.log('Listening at http://%s:%s', host, port)
});