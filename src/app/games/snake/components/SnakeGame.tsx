'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  gridSize: number;
  speed: number;
  snakeColor: string;
  foodColor: string;
  backgroundColor: string;
  isPlaying: boolean;
  onScoreChange: (score: number) => void;
  shouldReset: boolean;
}

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export function SnakeGame({ gridSize, speed: initialSpeed, snakeColor, foodColor, backgroundColor, isPlaying, onScoreChange, shouldReset }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsRef = useRef<number>(144); // Tăng FPS lên 144
  const frameIntervalRef = useRef<number>(1000 / 144); // Interval cho 144 FPS
  const accumulatedTimeRef = useRef<number>(0);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [lastDirection, setLastDirection] = useState<Direction>('RIGHT');
  const cellSize = useRef<number>(20);
  const [speed, setSpeed] = useState(initialSpeed);
  const baseSpeed = useRef<number>(initialSpeed);

  // Cập nhật tốc độ khi initialSpeed thay đổi
  useEffect(() => {
    setSpeed(initialSpeed);
    baseSpeed.current = initialSpeed;
  }, [initialSpeed]);

  // Hàm tính toán tốc độ mới dựa trên độ dài rắn
  const calculateNewSpeed = useCallback((snakeLength: number) => {
    // Giảm thời gian delay (tăng tốc độ) khi rắn dài ra
    const minSpeed = baseSpeed.current * 0.6; // Tốc độ tối đa (40% nhanh hơn ban đầu)
    const speedReduction = baseSpeed.current * (snakeLength * 0.02); // Giảm 2% tốc độ cho mỗi đốt
    const newSpeed = Math.max(minSpeed, baseSpeed.current - speedReduction);
    return Math.floor(newSpeed);
  }, []);

  // Reset game với cập nhật tốc độ
  useEffect(() => {
    if (shouldReset) {
      setSnake([{ x: 10, y: 10 }]);
      setDirection('RIGHT');
      setLastDirection('RIGHT');
      setFood({
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
      });
      setSpeed(initialSpeed); // Reset về tốc độ ban đầu
      baseSpeed.current = initialSpeed;
      onScoreChange(0);
    }
  }, [shouldReset, gridSize, initialSpeed, onScoreChange]);

  // Tối ưu các hàm vẽ bằng useCallback
  const createSnakeGradient = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, snakeColor);
    gradient.addColorStop(1, adjustColor(snakeColor, -20));
    return gradient;
  }, [snakeColor]);

  // Hàm điều chỉnh màu
  const adjustColor = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Vẽ mồi với hiệu ứng phát sáng và hình táo
  const drawFood = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2 * 0.8;

    // Vẽ hiệu ứng phát sáng
    const glow = ctx.createRadialGradient(
      centerX, centerY, radius * 0.5,
      centerX, centerY, radius * 2
    );
    glow.addColorStop(0, foodColor);
    glow.addColorStop(1, 'transparent');

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = glow;
    ctx.fillRect(x - size / 2, y - size / 2, size * 2, size * 2);
    ctx.restore();

    // Vẽ táo
    ctx.fillStyle = foodColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ cuống táo
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = size / 10;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.quadraticCurveTo(
      centerX + radius / 2, centerY - radius - radius / 4,
      centerX + radius / 4, centerY - radius - radius / 3
    );
    ctx.stroke();

    // Vẽ highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
    ctx.fill();
  }, [foodColor]);

  // Vẽ rắn với hiệu ứng gradient và vảy
  const drawSnake = useCallback((ctx: CanvasRenderingContext2D, snake: Position[], size: number) => {
    // Vẽ đường nối giữa các đốt
    ctx.lineWidth = size * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = snakeColor;

    // Vẽ đường nối
    ctx.beginPath();
    snake.forEach((segment, index) => {
      const x = segment.x * size + size / 2;
      const y = segment.y * size + size / 2;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        // Tính toán điểm điều khiển cho đường cong Bezier
        const prevX = snake[index - 1].x * size + size / 2;
        const prevY = snake[index - 1].y * size + size / 2;

        // Xử lý trường hợp wrap-around
        let dx = prevX - x;
        let dy = prevY - y;

        if (Math.abs(dx) > size * gridSize / 2) {
          if (dx > 0) {
            ctx.lineTo(x + size * gridSize, y);
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x - size * gridSize, y);
            ctx.moveTo(x, y);
          }
        }
        if (Math.abs(dy) > size * gridSize / 2) {
          if (dy > 0) {
            ctx.lineTo(x, y + size * gridSize);
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y - size * gridSize);
            ctx.moveTo(x, y);
          }
        }

        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Vẽ từng phần của rắn
    snake.forEach((segment, index) => {
      const x = segment.x * size;
      const y = segment.y * size;
      const centerX = x + size / 2;
      const centerY = y + size / 2;
      const radius = index === 0 ? size / 2 * 0.9 : size / 2 * 0.8;

      if (index === 0) { // Đầu rắn
        const eyeRadius = radius * 0.2;
        const eyeOffset = radius * 0.4;

        // Tính góc xoay dựa trên hướng di chuyển
        let rotation = 0;
        switch (direction) {
          case 'RIGHT':
            rotation = 0;
            break;
          case 'DOWN':
            rotation = Math.PI / 2;
            break;
          case 'LEFT':
            rotation = Math.PI;
            break;
          case 'UP':
            rotation = -Math.PI / 2;
            break;
        }

        // Vẽ đầu rắn với xoay
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);

        // Vẽ hình oval cho đầu rắn
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1.2, 1);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.restore();

        // Gradient cho đầu rắn
        const headGradient = ctx.createRadialGradient(
          centerX - radius / 3, centerY - radius / 3, 0,
          centerX, centerY, radius * 1.2
        );
        headGradient.addColorStop(0, adjustColor(snakeColor, 30));
        headGradient.addColorStop(1, adjustColor(snakeColor, -10));
        ctx.fillStyle = headGradient;
        ctx.fill();

        // Mắt trái
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - eyeOffset, centerY - eyeOffset / 2, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Mắt phải
        ctx.beginPath();
        ctx.arc(centerX + eyeOffset, centerY - eyeOffset / 2, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Đồng tử - di chuyển theo hướng
        ctx.fillStyle = 'black';
        const pupilOffset = eyeRadius * 0.3;
        ctx.beginPath();
        ctx.arc(centerX - eyeOffset + pupilOffset, centerY - eyeOffset / 2, eyeRadius / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + eyeOffset + pupilOffset, centerY - eyeOffset / 2, eyeRadius / 2, 0, Math.PI * 2);
        ctx.fill();

        // Lưỡi
        const tongueLength = radius * 1.2;
        const tongueWidth = radius * 0.15;
        const tongueStart = centerX + radius * 0.8;
        const tongueY = centerY;

        ctx.strokeStyle = '#FF3B3B';
        ctx.lineWidth = tongueWidth;
        ctx.lineCap = 'round';

        // Phần thẳng của lưỡi
        ctx.beginPath();
        ctx.moveTo(tongueStart, tongueY);
        ctx.lineTo(tongueStart + tongueLength * 0.6, tongueY);
        ctx.stroke();

        // Phần chẻ đôi của lưỡi
        ctx.beginPath();
        ctx.moveTo(tongueStart + tongueLength * 0.6, tongueY);
        ctx.lineTo(tongueStart + tongueLength, tongueY - tongueLength * 0.2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(tongueStart + tongueLength * 0.6, tongueY);
        ctx.lineTo(tongueStart + tongueLength, tongueY + tongueLength * 0.2);
        ctx.stroke();

        ctx.restore();
      } else if (index === snake.length - 1) { // Đuôi rắn
        // Tính góc đuôi dựa trên phần thân trước nó
        const tailAngle = Math.atan2(
          snake[index].y - snake[index - 1].y,
          snake[index].x - snake[index - 1].x
        );

        // Gradient cho đuôi
        const tailGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, radius
        );
        tailGradient.addColorStop(0, adjustColor(snakeColor, 20));
        tailGradient.addColorStop(1, adjustColor(snakeColor, -30));

        ctx.fillStyle = tailGradient;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX - Math.cos(tailAngle + Math.PI / 4) * radius * 1.2,
          centerY - Math.sin(tailAngle + Math.PI / 4) * radius * 1.2
        );
        ctx.lineTo(
          centerX - Math.cos(tailAngle) * radius * 1.5,
          centerY - Math.sin(tailAngle) * radius * 1.5
        );
        ctx.lineTo(
          centerX - Math.cos(tailAngle - Math.PI / 4) * radius * 1.2,
          centerY - Math.sin(tailAngle - Math.PI / 4) * radius * 1.2
        );
        ctx.closePath();
        ctx.fill();
      } else {
        // Vẽ hoạt tiết cho thân rắn
        const segmentGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, radius
        );
        segmentGradient.addColorStop(0, adjustColor(snakeColor, 20));
        segmentGradient.addColorStop(1, adjustColor(snakeColor, -20));

        // Vẽ hình tròn chính cho đốt
        ctx.fillStyle = segmentGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Tính góc cho hoạt tiết dựa vào vị trí
        const patternAngle = (index * Math.PI / 6) + (Date.now() / 1000);

        // Vẽ họa tiết hình kim cương
        ctx.fillStyle = adjustColor(snakeColor, 30);
        const diamondSize = radius * 0.4;
        const diamondCount = 4;
        for (let i = 0; i < diamondCount; i++) {
          const angle = patternAngle + (i * Math.PI * 2 / diamondCount);
          const diamondX = centerX + Math.cos(angle) * radius * 0.5;
          const diamondY = centerY + Math.sin(angle) * radius * 0.5;

          ctx.save();
          ctx.translate(diamondX, diamondY);
          ctx.rotate(angle + Math.PI / 4);
          ctx.beginPath();
          ctx.moveTo(0, -diamondSize / 2);
          ctx.lineTo(diamondSize / 2, 0);
          ctx.lineTo(0, diamondSize / 2);
          ctx.lineTo(-diamondSize / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Vẽ họa tiết chấm tròn
        ctx.fillStyle = adjustColor(snakeColor, 40);
        const dotRadius = radius * 0.15;
        const dotCount = 6;
        for (let i = 0; i < dotCount; i++) {
          const angle = -patternAngle + (i * Math.PI * 2 / dotCount);
          const dotX = centerX + Math.cos(angle) * radius * 0.6;
          const dotY = centerY + Math.sin(angle) * radius * 0.6;

          ctx.beginPath();
          ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Vẽ họa tiết đường viền
        ctx.strokeStyle = adjustColor(snakeColor, -10);
        ctx.lineWidth = radius * 0.1;
        const borderCount = 3;
        for (let i = 0; i < borderCount; i++) {
          const angle = patternAngle * 0.5 + (i * Math.PI * 2 / borderCount);
          const startX = centerX + Math.cos(angle) * radius * 0.7;
          const startY = centerY + Math.sin(angle) * radius * 0.7;
          const endX = centerX + Math.cos(angle + Math.PI / 6) * radius * 0.7;
          const endY = centerY + Math.sin(angle + Math.PI / 6) * radius * 0.7;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        // Vẽ highlight
        const highlightGradient = ctx.createRadialGradient(
          centerX - radius * 0.3, centerY - radius * 0.3, 0,
          centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [snakeColor, direction, gridSize]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawSnake(context, snake, cellSize.current);
    drawFood(context, food.x * cellSize.current, food.y * cellSize.current, cellSize.current);
  }, [snake, food, backgroundColor, drawSnake, drawFood]);

  // Game loop được tối ưu với timing chính xác hơn
  const gameLoop = useCallback((timestamp: number) => {
    if (!isPlaying) return;

    // Tính toán delta time và accumulated time
    const deltaTime = timestamp - lastFrameTimeRef.current;
    accumulatedTimeRef.current += deltaTime;
    lastFrameTimeRef.current = timestamp;

    // Cập nhật game state với fixed timestep dựa trên speed hiện tại
    const fixedTimeStep = speed;
    while (accumulatedTimeRef.current >= fixedTimeStep) {
      const head = { ...snake[0] };
      head.x += direction === 'RIGHT' ? 1 : direction === 'LEFT' ? -1 : 0;
      head.y += direction === 'DOWN' ? 1 : direction === 'UP' ? -1 : 0;

      // Xử lý wrap-around với bitwise
      head.x = head.x < 0 ? gridSize - 1 : head.x >= gridSize ? 0 : head.x;
      head.y = head.y < 0 ? gridSize - 1 : head.y >= gridSize ? 0 : head.y;

      const hasCollision = snake.some((segment, index) => {
        if (index === 0) return false;
        return segment.x === head.x && segment.y === head.y;
      });

      if (hasCollision) {
        onScoreChange(0);
        accumulatedTimeRef.current = 0;
        return;
      }

      if (head.x === food.x && head.y === food.y) {
        const newSnake = [head, ...snake];
        setSnake(newSnake);
        onScoreChange(newSnake.length - 1);

        const newSpeed = calculateNewSpeed(newSnake.length);
        setSpeed(newSpeed);

        // Tối ưu tạo mồi mới
        const difficultyFactor = Math.min(0.7, newSnake.length * 0.05);
        const minDistance = gridSize * difficultyFactor;
        let newFood;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          newFood = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
          };

          const dx = newFood.x - head.x;
          const dy = newFood.y - head.y;
          const distanceSquared = dx * dx + dy * dy;

          if (distanceSquared >= minDistance * minDistance || attempts++ >= maxAttempts) {
            break;
          }
        } while (true);

        setFood(newFood);
      } else {
        setSnake([head, ...snake.slice(0, snake.length - 1)]);
      }

      setLastDirection(direction);
      accumulatedTimeRef.current -= fixedTimeStep;
    }

    // Vẽ game với timing chính xác
    drawGame();

    // Đảm bảo FPS ổn định
    const targetFrameTime = 1000 / fpsRef.current;
    const frameTime = performance.now() - timestamp;
    const delay = Math.max(0, targetFrameTime - frameTime);

    animationFrameRef.current = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, delay) as unknown as number;
  }, [isPlaying, speed, direction, snake, food, gridSize, drawGame, onScoreChange]);

  // Xử lý phím với useCallback
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    switch (e.key) {
      case 'ArrowUp':
        if (lastDirection !== 'DOWN') {
          setDirection('UP');
        }
        break;
      case 'ArrowDown':
        if (lastDirection !== 'UP') {
          setDirection('DOWN');
        }
        break;
      case 'ArrowLeft':
        if (lastDirection !== 'RIGHT') {
          setDirection('LEFT');
        }
        break;
      case 'ArrowRight':
        if (lastDirection !== 'LEFT') {
          setDirection('RIGHT');
        }
        break;
    }
  }, [lastDirection]);

  // Khởi tạo game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const size = gridSize * cellSize.current;
    canvas.width = size;
    canvas.height = size;

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.objectFit = 'contain';

    window.addEventListener('keydown', handleKeyPress);

    if (isPlaying) {
      lastFrameTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (typeof animationFrameRef.current === 'number') {
        if (animationFrameRef.current > 0) {
          cancelAnimationFrame(animationFrameRef.current);
          clearTimeout(animationFrameRef.current);
        }
      }
    };
  }, [isPlaying, gridSize, handleKeyPress, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="w-full h-full rounded-lg"
      tabIndex={0}
    />
  );
} 