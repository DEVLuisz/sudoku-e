export type SudokuGrid = number[][];

export interface SudokuGame {
  puzzle: SudokuGrid;
  solution: SudokuGrid;
}

const BASE = 3;
const SIDE = BASE * BASE;

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    const swap = copy[swapIndex];
    if (current === undefined || swap === undefined) continue;
    copy[index] = swap;
    copy[swapIndex] = current;
  }
  return copy;
}

const pattern = (row: number, column: number) =>
  (BASE * (row % BASE) + Math.floor(row / BASE) + column) % SIDE;

export function createSudokuGame(clues = 40): SudokuGame {
  const groups = [0, 1, 2];
  const rows = shuffled(groups).flatMap((group) =>
    shuffled(groups).map((row) => group * BASE + row),
  );
  const columns = shuffled(groups).flatMap((group) =>
    shuffled(groups).map((column) => group * BASE + column),
  );
  const numbers = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const solution = rows.map((row) =>
    columns.map((column) => numbers[pattern(row, column)] ?? 0),
  );
  const puzzle = solution.map((row) => [...row]);
  const cells = shuffled(Array.from({ length: SIDE * SIDE }, (_, index) => index));

  cells.slice(0, SIDE * SIDE - clues).forEach((cell) => {
    const row = Math.floor(cell / SIDE);
    const column = cell % SIDE;
    const puzzleRow = puzzle[row];
    if (puzzleRow) puzzleRow[column] = 0;
  });

  return { puzzle, solution };
}

export function hasConflict(grid: SudokuGrid, row: number, column: number): boolean {
  const value = grid[row]?.[column] ?? 0;
  if (value === 0) return false;

  for (let index = 0; index < SIDE; index += 1) {
    if (index !== column && grid[row]?.[index] === value) return true;
    if (index !== row && grid[index]?.[column] === value) return true;
  }

  const blockRow = Math.floor(row / BASE) * BASE;
  const blockColumn = Math.floor(column / BASE) * BASE;
  for (let rowOffset = 0; rowOffset < BASE; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < BASE; columnOffset += 1) {
      const checkRow = blockRow + rowOffset;
      const checkColumn = blockColumn + columnOffset;
      if (checkRow === row && checkColumn === column) continue;
      if (grid[checkRow]?.[checkColumn] === value) return true;
    }
  }
  return false;
}

export function isSolved(grid: SudokuGrid): boolean {
  const completeSet = (values: number[]) =>
    values.length === SIDE && new Set(values).size === SIDE && values.every((value) => value >= 1 && value <= SIDE);

  if (!grid.every(completeSet)) return false;

  for (let index = 0; index < SIDE; index += 1) {
    const column = grid.map((row) => row[index] ?? 0);
    if (!completeSet(column)) return false;
  }

  for (let blockRow = 0; blockRow < BASE; blockRow += 1) {
    for (let blockColumn = 0; blockColumn < BASE; blockColumn += 1) {
      const block: number[] = [];
      for (let row = blockRow * BASE; row < blockRow * BASE + BASE; row += 1) {
        for (let column = blockColumn * BASE; column < blockColumn * BASE + BASE; column += 1) {
          block.push(grid[row]?.[column] ?? 0);
        }
      }
      if (!completeSet(block)) return false;
    }
  }

  return true;
}