import { useState, useEffect, useCallback, useRef } from "react";
import {
  createEmptyBoard,
  getRandomTetromino,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINOES,
  type TetrominoType,
} from "./constants";

const CELL_SIZE = 24;
const GAP_SIZE = 1;
const STEP = CELL_SIZE + GAP_SIZE;

class SoundFX {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private init() {
    if (this.isMuted) return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  start() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.18);
  }

  move() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  rotate() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(550, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  lock() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  clear(linesCleared: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (linesCleared >= 4) {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.07);
      osc.frequency.setValueAtTime(783.99, now + 0.14);
      osc.frequency.setValueAtTime(1046.5, now + 0.21);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.35);
    } else {
      osc.type = "square";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.2);
    }
  }

  countdown() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }
}

const sfx = new SoundFX();

const NOTHING_QUOTES = [
  "Nothing lasts forever.",
  "Everything starts from zero.",
  "Design in silence.",
  "Pure form, zero noise.",
  "Just a glitch in the void.",
  "Rebooting empty space...",
];

interface ScoreEntry {
  score: number;
  date: string;
}

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [board, setBoard] = useState<number[][]>(() => createEmptyBoard());
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [comboBanner, setComboBanner] = useState<string | null>(null);
  const [randomQuote, setRandomQuote] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>(() => {
    const saved = localStorage.getItem("nothing_tetris_scores");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    x: number;
    y: number;
  }>(() => {
    const p = getRandomTetromino();
    return { shape: p.shape, x: 3, y: 0 };
  });

  const [nextType, setNextType] = useState<TetrominoType>(() => {
    return getRandomTetromino().type;
  });

  // تایمر
  useEffect(() => {
    if (!hasStarted || gameOver || isPaused || countdown !== null) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, gameOver, isPaused, countdown]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleMute = () => {
    sfx.isMuted = !isMuted;
    setIsMuted(!isMuted);
  };

  const checkCollision = useCallback(
    (shape: number[][], offsetX: number, offsetY: number, targetBoard: number[][]) => {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            const nx = offsetX + c;
            const ny = offsetY + r;

            if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return true;
            if (ny >= 0 && targetBoard[ny] && targetBoard[ny][nx] !== 0) return true;
          }
        }
      }
      return false;
    },
    []
  );

  const rotateMatrix = (mat: number[][]) => {
    const rows = mat.length;
    const cols = mat[0].length;
    const rotated: number[][] = [];
    for (let c = 0; c < cols; c++) {
      const row: number[] = [];
      for (let r = rows - 1; r >= 0; r--) {
        row.push(mat[r][c]);
      }
      rotated.push(row);
    }
    return rotated;
  };

  const rotate = useCallback(() => {
    if (!hasStarted || gameOver || isPaused || countdown !== null || clearingRows.length > 0) return;
    const rotated = rotateMatrix(currentPiece.shape);
    if (!checkCollision(rotated, currentPiece.x, currentPiece.y, board)) {
      setCurrentPiece((prev) => ({ ...prev, shape: rotated }));
      sfx.rotate();
    } else if (!checkCollision(rotated, currentPiece.x - 1, currentPiece.y, board)) {
      setCurrentPiece((prev) => ({ ...prev, shape: rotated, x: prev.x - 1 }));
      sfx.rotate();
    } else if (!checkCollision(rotated, currentPiece.x + 1, currentPiece.y, board)) {
      setCurrentPiece((prev) => ({ ...prev, shape: rotated, x: prev.x + 1 }));
      sfx.rotate();
    }
  }, [hasStarted, currentPiece, board, checkCollision, gameOver, isPaused, countdown, clearingRows.length]);

  const saveHighScore = useCallback((finalScore: number) => {
    if (finalScore === 0) return;
    setLeaderboard((prev) => {
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
      const updated = [...prev, { score: finalScore, date: dateStr }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      localStorage.setItem("nothing_tetris_scores", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const calculateBonus = (linesCleared: number) => {
    switch (linesCleared) {
      case 1:
        return 100;
      case 2:
        return 300;
      case 3:
        return 600;
      case 4:
        return 1000;
      default:
        return linesCleared * 100;
    }
  };

  const lockPiece = useCallback(() => {
    sfx.lock();
    const newBoard = board.map((row) => [...row]);

    currentPiece.shape.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell !== 0) {
          const y = currentPiece.y + rIdx;
          const x = currentPiece.x + cIdx;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            newBoard[y][x] = 1;
          }
        }
      });
    });

    const fullRows: number[] = [];
    newBoard.forEach((row, idx) => {
      if (row.every((cell) => cell !== 0)) {
        fullRows.push(idx);
      }
    });

    if (fullRows.length > 0) {
      const earned = calculateBonus(fullRows.length);
      sfx.clear(fullRows.length);
      setClearingRows(fullRows);

      if (fullRows.length >= 4) {
        setComboBanner("TETRIS +1000");
      } else if (fullRows.length === 3) {
        setComboBanner("TRIPLE +600");
      } else if (fullRows.length === 2) {
        setComboBanner("DOUBLE +300");
      }

      setTimeout(() => {
        const filtered = newBoard.filter((_, idx) => !fullRows.includes(idx));
        while (filtered.length < BOARD_HEIGHT) {
          filtered.unshift(Array(BOARD_WIDTH).fill(0));
        }

        setScore((s) => s + earned);
        setBoard(filtered);
        setClearingRows([]);
        setComboBanner(null);

        const nextShape = TETROMINOES[nextType]?.shape || getRandomTetromino().shape;
        const newNext = getRandomTetromino();
        setNextType(newNext.type);

        if (checkCollision(nextShape, 3, 0, filtered)) {
          setGameOver(true);
          setRandomQuote(NOTHING_QUOTES[Math.floor(Math.random() * NOTHING_QUOTES.length)]);
          saveHighScore(score + earned);
        } else {
          setCurrentPiece({ shape: nextShape, x: 3, y: 0 });
        }
      }, 200);
    } else {
      setBoard(newBoard);
      const nextShape = TETROMINOES[nextType]?.shape || getRandomTetromino().shape;
      const newNext = getRandomTetromino();
      setNextType(newNext.type);

      if (checkCollision(nextShape, 3, 0, newBoard)) {
        setGameOver(true);
        setRandomQuote(NOTHING_QUOTES[Math.floor(Math.random() * NOTHING_QUOTES.length)]);
        saveHighScore(score);
      } else {
        setCurrentPiece({ shape: nextShape, x: 3, y: 0 });
      }
    }
  }, [board, currentPiece, nextType, checkCollision, score, saveHighScore]);

  const drop = useCallback(() => {
    if (!hasStarted || gameOver || isPaused || countdown !== null || clearingRows.length > 0) return;
    if (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1, board)) {
      setCurrentPiece((prev) => ({ ...prev, y: prev.y + 1 }));
    } else {
      lockPiece();
    }
  }, [hasStarted, currentPiece, board, checkCollision, lockPiece, gameOver, isPaused, countdown, clearingRows.length]);

  const move = useCallback(
    (dir: number) => {
      if (!hasStarted || gameOver || isPaused || countdown !== null || clearingRows.length > 0) return;
      if (!checkCollision(currentPiece.shape, currentPiece.x + dir, currentPiece.y, board)) {
        setCurrentPiece((prev) => ({ ...prev, x: prev.x + dir }));
        sfx.move();
      }
    },
    [hasStarted, currentPiece, board, checkCollision, gameOver, isPaused, countdown, clearingRows.length]
  );

  const handlePauseToggle = () => {
    if (!hasStarted || gameOver || countdown !== null) return;
    if (!isPaused) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
      setCountdown(3);
      sfx.countdown();
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 1) {
      const timer = setTimeout(() => {
        setCountdown((c) => (c !== null ? c - 1 : null));
        sfx.countdown();
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 1) {
      const timer = setTimeout(() => {
        setCountdown(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted) {
        if (e.code === "Space" || e.key === "Enter") {
          startGame();
        }
        return;
      }
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        handlePauseToggle();
        return;
      }
      if (e.key === "m" || e.key === "M") {
        toggleMute();
        return;
      }
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowDown") drop();
      if (e.key === "ArrowUp") rotate();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasStarted, move, drop, rotate, isPaused, countdown, gameOver, isMuted]);

  const dropRef = useRef(drop);
  useEffect(() => {
    dropRef.current = drop;
  });

  useEffect(() => {
    if (!hasStarted || gameOver || isPaused || countdown !== null || clearingRows.length > 0) return;
    const interval = setInterval(() => {
      dropRef.current();
    }, 700);
    return () => clearInterval(interval);
  }, [hasStarted, gameOver, isPaused, countdown, clearingRows.length]);

  const getGhostY = () => {
    let testY = currentPiece.y;
    while (!checkCollision(currentPiece.shape, currentPiece.x, testY + 1, board)) {
      testY++;
    }
    return testY;
  };
  const ghostY = getGhostY();

  // کنترل سوایپ لمسی
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastSwipeXRef = useRef<number>(0);
  const lastSwipeYRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasStarted) return;
    const t = e.touches[0];
    touchStartRef.current = {
      x: t.clientX,
      y: t.clientY,
      time: Date.now(),
    };
    lastSwipeXRef.current = t.clientX;
    lastSwipeYRef.current = t.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!hasStarted || !touchStartRef.current || gameOver || isPaused || countdown !== null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const diffX = currentX - lastSwipeXRef.current;
    const diffY = currentY - lastSwipeYRef.current;

    const HORIZONTAL_THRESHOLD = 26;
    if (Math.abs(diffX) >= HORIZONTAL_THRESHOLD) {
      const direction = diffX > 0 ? 1 : -1;
      move(direction);
      lastSwipeXRef.current = currentX;
    }

    const VERTICAL_THRESHOLD = 32;
    if (diffY >= VERTICAL_THRESHOLD) {
      drop();
      lastSwipeYRef.current = currentY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasStarted || !touchStartRef.current || gameOver || isPaused || countdown !== null) return;
    const touchEndTime = Date.now();
    const duration = touchEndTime - touchStartRef.current.time;

    const changed = e.changedTouches[0];
    const totalDistX = Math.abs(changed.clientX - touchStartRef.current.x);
    const totalDistY = Math.abs(changed.clientY - touchStartRef.current.y);

    if (duration < 250 && totalDistX < 12 && totalDistY < 12) {
      rotate();
    }

    touchStartRef.current = null;
  };

  const startGame = () => {
    sfx.start();
    setHasStarted(true);
  };

  const restartGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setSeconds(0);
    setGameOver(false);
    setIsPaused(false);
    setCountdown(null);
    const p = getRandomTetromino();
    const np = getRandomTetromino();
    setCurrentPiece({ shape: p.shape, x: 3, y: 0 });
    setNextType(np.type);
    sfx.start();
  };

  const nextShape = TETROMINOES[nextType]?.shape || [];
  const topScore = leaderboard[0]?.score || 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative flex min-h-screen flex-col items-center justify-between bg-nothing-black p-4 font-mono text-white select-none overflow-hidden touch-none"
    >
      {/* 
        ---------------------------------------------------------
        منوی استارت به سبک Nothing OS (START SCREEN)
        ---------------------------------------------------------
      */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-between bg-nothing-black/95 p-6 backdrop-blur-lg">
          {/* هدر برند منو */}
          <div className="flex w-full max-w-[340px] items-center justify-between border-b border-nothing-border/80 pb-3 text-xs tracking-widest text-neutral-400">
            <span className="flex items-center gap-2 font-bold text-white">
              <span className="h-2 w-2 rounded-full bg-nothing-red animate-ping"></span>
              OS(01)
            </span>
            <span className="text-[10px] text-neutral-500">NOTHING TETRIS</span>
          </div>

          {/* مرکز صفحه استارت: نشانگر گلیف و لوگو */}
          <div className="flex flex-col items-center text-center my-auto">
            {/* لوگوتایپ ناتینگ */}
            <h1 className="text-4xl font-black tracking-widest text-white mb-1">
              TETRIS<span className="text-nothing-red">(01)</span>
            </h1>
            <p className="text-[11px] tracking-[0.25em] text-neutral-400 mb-8 uppercase">
              Pure Form · Zero Noise
            </p>

            {/* کارت‌های شیشه‌ای وضعیت و راهنما */}
            <div className="flex flex-col gap-2.5 w-full max-w-[260px] mb-8">
              <div className="flex items-center justify-between rounded-xl border border-nothing-border bg-nothing-dark/60 px-4 py-2.5 text-xs backdrop-blur-md">
                <span className="text-neutral-500 tracking-wider text-[11px]">ALL TIME BEST</span>
                <span className="font-bold text-white text-sm">{topScore}</span>
              </div>

              <div className="flex flex-col gap-1 rounded-xl border border-nothing-border bg-nothing-dark/40 p-3 text-[10px] tracking-wider text-neutral-400 text-left">
                <div className="flex justify-between">
                  <span>SWIPE</span>
                  <span className="text-white font-bold">MOVE LEFT / RIGHT</span>
                </div>
                <div className="flex justify-between">
                  <span>TAP</span>
                  <span className="text-white font-bold">ROTATE</span>
                </div>
                <div className="flex justify-between">
                  <span>SWIPE DOWN</span>
                  <span className="text-white font-bold">FAST DROP</span>
                </div>
              </div>
            </div>

            {/* دکمه استارت قرصی‌شکل ناتینگ */}
            <button
              onClick={startGame}
              className="group relative flex items-center justify-center gap-3 rounded-full border border-neutral-300 bg-white px-8 py-3 text-xs font-black tracking-widest text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all hover:bg-neutral-200 active:scale-95"
            >
              <span className="h-2 w-2 rounded-full bg-nothing-red"></span>
              INITIALIZE GRID
            </button>
          </div>

          <div className="text-[9px] tracking-widest text-neutral-600">
            DESIGNED WITH NOTHING SPIRIT · 2026
          </div>
        </div>
      )}

      {/* ناچ بالای صفحه */}
      <div className="w-full max-w-[340px] pt-1">
        <div className="flex items-center justify-between rounded-full border border-nothing-border bg-nothing-dark/90 px-4 py-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isPaused ? "bg-amber-400" : "bg-nothing-red animate-pulse"
              }`}
            ></span>
            <span className="text-[11px] font-black tracking-widest text-white">
              TETRIS<span className="text-neutral-500">(01)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="rounded-full border border-neutral-800 bg-black/50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-neutral-400 transition hover:border-neutral-600 hover:text-white"
            >
              {isMuted ? "MUTED" : "SFX"}
            </button>
            <button
              onClick={() => setShowLeaderboard((s) => !s)}
              className="rounded-full border border-neutral-800 bg-black/50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-neutral-400 transition hover:border-neutral-600 hover:text-white"
            >
              TOP
            </button>
          </div>
        </div>

        <div className="mt-2 flex justify-between px-2 text-[10px] tracking-widest text-neutral-400 border-b border-nothing-border/60 pb-2">
          <span>HI: <b className="text-white">{topScore}</b></span>
          <span>PTS: <b className="text-white">{score}</b></span>
          <span>TIME: <b className="text-white">{formatTime(seconds)}</b></span>
        </div>
      </div>

      {/* ناحیه میانی: بورد اصلی بازی و سایدبار */}
      <div className="relative my-auto flex items-start justify-center gap-3">
        <div className="relative rounded-xl border border-nothing-border bg-nothing-dark/80 p-2 shadow-2xl overflow-hidden">
          
          {comboBanner && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-full border border-nothing-red bg-black/95 px-3 py-1 text-[10px] font-bold tracking-widest text-nothing-red animate-bounce shadow-[0_0_10px_rgba(215,25,33,0.5)]">
              {comboBanner}
            </div>
          )}

          {/* گرید پایه ۱۰ در ۲۰ */}
          <div
            className="grid gap-[1px] bg-nothing-border/70"
            style={{
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
            }}
          >
            {board.map((row, rIdx) => {
              const isClearing = clearingRows.includes(rIdx);
              return row.map((cell, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                  className={`transition-colors duration-100 flex items-center justify-center ${
                    gameOver && cell !== 0
                      ? "bg-neutral-800 scale-75 opacity-0 transition-all duration-700"
                      : isClearing
                      ? "bg-nothing-red shadow-[0_0_14px_rgba(215,25,33,0.9)]"
                      : cell !== 0
                      ? "bg-neutral-200"
                      : "bg-nothing-black"
                  }`}
                />
              ));
            })}
          </div>

          {/* سایه فرود با حرکت Slide */}
          {!gameOver && hasStarted && (
            <div
              className="pointer-events-none absolute top-2 left-2 z-10 transition-all duration-100 ease-out"
              style={{
                transform: `translate(${currentPiece.x * STEP}px, ${ghostY * STEP}px)`,
              }}
            >
              <div
                className="grid gap-[1px]"
                style={{
                  gridTemplateColumns: `repeat(${currentPiece.shape[0].length}, ${CELL_SIZE}px)`,
                }}
              >
                {currentPiece.shape.map((row, rIdx) =>
                  row.map((cell, cIdx) => (
                    <div
                      key={`ghost-${rIdx}-${cIdx}`}
                      style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                      className={`${
                        cell !== 0
                          ? "border border-dashed border-neutral-500 bg-white/5"
                          : "bg-transparent"
                      }`}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* مهره فعال با ترنزیشن سر خوردن نرم */}
          {!gameOver && hasStarted && (
            <div
              className="pointer-events-none absolute top-2 left-2 z-20 transition-all duration-75 ease-out"
              style={{
                transform: `translate(${currentPiece.x * STEP}px, ${currentPiece.y * STEP}px)`,
              }}
            >
              <div
                className="grid gap-[1px]"
                style={{
                  gridTemplateColumns: `repeat(${currentPiece.shape[0].length}, ${CELL_SIZE}px)`,
                }}
              >
                {currentPiece.shape.map((row, rIdx) =>
                  row.map((cell, cIdx) => (
                    <div
                      key={`active-${rIdx}-${cIdx}`}
                      style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                      className={`${
                        cell !== 0
                          ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
                          : "bg-transparent"
                      }`}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* شمارنده معکوس ۳، ۲، ۱ */}
          {countdown !== null && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl">
              <span className="text-5xl font-black tracking-widest text-white animate-ping">
                {countdown}
              </span>
            </div>
          )}

          {/* منوی استپ */}
          {isPaused && countdown === null && !gameOver && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm rounded-xl">
              <span className="text-xs tracking-widest text-neutral-400 mb-1">SYSTEM</span>
              <h3 className="text-xl font-black tracking-widest text-white mb-4">PAUSED</h3>
              <button
                onClick={handlePauseToggle}
                className="rounded-full border border-neutral-600 bg-neutral-900 px-5 py-1.5 text-xs font-bold text-white active:scale-95"
              >
                RESUME
              </button>
            </div>
          )}

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-xl bg-black/90 backdrop-blur-sm p-4 text-center">
              <span className="mb-1 text-[10px] tracking-widest text-neutral-500">SYSTEM FAILURE</span>
              <h2 className="mb-2 text-lg font-black tracking-widest text-nothing-red animate-pulse">
                GAME OVER
              </h2>
              <p className="mb-1 text-xs text-neutral-300">SCORE: {score}</p>
              <p className="mb-3 text-[11px] text-neutral-400 italic">
                "{randomQuote}"
              </p>
              <button
                onClick={restartGame}
                className="rounded-full border border-neutral-400 bg-white px-5 py-1.5 text-xs font-bold text-black transition active:scale-95 hover:bg-neutral-200"
              >
                RESTART
              </button>
            </div>
          )}

          {/* ۵ رکورد برتر */}
          {showLeaderboard && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md rounded-xl p-4">
              <span className="text-xs font-bold tracking-widest text-white mb-3">TOP 5 SCORES</span>
              <div className="flex flex-col gap-2 w-full max-w-[180px] mb-4">
                {leaderboard.length === 0 ? (
                  <span className="text-[11px] text-neutral-500 text-center">NO RECORDS YET</span>
                ) : (
                  leaderboard.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between border-b border-neutral-800 pb-1 text-xs"
                    >
                      <span className="text-neutral-400">#{idx + 1} {item.date}</span>
                      <span className="text-white font-bold">{item.score}</span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-1 text-[10px] tracking-widest text-neutral-300 active:scale-95"
              >
                CLOSE
              </button>
            </div>
          )}
        </div>

        {/* سایدبار: قطعه بعدی و استپ */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center rounded-xl border border-nothing-border bg-nothing-dark/50 p-2.5 min-w-[65px]">
            <span className="mb-2 text-[9px] font-bold tracking-widest text-neutral-500">NEXT</span>
            <div className="flex flex-col gap-[2px]">
              {nextShape.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-[2px]">
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className={`h-2.5 w-2.5 rounded-[1px] ${
                        cell !== 0 ? "bg-white" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePauseToggle}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-nothing-border bg-nothing-dark/60 text-xs font-bold tracking-widest text-neutral-300 active:bg-white active:text-black transition active:scale-95"
            title="Pause / Resume (P)"
          >
            {isPaused ? "▶" : "❚❚"}
          </button>
        </div>
      </div>

      <footer className="w-full max-w-[340px] text-center pb-2 text-[10px] tracking-widest text-neutral-600">
        TAP TO ROTATE · SWIPE TO MOVE
      </footer>
    </div>
  );
}
