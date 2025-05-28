document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const cells = Array.from(grid.querySelectorAll('div'));
    const width = 10;
    let pacmanIndex = 11;
    let score = 0;
    let lives = 3;

    const scoreDisplay = document.getElementById('score');
    const livesDisplay = document.getElementById('lives');
    const restartButton = document.getElementById('restart');

    cells.forEach(cell => {
        cell.style.position = 'relative';
    });

    function createSprite(className) {
        const sprite = document.createElement('span');
        sprite.classList.add(className);
        sprite.style.position = 'absolute';
        sprite.style.top = '0';
        sprite.style.left = '0';
        sprite.style.width = '100%';
        sprite.style.height = '100%';
        sprite.style.zIndex = '2';
        return sprite;
    }

    let pacmanSprite = createSprite('pacman');
    cells[pacmanIndex].appendChild(pacmanSprite);

    // Guardamos el estado inicial de dots y power-pellets para reiniciar
    const initialDots = [];
    const initialPowerPellets = [];

    cells.forEach((cell, index) => {
        if (cell.classList.contains('dot')) initialDots.push(index);
        if (cell.classList.contains('power-pellet')) initialPowerPellets.push(index);
    });

    function endGame(message) {
        document.removeEventListener('keydown', movePacman);
        ghosts.forEach(ghost => clearInterval(ghost.timerId));
        setTimeout(() => alert(message), 100);
    }

    function resetPacmanPosition() {
        if (cells[pacmanIndex].contains(pacmanSprite)) {
            cells[pacmanIndex].removeChild(pacmanSprite);
        }
        pacmanIndex = 11; // posición inicial
        cells[pacmanIndex].appendChild(pacmanSprite);
    }

    function movePacman(e) {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

        cells[pacmanIndex].removeChild(pacmanSprite);

        switch (e.key) {
            case 'ArrowUp':
                if (pacmanIndex - width >= 0 && !cells[pacmanIndex - width].classList.contains('wall')) {
                    pacmanIndex -= width;
                }
                break;
            case 'ArrowDown':
                if (pacmanIndex + width < cells.length && !cells[pacmanIndex + width].classList.contains('wall')) {
                    pacmanIndex += width;
                }
                break;
            case 'ArrowLeft':
                if (pacmanIndex % width !== 0 && !cells[pacmanIndex - 1].classList.contains('wall')) {
                    pacmanIndex -= 1;
                }
                break;
            case 'ArrowRight':
                if (pacmanIndex % width !== width - 1 && !cells[pacmanIndex + 1].classList.contains('wall')) {
                    pacmanIndex += 1;
                }
                break;
        }

        // Comer dot
        if (cells[pacmanIndex].classList.contains('dot')) {
            cells[pacmanIndex].classList.remove('dot');
            score += 5;
            if (scoreDisplay) scoreDisplay.textContent = score;
        }

        // Comer power-pellet
        if (cells[pacmanIndex].classList.contains('power-pellet')) {
            cells[pacmanIndex].classList.remove('power-pellet');
            score += 10;
            if (scoreDisplay) scoreDisplay.textContent = score;
            ghosts.forEach(ghost => ghost.becomeScared());
        }

        // Pac-Man come fantasmas asustados
        ghosts.forEach(ghost => {
            if (ghost.currentIndex === pacmanIndex && ghost.isScared) {
                ghost.erase();
                ghost.currentIndex = ghost.startIndex;
                ghost.draw();
                score += 50;
                if (scoreDisplay) scoreDisplay.textContent = score;
            }
        });

        // Contacto con fantasma no asustado => perder vida o terminar juego
        if (ghosts.some(ghost => ghost.currentIndex === pacmanIndex && !ghost.isScared)) {
            lives--;
            if (livesDisplay) livesDisplay.textContent = lives;

            if (lives > 0) {
                resetPacmanPosition();
            } else {
                endGame('¡Has perdido! 😵');
            }
        }

        // Comprobar si quedan puntos
        const remainingDots = cells.some(cell => cell.classList.contains('dot') || cell.classList.contains('power-pellet'));
        if (!remainingDots) {
            endGame('¡Ganaste! 🎉');
        }

        cells[pacmanIndex].appendChild(pacmanSprite);
    }

    document.addEventListener('keydown', movePacman);

    class Ghost {
        constructor(name, startIndex, className, speed = 500) {
            this.name = name;
            this.startIndex = startIndex;
            this.currentIndex = startIndex;
            this.className = className;
            this.speed = speed;
            this.timerId = null;
            this.directions = [-1, 1, -width, width];
            this.sprite = createSprite(className);
            this.isScared = false;
        }

        draw() {
            this.sprite.classList.toggle('scared', this.isScared);
            cells[this.currentIndex].appendChild(this.sprite);
        }

        erase() {
            if (cells[this.currentIndex].contains(this.sprite)) {
                cells[this.currentIndex].removeChild(this.sprite);
            }
        }

        move() {
            const moveGhost = () => {
                const direction = this.directions[Math.floor(Math.random() * this.directions.length)];
                const nextIndex = this.currentIndex + direction;
                if (
                    !cells[nextIndex].classList.contains('wall') &&
                    !cells[nextIndex].classList.contains('ghost')
                ) {
                    this.erase();
                    this.currentIndex = nextIndex;
                    this.draw();

                    if (this.currentIndex === pacmanIndex) {
                        if (this.isScared) {
                            this.erase();
                            this.currentIndex = this.startIndex;
                            this.draw();
                            score += 50;
                            if (scoreDisplay) scoreDisplay.textContent = score;
                        } else {
                            lives--;
                            if (livesDisplay) livesDisplay.textContent = lives;

                            if (lives > 0) {
                                resetPacmanPosition();
                            } else {
                                endGame('¡Has perdido! 😵');
                            }
                        }
                    }
                }
            };
            this.timerId = setInterval(moveGhost, this.speed);
        }

        becomeScared() {
            this.isScared = true;
            this.sprite.classList.add('scared');
            setTimeout(() => {
                this.isScared = false;
                this.sprite.classList.remove('scared');
            }, 7000);
        }
    }

    const blinky = new Ghost('blinky', 35, 'red', 500);
    const pinky = new Ghost('pinky', 36, 'pink', 500);
    const ghosts = [blinky, pinky];

    ghosts.forEach(ghost => {
        ghost.draw();
        ghost.move();
    });

    restartButton.addEventListener('click', () => {
        // Reset score y vidas
        score = 0;
        lives = 3;

        if (scoreDisplay) scoreDisplay.textContent = score;
        if (livesDisplay) livesDisplay.textContent = lives;

        // Resetear dots y power-pellets
        cells.forEach(cell => {
            cell.classList.remove('dot', 'power-pellet');
        });
        initialDots.forEach(i => cells[i].classList.add('dot'));
        initialPowerPellets.forEach(i => cells[i].classList.add('power-pellet'));

        // Resetear Pac-Man
        if (cells[pacmanIndex].contains(pacmanSprite)) {
            cells[pacmanIndex].removeChild(pacmanSprite);
        }
        pacmanIndex = 11;
        cells[pacmanIndex].appendChild(pacmanSprite);

        // Resetear fantasmas
        ghosts.forEach(ghost => {
            clearInterval(ghost.timerId);
            ghost.erase();
            ghost.currentIndex = ghost.startIndex;
            ghost.isScared = false;
            ghost.draw();
            ghost.move();
        });

        // Reactivar evento teclado
        document.addEventListener('keydown', movePacman);
    });

    // Inicializa vidas en pantalla
    if (livesDisplay) livesDisplay.textContent = lives;
});
