import { createFileRoute } from "@tanstack/react-router";
import { Clock3, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSudokuGame, hasConflict, isSolved, type SudokuGrid } from "@/lib/sudoku";

export const Route = createFileRoute("/")({
  loader: () => createSudokuGame(30),
  head: () => ({
    meta: [
      { title: "Sudoku  E" },
      {
        name: "description",
        content: "Jogue Sudok com novos tabuleiros, cronômetro e uma celebração ao vencer.",
      },
      { property: "og:title", content: "Sudoku - E" },
      {
        property: "og:description",
        content: "Um Sudoku responsivo com partidas sempre novas e uma vitória explosiva.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sudoku,
});

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

const copyGrid = (grid: SudokuGrid) => grid.map((row) => [...row]);

function Sudoku() {
  const initialGame = Route.useLoaderData();
  const [game, setGame] = useState(initialGame);
  const [grid, setGrid] = useState(() => copyGrid(game.puzzle));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (completed) return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [completed]);

  const enterNumber = useCallback(
    (value: number) => {
      if (!selected || completed) return;
      const [row, column] = selected;
      if ((game.puzzle[row]?.[column] ?? 0) !== 0) return;

      const nextGrid = copyGrid(grid);
      const nextRow = nextGrid[row];
      if (!nextRow) return;
      nextRow[column] = value;
      setGrid(nextGrid);
      setHasPlayed(true);
      if (value > 0 && isSolved(nextGrid)) setCompleted(true);
    },
    [completed, game, grid, selected],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (/^[1-9]$/.test(event.key)) enterNumber(Number(event.key));
      if (event.key === "0" || event.key === "Backspace" || event.key === "Delete") enterNumber(0);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enterNumber]);

  const startNewGame = () => {
    const nextGame = createSudokuGame(30);
    setGame(nextGame);
    setGrid(copyGrid(nextGame.puzzle));
    setSelected(null);
    setSeconds(0);
    setCompleted(false);
    setHasPlayed(false);
  };

  const selectCell = (row: number, column: number) => {
    setSelected([row, column]);
    if ((game.puzzle[row]?.[column] ?? 0) === 0) {
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    }
  };

  const selectedValue = selected ? (grid[selected[0]]?.[selected[1]] ?? 0) : 0;

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="ambient-grid" aria-hidden="true" />
      {completed && <Fireworks />}

      <section className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-3 py-5 sm:px-6 sm:py-8 lg:py-10">
        <h1 className="sr-only">Sudoku - E</h1>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
          <div className={cn("board-shell", completed && "board-complete")}>
            <div className="sudoku-board" role="grid" aria-label="Tabuleiro de Sudoku">
              {grid.map((row, rowIndex) =>
                row.map((value, columnIndex) => {
                  const isSelected = selected?.[0] === rowIndex && selected[1] === columnIndex;
                  const sameUnit = selected
                    ? selected[0] === rowIndex ||
                      selected[1] === columnIndex ||
                      (Math.floor(selected[0] / 3) === Math.floor(rowIndex / 3) &&
                        Math.floor(selected[1] / 3) === Math.floor(columnIndex / 3))
                    : false;
                  const sameValue = selectedValue > 0 && value === selectedValue;
                  const isFixed = (game.puzzle[rowIndex]?.[columnIndex] ?? 0) !== 0;
                  const conflict = !isFixed && hasConflict(grid, rowIndex, columnIndex);

                  return (
                    <button
                      key={`${rowIndex}-${columnIndex}`}
                      type="button"
                      role="gridcell"
                      aria-label={`Linha ${rowIndex + 1}, coluna ${columnIndex + 1}${value ? `, número ${value}` : ", vazia"}`}
                      aria-selected={isSelected}
                      className={cn(
                        "sudoku-cell",
                        sameUnit && "cell-unit",
                        sameValue && "cell-match",
                        isSelected && "cell-selected",
                        isFixed ? "cell-fixed" : "cell-player",
                        conflict && "cell-error",
                        columnIndex === 2 || columnIndex === 5 ? "cell-block-right" : "",
                        rowIndex === 2 || rowIndex === 5 ? "cell-block-bottom" : "",
                      )}
                      onClick={() => selectCell(rowIndex, columnIndex)}
                    >
                      {value || ""}
                    </button>
                  );
                }),
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            className="mobile-number-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            aria-label="Digite um número de 1 a 9; zero apaga"
            onChange={(event) => {
              const digit = event.target.value.replace(/\D/g, "").slice(-1);
              if (digit !== "") enterNumber(Number(digit));
              event.target.value = "";
            }}
          />

          <div className="mt-4 grid grid-cols-9 gap-1.5 md:hidden" aria-label="Teclado numérico">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <Button
                key={number}
                variant="outline"
                className="number-key h-10 min-w-0 px-0 font-mono text-base sm:h-11 sm:text-lg"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => enterNumber(number)}
              >
                {number}
              </Button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-2 sm:mt-4">
            <div className="timer shrink-0" aria-label={`Tempo da rodada: ${formatTime(seconds)}`}>
              <Clock3 aria-hidden="true" />
              <time dateTime={`PT${seconds}S`}>{formatTime(seconds)}</time>
            </div>
            {hasPlayed && !completed ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" className="h-11 w-full uppercase tracking-wider">
                    <RotateCcw aria-hidden="true" /> Nova partida
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[calc(100%-2rem)] border-primary/40">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Começar outra partida?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Seu progresso atual será apagado e um novo tabuleiro será gerado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continuar jogando</AlertDialogCancel>
                    <AlertDialogAction onClick={startNewGame}>Reiniciar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                type="button"
                className="h-11 w-full uppercase tracking-wider"
                onClick={startNewGame}
              >
                <RotateCcw aria-hidden="true" /> Nova partida
              </Button>
            )}
          </div>
        </div>
      </section>

      {completed && (
        <AlertDialog open>
          <AlertDialogContent className="max-w-[calc(100%-2rem)] border-primary/50 text-center sm:max-w-sm">
            <AlertDialogHeader className="items-center sm:text-center">
              <div className="mb-2 flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                <Trophy className="size-7" aria-hidden="true" />
              </div>
              <AlertDialogTitle className="flex items-center justify-center gap-2 text-2xl">
                Parabéns!
                <Sparkles className="size-5 text-primary" aria-hidden="true" />
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Você completou o tabuleiro em {formatTime(seconds)}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogAction className="w-full uppercase tracking-wider" onClick={startNewGame}>
                <RotateCcw aria-hidden="true" /> Tentar novamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </main>
  );
}

function Fireworks() {
  return (
    <div className="fireworks" aria-hidden="true">
      {[0, 1, 2].map((burst) => (
        <div key={burst} className={`firework firework-${burst + 1}`}>
          {Array.from({ length: 18 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      ))}
    </div>
  );
}
