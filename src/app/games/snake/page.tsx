'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { GradientGenerator } from '@/app/utils/gradients';
import { SnakeGame } from './components/SnakeGame';

interface GameConfig {
  speed: number;
  gridSize: number;
  snakeColor: string;
  foodColor: string;
  backgroundColor: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function SnakeGamePage() {
  const [config, setConfig] = useState<GameConfig>({
    speed: 100,
    gridSize: 20,
    snakeColor: '#22C55E', // green-500
    foodColor: '#EF4444', // red-500
    backgroundColor: '#F3F4F6', // gray-100
    difficulty: 'medium'
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [resetButtonClasses, setResetButtonClasses] = useState('');
  const [playButtonClasses, setPlayButtonClasses] = useState('');
  const [shouldReset, setShouldReset] = useState(false);

  useEffect(() => {
    setResetButtonClasses(GradientGenerator.getButtonClasses());
    setPlayButtonClasses(GradientGenerator.getButtonClasses());
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setScore(0);
    setIsPlaying(false);
    setShouldReset(true);
    // Reset shouldReset sau một khoảng thời gian ngắn
    setTimeout(() => {
      setShouldReset(false);
      // Tự động bắt đầu game mới sau khi reset
      setIsPlaying(true);
    }, 100);
  };

  const togglePlay = () => {
    // Nếu game over (score = 0), cần reset game trước
    if (score === 0 && !isPlaying) {
      handleReset();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
    if (newScore === 0) {
      // Game over
      setIsPlaying(false);
    } else if (newScore > highScore) {
      setHighScore(newScore);
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 m-2">
        <h1 className="text-2xl font-bold mb-4 text-center animate-gradient">
          Rắn Săn Mồi
        </h1>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cấu hình game */}
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  Tốc độ (ms)
                </label>
                <input
                  type="number"
                  name="speed"
                  value={config.speed}
                  onChange={handleInputChange}
                  min="50"
                  max="200"
                  step="10"
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  Kích thước lưới
                </label>
                <input
                  type="number"
                  name="gridSize"
                  value={config.gridSize}
                  onChange={handleInputChange}
                  min="10"
                  max="30"
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  Độ khó
                </label>
                <select
                  name="difficulty"
                  value={config.difficulty}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  Màu rắn
                </label>
                <input
                  type="color"
                  name="snakeColor"
                  value={config.snakeColor}
                  onChange={handleInputChange}
                  className="w-full h-10 p-1 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  Màu mồi
                </label>
                <input
                  type="color"
                  name="foodColor"
                  value={config.foodColor}
                  onChange={handleInputChange}
                  className="w-full h-10 p-1 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  Màu nền
                </label>
                <input
                  type="color"
                  name="backgroundColor"
                  value={config.backgroundColor}
                  onChange={handleInputChange}
                  className="w-full h-10 p-1 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Khu vực chơi game */}
          <div className="flex-1 flex flex-col items-center gap-5">
            <div className="flex justify-between w-full max-w-[500px] mb-4">
              <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Điểm: <span className="text-green-500 dark:text-green-400">{score}</span>
              </div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Điểm cao: <span className="text-blue-500 dark:text-blue-400">{highScore}</span>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-lg w-full max-w-[500px] aspect-square relative">
              <SnakeGame
                gridSize={config.gridSize}
                speed={config.speed}
                snakeColor={config.snakeColor}
                foodColor={config.foodColor}
                backgroundColor={config.backgroundColor}
                isPlaying={isPlaying}
                onScoreChange={handleScoreChange}
                shouldReset={shouldReset}
              />
              {/* Game Over Overlay */}
              {score === 0 && !isPlaying && !shouldReset && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in">
                  <div className="text-4xl font-bold text-white">
                    Game Over!
                  </div>
                  <div className="text-xl text-white">
                    Điểm số: <span className="text-yellow-400">{highScore}</span>
                  </div>
                  <button
                    onClick={handleReset}
                    className={`${resetButtonClasses || 'flex items-center gap-2 px-4 py-2 font-semibold text-white rounded-lg bg-blue-500 hover:bg-blue-600'}`}
                  >
                    <RotateCcw size={20} />
                    <span>Chơi lại</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={togglePlay}
                className={`${playButtonClasses || 'flex items-center gap-2 px-4 py-2 font-semibold text-white rounded-lg bg-blue-500 hover:bg-blue-600'}`}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                <span>
                  {isPlaying
                    ? 'Tạm dừng'
                    : score === 0 && !shouldReset
                      ? 'Chơi'
                      : 'Tiếp tục'
                  }
                </span>
              </button>

              <button
                onClick={handleReset}
                className={`${resetButtonClasses || 'flex items-center gap-2 px-4 py-2 font-semibold text-white rounded-lg bg-blue-500 hover:bg-blue-600'}`}
              >
                <RotateCcw size={20} />
                <span>Chơi lại</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 