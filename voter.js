'use strict';
var fs = require('fs'),
    saveFile = './known-games.txt';

module.exports = function(io) {
    var games = loadGames();
    var router = require('express').Router();

    function gameIsKnown(title) {
        return games.some(function(game) {
            return game.title === title;
        });
    }

    function normalize(game) {
        return String(game).trim();
    }

    io.on('connection', function(socket) {
        socket.emit('update', games);

        function update() {
            saveGames(games);
            io.emit('update', games);
        }

        socket.on('reset', function() {
            //reset all votes to 0;
            games.forEach(function(game) {
                game.voters = [];
            });
            update();
        });

        function getTarget(data) {
            return games.find(function(game) {
                return game.title === data.title;
            });
        }

        socket.on('vote', function(data) {
            console.log(`vote for ${data.title}`);
            data.user = normalize(data.user);
            if (data.user) {
                var target = getTarget(data);

                if (target.voters.indexOf(data.user) === -1) {
                    target.voters.push(data.user);
                    update();
                }
            }
        });

        socket.on('unvote', function(data) {
            console.log(`unvote for ${data.title}`);
            var target = getTarget(data),
                index = target.voters.indexOf(data.user);

            if (index !== -1) {
                target.voters.splice(index, 1);
                update();
            }
        });

        socket.on('remove', function(title) {
            title = normalize(title);
            var index = games.findIndex(function(game) {
                return game.title === title;
            });

            if (index !== -1) {
                console.log(`removing ${title}`);
                games.splice(index, 1);
                update();
            }
        });

        socket.on('new', function(title) {
            title = normalize(title);
            if (title && !gameIsKnown(title)) {
                games.push({
                    title: title,
                    voters: []
                });

                update();
                console.log(`new game ${title}`);
            }
        });
    });

    return router;
};

function loadGames() {
    try {
        return JSON.parse(fs.readFileSync(saveFile).toString());
    }catch(e) {
        return [];
    }
}

var savePromise = Promise.resolve();
function saveGames(games) {
    console.log('save queued');
    var dump = JSON.stringify(games, null, 4);

    //queue up saves so we don't try writing before the last one finishes
    savePromise.then(function() {
        return new Promise(function(resolve) {
            console.log('saving');
            fs.writeFile(
                saveFile,
                dump,
                function (err) {
                    if (err) {
                        console.log(err);
                    }
                    resolve();
                }
            );
        })
    })
}