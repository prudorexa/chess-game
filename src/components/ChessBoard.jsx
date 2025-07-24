import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import Square from "./Square";

const moveSound =
  typeof Audio !== "undefined" ? new Audio("/sounds/move.mp3") : null;
const captureSound =
  typeof Audio !== "undefined" ? new Audio("/sounds/capture_sound.mp3") : null;
const gameOverSound =
  typeof Audio !== "undefined" ? new Audio("/sounds/gameover.mp3") : null;
const checkSound =
  typeof Audio !== "undefined" ? new Audio("/sounds/check_sound.mp3") : null;
const backgroundLoopSound =
  typeof Audio !== "undefined"
    ? new Audio("/sounds/background_loop.mp3")
    : null;
const gameLoseSound =
  typeof Audio !== "undefined" ? new Audio("/sounds/game_lose.mp3") : null;
const gameStartSound =
  typeof Audio !== "undefined" ? new Audio("/sounds/game_start.mp3") : null;
const uiclickSound =
  typeof Audio !== "undefined" ? new Audio("/sounds/ui_click.mp3") : null;

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const ChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [showConfirm, setShowConfirm] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [theme, setTheme] = useState("light");
  const [difficulty, setDifficulty] = useState("easy");
  const [showInstructions, setShowInstructions] = useState(false);
  const [score, setScore] = useState({
    white: 0,
    black: 0,
    draws: 0,
    total: 0,
  });
  const [timer, setTimer] = useState({ white: 300, black: 300 });
  const historyRef = useRef(null);
  const timerRef = useRef(null);

  const isBotTurn = game.turn() === "b";

  const playSound = (type) => {
    switch (type) {
      case "move":
        moveSound?.play();
        break;
      case "capture":
        captureSound?.play();
        break;
      case "check":
        checkSound?.play();
        break;
      case "gameover":
        gameOverSound?.play();
        break;
      case "background":
        if (backgroundLoopSound) {
          backgroundLoopSound.loop = true;
          backgroundLoopSound.play();
        }
        break;
      case "gameStart":
        gameStartSound?.play();
        break;
      case "gameLose":
        gameLoseSound?.play();
        break;
      case "uiClick":
        uiclickSound?.play();
        break;
      default:
        break;
    }
  };

  const handleDrop = (from, to) => {
    const piece = game.get(from);
    if (!piece || piece.color !== game.turn()) return;

    const move = game.move({ from, to });
    if (move) {
      if (move.captured) playSound("capture");
      else if (game.inCheck()) playSound("check");
      else playSound("move");

      setGame(new Chess(game.fen()));
      setMoveHistory(game.history({ verbose: true }));
      if (game.isGameOver()) handleGameOver();
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    playSound("gameover");
    clearInterval(timerRef.current);

    let updatedScore = { ...score, total: score.total + 1 };
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      setResultMessage(`${winner} wins by checkmate! 🎉`);
      updatedScore[winner.toLowerCase()]++;
    } else if (game.isDraw()) {
      setResultMessage("Game Over - It's a draw!");
      updatedScore.draws++;
    } else {
      setResultMessage("Game Over");
    }
    setScore(updatedScore);
  };

  const confirmRestart = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setShowConfirm(false);
    setGameOver(false);
    setResultMessage("");
    setTimer({ white: 300, black: 300 });
  };

  const renderSquare = (rank, file) => {
    const square = `${file}${rank}`;
    const piece = game.get(square);
    const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0;

    return (
      <Square
        key={square}
        position={square}
        piece={piece}
        isLight={isLight}
        onDrop={handleDrop}
      >
        {piece && (
          <img
            src={`/pieces/${piece.color}_${piece.type}.png`}
            alt={`${piece.color} ${piece.type}`}
            className="w-full h-full object-contain"
            draggable="false"
          />
        )}
      </Square>
    );
  };

  const getBestMove = (moves) => {
    if (difficulty === "easy")
      return moves[Math.floor(Math.random() * moves.length)];
    if (difficulty === "medium")
      return moves.sort(
        (a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0)
      )[0];

    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
    return moves.sort((a, b) => {
      const valA = a.captured ? pieceValues[a.captured.toLowerCase()] || 0 : 0;
      const valB = b.captured ? pieceValues[b.captured.toLowerCase()] || 0 : 0;
      return valB - valA;
    })[0];
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (gameOver) return;
      setTimer((prev) => {
        const color = game.turn() === "w" ? "white" : "black";
        if (prev[color] <= 0) {
          clearInterval(timerRef.current);
          setGameOver(true);
          setResultMessage(
            `${color === "white" ? "Black" : "White"} wins by timeout!`
          );
          setScore((s) => ({
            ...s,
            total: s.total + 1,
            [color === "white" ? "black" : "white"]:
              s[color === "white" ? "black" : "white"] + 1,
          }));
          return prev;
        }
        return { ...prev, [color]: prev[color] - 1 };
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [game.turn(), gameOver]);

  useEffect(() => {
    if (!isBotTurn || game.isGameOver()) return;

    const timeout = setTimeout(
      () => {
        const moves = game.moves({ verbose: true });
        if (moves.length > 0) {
          const bestMove = getBestMove(moves);
          const captured = !!game.get(bestMove.to);
          const isCheck = game.in_check();

          game.move({ from: bestMove.from, to: bestMove.to });

          if (captured) playSound("capture");
          else if (isCheck) playSound("check");
          else playSound("move");

          setGame(new Chess(game.fen()));
          setMoveHistory(game.history({ verbose: true }));

          if (game.isGameOver()) handleGameOver();
        }
      },
      difficulty === "easy" ? 800 : difficulty === "medium" ? 400 : 200
    );

    return () => clearTimeout(timeout);
  }, [game, isBotTurn, difficulty]);

  useEffect(() => {
    if (historyRef.current)
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [moveHistory]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      className={
        theme === "dark"
          ? "bg-gray-900 text-white min-h-screen"
          : "bg-gray-100 text-gray-900 min-h-screen"
      }
    >
      <nav className="flex justify-between items-center px-6 py-4 shadow bg-gradient-to-r from-green-600 to-lime-500 text-white">
        <h1 className="text-gray-950 text-xl font-bold">♛ Chess Game</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setShowInstructions(true)}
            className="bg-white text-black rounded px-3 py-1 hover:bg-gray-100"
          >
            📜 Instructions
          </button>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded px-2 py-1 text-black"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            className="bg-white text-black rounded px-3 py-1"
          >
            {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      <div className="flex flex-col items-center mt-6 ml-3 mr-0.5 w-full max-w-7xl mx-auto">
        <div className="mb-2 text-lg font-semibold">
          {game.turn() === "w" ? "♙ Your move" : "♟ Bot is thinking..."}
        </div>

        <div className="flex gap-6 flex-wrap justify-center">
          <div className="grid grid-cols-8 border-4 border-black">
            {ranks.map((rank) => files.map((file) => renderSquare(rank, file)))}
          </div>

          <div
            className="bg-gray-100 text-black w-40 h-[512px] mr-3 ml-0 rounded shadow-md p-2 overflow-y-auto"
            ref={historyRef}
          >
            <h3 className="text-lg font-bold mb-2 m-1 mr-0 ml-0 text-center">
              Moves
            </h3>
            {moveHistory.map((move, idx) => (
              <div
                key={idx}
                className="text-sm py-0.5 border-b border-gray-200"
              >
                {Math.floor(idx / 2) + 1}.{" "}
                {move.color === "w" ? move.san : "... " + move.san}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center text-lg space-y-1 transition-all duration-300 ease-in-out">
          <div>Total Games: {score.total}</div>
          <div>♙ White Wins: {score.white}</div>
          <div>♟ Black Wins: {score.black}</div>
          <div>🤝 Draws: {score.draws}</div>
        </div>

        <div className="mt-4 flex gap-8 text-lg transition-all duration-300 ease-in-out">
          <div>♙ White ⏱️ {formatTime(timer.white)}</div>
          <div>♟ Black ⏱️ {formatTime(timer.black)}</div>
        </div>

        <div className="mt-4 transition-all duration-300 ease-in-out">
          <button
            onClick={() => setShowConfirm(true)}
            className="mb-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            ♻️ Restart Game
          </button>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300 ease-in-out">
            <div className="bg-white rounded-lg p-6 text-center shadow-lg text-black">
              <h2 className="text-xl font-bold mb-4">Confirm Restart</h2>
              <p className="mb-4">Are you sure you want to restart the game?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={confirmRestart}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  Yes, Restart
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 text-center text-black w-80">
              <h2 className="text-xl font-bold mb-4">{resultMessage}</h2>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                onClick={confirmRestart}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
        {showInstructions && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-all duration-300 ease-in-out">
    <div className="bg-white rounded-xl shadow-xl p-6 text-black w-[90%] max-w-2xl max-h-[80vh] overflow-y-auto relative">
      <h2 className="text-2xl font-bold mb-4 text-center">📜 How to Play Chess</h2>
      <p className="mb-2">Welcome to our chess game! Here’s a quick guide:</p>

      <ul className="list-disc list-inside space-y-2 text-sm leading-6">
        <li><strong>Objective:</strong> Checkmate your opponent’s king.</li>
        <li><strong>Turns:</strong> White goes first. Players alternate turns.</li>
        <li><strong>Moves:</strong> Each piece has its own movement pattern. Pawns move forward but capture diagonally. Knights jump in L-shapes, bishops move diagonally, rooks in straight lines, queens do both, and kings one square in any direction.</li>
        <li><strong>Check:</strong> When your king is under attack, it's in check. You must protect it on your next move.</li>
        <li><strong>Checkmate:</strong> When the king is in check and cannot escape, the game ends.</li>
        <li><strong>Draws:</strong> The game can end in a draw if no legal moves are available or by stalemate.</li>
        <li><strong>Timer:</strong> Each side has 5 minutes. Don’t let your time run out!</li>
        <li><strong>AI Levels:</strong> Easy (random), Medium (captures), Hard (smart captures).</li>
      </ul>

      <p className="mt-4 text-sm italic text-gray-600">🎮 Tip: Click a piece to drag and drop it to a valid square.</p>

      <div className="mt-6 text-center transition-all duration-300 ease-in-out">
        <button
          onClick={() => setShowInstructions(false)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Got it! Let’s Play ♟️
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default ChessBoard;
