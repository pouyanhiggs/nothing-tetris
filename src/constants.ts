// ابعاد استاندارد زمین تتریس
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// ۷ قطعه استاندارد تتریس بر اساس ماتریس ۴x۴ یا ۳x۳
export const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  },
};

export type TetrominoType = keyof typeof TETROMINOES;

// تابع کمکی برای انتخاب تصادفی یکی از قطعات
export function getRandomTetromino(): { type: TetrominoType; shape: number[][] } {
  const keys = Object.keys(TETROMINOES) as TetrominoType[];
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return {
    type: randKey,
    shape: TETROMINOES[randKey].shape,
  };
}

// ساخت یک صفحه خالی اولیه (ماتریس ۱۰x۲۰ با مقدار ۰)
export function createEmptyBoard(): number[][] {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(0)
  );
}
