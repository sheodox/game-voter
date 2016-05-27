(function() {
    'use strict';
    var socket = io.connect();
    socket.on('reconnect', function () {
        location.reload()
    });

    var leader = document.getElementById('leader');

    socket.on('update', function (games) {
        var ul = document.getElementById('games');
        ul.innerHTML = '';
        games.forEach(function(game) {
            var li = document.createElement('li'),
                voteButton = document.createElement('button'),
                removeButton = document.createElement('button'),
                span = document.createElement('span');

            li.appendChild(voteButton);
            li.appendChild(span);
            li.appendChild(removeButton);
            voteButton.gameName = game.name;
            voteButton.textContent = game.votes;
            voteButton.addEventListener('click', emitName('vote'));
            span.textContent = ' ' + game.name;

            removeButton.textContent = 'x';
            removeButton.classList = 'remove';
            removeButton.gameName = game.name;
            removeButton.addEventListener('click', emitName('remove'));

            ul.appendChild(li);
        });

        leader.textContent = maxVotes(games) || '';
    });

    function maxVotes(games) {
        if (games.length) {
            var max = games.reduce(function(max, nextTry) {
                return nextTry.votes > max.votes ? nextTry : max;
            });

            return `${max.name} - [${max.votes}]`;
        }
    }

    function emitName(type) {
        return function(e) {
            socket.emit(type, e.target.gameName);
        }
    }

    document.getElementById('newGame').addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
            var newGame = e.target.value;
            socket.emit('new', newGame);
            e.target.value = '';
        }
    });

    document.getElementById('reset').addEventListener('click', function() {
        socket.emit('reset');
    })
}());