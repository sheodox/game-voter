(function() {
    'use strict';
    function gebi(id) {
        return document.getElementById(id);
    }
    
    var socket = io.connect(),
        user = getUser();

    socket.on('reconnect', function () {
        location.reload()
    });

    var leader = gebi('leader');

    socket.on('update', function (games) {
        var ul = gebi('games');
        ul.innerHTML = '';
        games.forEach(function(game) {
            var li = document.createElement('li'),
                voteButton = document.createElement('button'),
                removeButton = document.createElement('button'),
                gameTitle = document.createElement('span'),
                voters = document.createElement('p');

            li.appendChild(voteButton);
            li.appendChild(gameTitle);
            li.appendChild(removeButton);
            li.appendChild(voters);
            
            voteButton.gameName = game.title;
            voteButton.textContent = game.voters.length;
            if (game.voters.includes(user)) {
                voteButton.classList = 'voted'
            }

            voteButton.addEventListener('mousedown', function(e) {
                socket.emit(
                    e.button === 0 ? 'vote' : 'unvote',
                    {title: game.title, user: user}
                );
                e.preventDefault();
                e.stopPropagation();
            });
            voteButton.addEventListener('contextmenu', function(e) {e.preventDefault()});
            gameTitle.textContent = ' ' + game.title;
            voters.textContent = game.voters.join(', ') || 'nobody!';

            removeButton.textContent = 'x';
            removeButton.classList = 'remove';
            removeButton.gameName = game.title;
            removeButton.addEventListener('click', emitName('remove'));


            ul.appendChild(li);
        });

        leader.textContent = maxVotes(games) || '';
    });

    function maxVotes(games) {
        if (games.length) {
            var max = games.reduce(function(max, nextTry) {
                return nextTry.voters.length > max.voters.length ? nextTry : max;
            });

            return `${max.title} - [${max.voters.length}]`;
        }
    }

    function emitName(type) {
        return function(e) {
            socket.emit(type, e.target.gameName);
        }
    }

    gebi('newGame').addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
            var newGame = e.target.value;
            socket.emit('new', newGame);
            e.target.value = '';
        }
    });

    gebi('reset').addEventListener('click', function() {
        socket.emit('reset');
    });

    function getUser() {
        var user = localStorage.getItem('user') || String(prompt('Choose a usertitle')).trim();
        localStorage.setItem('user', user);
        gebi('user').textContent = user;
        return user;
    }
}());