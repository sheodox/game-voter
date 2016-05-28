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
            removeButton.className = 'remove';
            removeButton.gameName = game.title;
            removeButton.addEventListener('click', emitName('remove'));


            ul.appendChild(li);
        });

        maxVotes(games);
        enforceHeight();
    });

    function maxVotes(games) {
        var leader = gebi('leader');
        leader.innerHTML = '';
        games.slice()
            .sort(function(one, two) {
                return two.voters.length - one.voters.length;
            })
            .slice(0, 10)
            .reduce(function(done, next) {
                var li = document.createElement('li');
                li.textContent = `${next.title} - ${next.voters.length}`;
                done.appendChild(li);
                return done;
            }, leader);
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
    
    window.addEventListener('resize', enforceHeight);
    var right = gebi('games');
    function enforceHeight() {
        right.style.height = window.innerHeight + 'px';
    }
    enforceHeight();

    function getUser() {
        var user = localStorage.getItem('user') || String(prompt('Choose a username')).trim();
        localStorage.setItem('user', user);
        gebi('user').textContent = user;
        return user;
    }
}());