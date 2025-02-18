'use client';

import { useState, useCallback, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GradientGenerator } from '@/app/utils/gradients';

const BOARD_SIZE = 15; // Kích thước bàn cờ 15x15
const WIN_CONDITION = 5; // Số quân cờ liên tiếp để thắng

type CellValue = 'X' | 'O' | null;
type GameState = 'playing' | 'won' | 'draw';

// Hàm tạo hiệu ứng pháo hoa
const firework = (particleRatio: number, opts: confetti.Options) => {
    const defaults = {
        origin: { y: 0.7 },
        particleCount: 80,
        spread: 55,
        startVelocity: 30,
        gravity: 1.2,
        drift: 0,
        ticks: 200,
    };

    confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(defaults.particleCount * particleRatio),
    });
};

// Hàm tạo số ngẫu nhiên trong khoảng
const random = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
};

// Hàm chạy chuỗi pháo hoa
const runFireworks = () => {
    const duration = 3000; // Giảm xuống 3 giây
    const animationEnd = Date.now() + duration;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'];

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        // Tạo 3-5 pháo hoa ngẫu nhiên mỗi lần
        const numberOfFireworks = Math.floor(random(3, 6));

        for (let i = 0; i < numberOfFireworks; i++) {
            // Tạo vị trí ngẫu nhiên
            const x = random(0.2, 0.8);
            const y = random(0.5, 0.9);

            // Tạo các thông số ngẫu nhiên cho pháo hoa
            firework(random(0.2, 0.4), {
                spread: random(50, 180),
                startVelocity: random(25, 45),
                decay: random(0.87, 0.95),
                scalar: random(0.8, 1.3),
                origin: { x, y },
                colors: [colors[Math.floor(random(0, colors.length))]],
                ticks: random(150, 250),
                gravity: random(0.8, 1.4),
            });
        }

        // Thêm hiệu ứng nổ tròn ngẫu nhiên
        if (Math.random() > 0.5) {
            firework(0.5, {
                spread: 360,
                startVelocity: random(20, 35),
                decay: 0.94,
                scalar: random(1.0, 1.5),
                origin: { x: random(0.3, 0.7), y: random(0.5, 0.7) },
                colors: [colors[Math.floor(random(0, colors.length))]],
                ticks: 200,
            });
        }

    }, 200);
};

export default function TicTacToe() {
    const [board, setBoard] = useState<CellValue[][]>(
        Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    );
    const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
    const [gameState, setGameState] = useState<GameState>('playing');
    const [winningCells, setWinningCells] = useState<[number, number][]>([]);
    const [playerXName, setPlayerXName] = useState<string>('X');
    const [playerOName, setPlayerOName] = useState<string>('O');
    const [resetButtonClasses, setResetButtonClasses] = useState('');

    useEffect(() => {
        setResetButtonClasses(GradientGenerator.getButtonClasses());
    }, []);

    // Chạy pháo hoa khi thắng
    useEffect(() => {
        if (gameState === 'won') {
            runFireworks();
        }
    }, [gameState]);

    // Kiểm tra chiến thắng
    const checkWin = useCallback((row: number, col: number, player: CellValue): boolean => {
        const directions = [
            [0, 1],   // Ngang
            [1, 0],   // Dọc
            [1, 1],   // Chéo xuống
            [1, -1],  // Chéo lên
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            const winningPositions: [number, number][] = [[row, col]];

            // Kiểm tra theo chiều thuận
            for (let i = 1; i < WIN_CONDITION; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                if (
                    newRow >= 0 && newRow < BOARD_SIZE &&
                    newCol >= 0 && newCol < BOARD_SIZE &&
                    board[newRow][newCol] === player
                ) {
                    count++;
                    winningPositions.push([newRow, newCol]);
                } else {
                    break;
                }
            }

            // Kiểm tra theo chiều ngược lại
            for (let i = 1; i < WIN_CONDITION; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                if (
                    newRow >= 0 && newRow < BOARD_SIZE &&
                    newCol >= 0 && newCol < BOARD_SIZE &&
                    board[newRow][newCol] === player
                ) {
                    count++;
                    winningPositions.push([newRow, newCol]);
                } else {
                    break;
                }
            }

            if (count >= WIN_CONDITION) {
                setWinningCells(winningPositions);
                return true;
            }
        }

        return false;
    }, [board]);

    // Kiểm tra hòa
    const checkDraw = useCallback((): boolean => {
        return board.every(row => row.every(cell => cell !== null));
    }, [board]);

    // Xử lý click vào ô
    const handleCellClick = (row: number, col: number) => {
        if (board[row][col] || gameState !== 'playing') return;

        const newBoard = board.map(row => [...row]);
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);

        if (checkWin(row, col, currentPlayer)) {
            setGameState('won');
        } else if (checkDraw()) {
            setGameState('draw');
        } else {
            setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
        }
    };

    // Reset game
    const resetGame = () => {
        setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
        setCurrentPlayer('X');
        setGameState('playing');
        setWinningCells([]);
    };

    const getCurrentPlayerName = () => {
        return currentPlayer === 'X' ? playerXName : playerOName;
    };

    return (
        <div className="flex items-center justify-center w-full">
            <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 m-2">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold animate-gradient">Cờ Caro</h1>
                    <button
                        onClick={resetGame}
                        className={resetButtonClasses || 'flex items-center gap-2 px-4 py-2 font-semibold text-white rounded-lg bg-blue-500 hover:bg-blue-600'}
                    >
                        <RotateCcw size={18} />
                        <span>Chơi lại</span>
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    {/* Player names input */}
                    <div className="grid grid-cols-2 gap-4 mb-4 w-full max-w-lg">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                                Người chơi X
                            </label>
                            <input
                                type="text"
                                value={playerXName}
                                onChange={(e) => setPlayerXName(e.target.value || 'X')}
                                placeholder="Nhập tên người chơi X"
                                className="w-full p-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                                Người chơi O
                            </label>
                            <input
                                type="text"
                                value={playerOName}
                                onChange={(e) => setPlayerOName(e.target.value || 'O')}
                                placeholder="Nhập tên người chơi O"
                                className="w-full p-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Game status */}
                    <div className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {gameState === 'playing' ? (
                            <span>Lượt của: <span className={currentPlayer === 'X' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}>
                                {getCurrentPlayerName()} ({currentPlayer})
                            </span></span>
                        ) : gameState === 'won' ? (
                            <span className={`${currentPlayer === 'X' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'} animate-gradient text-xl`}>
                                🎉 {getCurrentPlayerName()} ({currentPlayer}) thắng! 🎉
                            </span>
                        ) : (
                            <span className="text-gray-600 dark:text-gray-400">Hòa!</span>
                        )}
                    </div>

                    {/* Game board */}
                    <div className="inline-block bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <div className="grid gap-[1px] bg-gray-300 dark:bg-gray-600"
                            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}>
                            {board.map((row, rowIndex) => (
                                row.map((cell, colIndex) => {
                                    const isWinningCell = winningCells.some(
                                        ([r, c]) => r === rowIndex && c === colIndex
                                    );
                                    return (
                                        <button
                                            key={`${rowIndex}-${colIndex}`}
                                            className={`w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 text-base font-bold
                                                ${cell === 'X' ? 'text-blue-600' : 'text-red-600'}
                                                ${isWinningCell ? 'animate-pulse bg-yellow-100 dark:bg-yellow-900' : ''}
                                                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                                            onClick={() => handleCellClick(rowIndex, colIndex)}
                                            disabled={gameState !== 'playing'}
                                        >
                                            {cell}
                                        </button>
                                    );
                                })
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 