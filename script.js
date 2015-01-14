$(function() {
    function Minesweeper() {
        // Configuration
        var conf = {
            WIDTH: 8,      // TODO make these options
            HEIGHT: 8,
            MINES: 15
        };
        var $board = $('#game-board'),
            board = [],
            gameTimer = null,
            that = this,
            // simple function to make creating a lot of elements really fast
            makeElement = function(str) {
                return $(document.createElement(str.split('.')[0])).addClass(str.split('.').slice(1).join(' '));
            };

        var initHeader = function() {
                // simple fucntions that returns seconds since 01/01/1970
            var getSeconds = function() { return Math.floor((new Date()).getTime() / 1000); },
                getSecondsSince = function(end, start) {
                    if(typeof start === 'undefined') {
                        start = getSeconds();
                    }
                    return end - start;
                },
                gameStartTime = getSeconds();

                $board.html('');
            
                // make the header
                makeElement('div.header')
                    .append(makeElement('div.smiley-face.action'))
                    .append(makeElement('div.mines-count.pull-left'))
                    .append(makeElement('div.time.pull-right'))
                    .appendTo($board);

                // incase we're reseting the game
                if(gameTimer) {
                    clearInterval(gameTimer);
                }
                gameTimer = setInterval(function() {
                    // update the timer
                    $board.find('.time').html(getSecondsSince(getSeconds(), gameStartTime));
                });
            },
            initBoard = function() {
                var $frag = document.createDocumentFragment();      // Create a document fragment for faster rendering of cells
                for(var y = 0; y < conf.HEIGHT; y++) {
                    // create the figurative board as well
                    board.push(new Array(conf.WIDTH));
                    for(var x = 0; x < conf.WIDTH; x++) {
                        // make the element with markings of coords to make them easier to find
                        makeElement('div.pull-left.cell.cell-x-' + x + '.cell-y-' + y)
                            .data({
                                'x': x,
                                'y': y
                            })
                            .appendTo($frag);

                        // To tell if something is a mine we simply put true
                        board[y][x] = {
                            isMine: false,
                            isClicked: false,
                            rightClickState: 0,
                            x: x,
                            y: y
                        };
                    }
                    // append a break to make sure they jump lines
                    makeElement('div.clearfix').appendTo($frag);
                }

                $board.append($frag);
            },
            initEvents = function() {
                var getAdjacentSquares = function(cell) {
                        var x = cell.x, 
                            y = cell.y, 
                            deltaY = -1, 
                            deltaX = -1, 
                            squares = [];
                        if(typeof withDiagonals === 'undefined') {
                            withDiagonals = true;
                        }
                        while(true) {
                            // if we're not counting ourselves
                            if(!(y + deltaY === 0 && x + deltaX === 0)) {
                                // if that row is in bounds
                                if(board[y + deltaY]) {
                                    // if that particular cell in that row is in bounds
                                    if(board[y + deltaY][x + deltaX]) {
                                        // add it to the list of squares
                                        squares.push(board[y + deltaY][x + deltaX]);
                                    }
                                }
                            }
                            if(++deltaX > 1) {
                                deltaX = -1;
                                if(++deltaY >= 2) {
                                    break;
                                }
                            }
                        }
                        return squares;
                    },
                    numberOfSurroundingMines = function(cell) {
                        return getAdjacentSquares(cell).reduce(function(prev, curr) {
                            if(curr.isMine) { return ++prev; }
                            return prev;
                        }, 0);
                    },
                    bombStatus = [null, 'mine-flagged', 'mine-suspected'];
                // disable right click menu
                document.oncontextmenu = function() {return false;};

                $board.on({
                    // handle the right click event
                    'mouseup.minesweeper': function(evt) {
                        var $cell = $(evt.target),
                            cell = board[$cell.data('y')][$cell.data('x')];

                        // if it is clicked with the right click button
                        if(evt.button === 2) {
                            if(++cell.rightClickState > 2) {
                                cell.rightClickState = 0;
                            }
                            $cell.removeClass(bombStatus[1]);
                            $cell.removeClass(bombStatus[2]);
                            // show the flag or the question mark
                            if(cell.rightClickState) {
                                // remove the old class add the new one for the bomb state
                                $cell.addClass(bombStatus[cell.rightClickState]);
                            }
                        }
                    },
                    'click.minesweeper': function(evt) {
                        var $cell = $(evt.target),
                            cell = board[$cell.data('y')][$cell.data('x')];

                        // if the cell has already been clicked, and it's not a right click no need to do anything else
                        if(cell.rightClickState === 1 || (cell.isClicked && evt.button !== 2)) {
                            return;
                        }

                        // if it's a right click, add the flag, and then question mark
                        if(evt.button === 2) {
                        } else {            // Regular left click
                            // otherwise mark it clicked and continue
                            $cell.addClass('clicked');
                            cell.isClicked = true;
                            // if it is a mine
                            if(cell.isMine) {
                                // game over condition
                                $cell.addClass('cell-mine');
                                that.endGame();
                            } else {
                                if(numberOfSurroundingMines(cell)) {
                                    // if it is a number, show it
                                    $cell
                                        .addClass('cell-number')
                                        .append(numberOfSurroundingMines(cell));
                                } else {
                                    // otherwise show all of the adjacent square until you reach all numbers
                                    $cell.addClass('cell-empty');
                                    // get all the adjacent squares and click them mfs.
                                    getAdjacentSquares(cell).forEach(function(square) {
                                        if(!square.isMine) {
                                            $('.cell-x-' + square.x + '.cell-y-' + square.y).click();
                                        }
                                    });
                                }
                            }
                        }
                    }
                }, '.cell');

                $board.on({
                    click: function() {
                        that.startGame();
                    }
                }, '.action')
                $('#conf').submit(function() {
                    that.startGame();
                });
            },
            initMines = function() {
                var tile = null,
                    randomWholeNumber = function(num) { return Math.floor(Math.random() * num); },
                    randomTile = function() { return board[randomWholeNumber(conf.HEIGHT)][randomWholeNumber(conf.WIDTH)]; };

                // go through and create mines virtually
                for(var i = conf.MINES; i > 0; i--) {
                    do {
                        tile = randomTile();
                    } while(tile.isMine);      // while we're choose one that already has a mine keep choosing

                    // make the tile a mine
                    tile.isMine = true;
                }
            },
            initConfig = function() {
                $("#conf .form-control").map(function(idx, item) {
                    var $el = $(item),
                        which = $el.attr('id').toUpperCase();
                    if($el.val().length) {
                        conf[which] = $el.val();
                    } else {
                        $el.val(conf[which]);
                    }
                });
            };

        this.startGame = function() {
            initConfig();
            initHeader();
            initBoard();
            initEvents();
            initMines();
        };
        this.endGame = function() {
            // show all of the mines
            for(var i = 0; i < conf.WIDTH; i++) {
                for(var j = 0; j < conf.HEIGHT; j++) {
                    if(board[j][i].isMine) {
                        $('.cell-x-' + i + '.cell-y-' + j).click();
                    }
                }
            }
            // stop the clock
            clearInterval(gameTimer);
            // cancel all events
        };

        this.startGame();
    }


    new Minesweeper();
})
