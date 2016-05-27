'use strict';
var fs = require('fs'),
    saveFile = './known-games.txt';

module.exports = function(io) {
    var games = loadGames();
    var router = require('express').Router();

    function gameIsKnown(name) {
        return games.some(function(game) {
            return game.name === name;
        });
    }

    function normalize(game) {
        return String(game).trim();
    }

    io.on('connection', function(socket) {
        socket.emit('update', games);

        function broadcast() {
            io.emit('update', games);
        }

        socket.on('reset', function() {
            //reset all votes to 0;
            games.forEach(function(game) {
                game.votes = 0;
            });
            broadcast();
        });

        function alterVotes(name, inc) {
            var target = games.find(function(game) {
                return game.name === name;
            });
            target.votes = Math.max(0, target.votes + inc);
        }

        socket.on('vote', function(name) {
            console.log(`vote for ${name}`);
            alterVotes(name, 1);
            broadcast();
        });

        socket.on('unvote', function(name) {
            console.log(`unvote for ${name}`);
            alterVotes(name, -1);
            broadcast();
        });

        socket.on('remove', function(name) {
            name = normalize(name);
            var index = games.findIndex(function(game) {
                return game.name === name;
            });
            if (index !== -1) {
                console.log(`removing ${name}`);
                games.splice(index, 1);
                saveGames(games);
                broadcast();
            }
        });

        socket.on('new', function(name) {
            name = normalize(name);
            if (name && !gameIsKnown(name)) {
                games.push({
                    name: name,
                    votes: 0
                });

                saveGames(games);
                broadcast();
                console.log(`new game ${name}`);
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
function saveGames(games) {
    console.log('saving');
    fs.writeFileSync(saveFile, JSON.stringify(games));
}