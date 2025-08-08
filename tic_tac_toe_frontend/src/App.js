import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Tic Tac Toe - responsive, modern, minimal React UI
 * Features: 2-player & AI modes, local score, animation, responsive, light theme
 */

// Utilities
const emptyBoard = () => Array(9).fill(null);
const winLines = [
  [0, 1, 2],  [3, 4, 5],  [6, 7, 8], // rows
  [0, 3, 6],  [1, 4, 7],  [2, 5, 8], // cols
  [0, 4, 8],  [2, 4, 6],             // diags
];

// PUBLIC_INTERFACE
function App() {
  // THEME
  const [theme] = useState("light"); // lock to light for this app
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // GAME SETTINGS & STATE
  const [mode, setMode] = useState("AI"); // "AI" or "2P"
  const [board, setBoard] = useState(emptyBoard());
  const [isXNext, setIsXNext] = useState(true); // X always starts
  const [status, setStatus] = useState("");
  const [winnerLine, setWinnerLine] = useState(null);
  const [scores, setScores] = useState(() => {
    let persisted;
    try {
      persisted = JSON.parse(localStorage.getItem("tic_tac_toe_scores") || "{}");
    } catch {
      persisted = {};
    }
    return { user1: persisted.user1 || 0, user2: persisted.user2 || 0, draw: persisted.draw || 0 };
  });
  const [animCells, setAnimCells] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // PLAYER SYMBOLS
  const player1 = "X";
  const player2 = mode === "AI" ? "AI" : "O";

  // PUBLIC_INTERFACE
  function calcWinner(b) {
    for (let line of winLines) {
      const [a, b_, c] = line;
      if (b[a] && b[a] === b[b_] && b[a] === b[c]) {
        return {winner: b[a], line};
      }
    }
    if (b.every(Boolean)) return {winner: "draw", line: null};
    return null;
  }

  // PUBLIC_INTERFACE
  function handleClick(idx) {
    if (board[idx] || gameOver) return;
    const moveBy = isXNext ? player1 : player2;
    const updated = board.slice();
    updated[idx] = moveBy;
    setBoard(updated);
    setAnimCells([idx]);
    const result = calcWinner(updated);
    if (result) {
      setGameOver(true);
      setWinnerLine(result.line);
      updateScores(result.winner);
    }
    setIsXNext((prev) => !prev);
  }

  // PUBLIC_INTERFACE
  function updateScores(winner) {
    setScores((prev) => {
      const next = {...prev};
      if (winner === "draw") next.draw += 1;
      else if (winner === "X") next.user1 += 1;
      else next.user2 += 1;
      localStorage.setItem("tic_tac_toe_scores", JSON.stringify(next));
      return next;
    });
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    setBoard(emptyBoard());
    setIsXNext(true);
    setWinnerLine(null);
    setAnimCells([]);
    setGameOver(false);
  }

  // PUBLIC_INTERFACE
  function handleModeChange(newMode) {
    setMode(newMode);
    handleRestart();
    setTimeout(() => {
      setScores({user1: 0, user2: 0, draw: 0});
      localStorage.setItem("tic_tac_toe_scores", JSON.stringify({user1: 0, user2: 0, draw: 0}));
    }, 350);
  }

  // PUBLIC_INTERFACE: AI logic (minimax for unbeatable, but fast random easy)
  function aiMove(b) {
    // simple: block win, take win, otherwise random
    const emptyIdxs = b.map((v, i) => (v === null ? i : null)).filter(v => v !== null);
    // Try to win or block
    for (const sym of [player2, player1]) {
      for (let idx of emptyIdxs) {
        const copy = [...b];
        copy[idx] = sym;
        if (calcWinner(copy)?.winner === sym) return idx;
      }
    }
    // Otherwise random
    return emptyIdxs[Math.floor(Math.random() * emptyIdxs.length)];
  }

  // AI move effect
  useEffect(() => {
    if (
      mode === "AI" &&
      !gameOver &&
      !isXNext // AI is O
    ) {
      const timeout = setTimeout(() => {
        const idx = aiMove(board);
        if (idx !== undefined) handleClick(idx);
      }, 650); // small delay for realism
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line
  }, [isXNext, mode, gameOver, board]);

  // Status Updates
  useEffect(() => {
    const result = calcWinner(board);
    if (result) {
      if (result.winner === "draw") setStatus("Draw!");
      else setStatus(result.winner === "X" ? (mode === "AI" ? "You win!" : "Player X wins!") : (mode === "AI" ? "AI wins!" : "Player O wins!"));
    } else {
      setStatus(
        (mode === "AI"
          ? (isXNext ? "Your move" : "AI is thinking...")
          : isXNext
          ? "X's turn"
          : "O's turn"
        )
      );
    }
    // eslint-disable-next-line
  }, [board, isXNext, mode, gameOver]);

  // Animation reset
  useEffect(() => {
    if (animCells.length > 0) {
      const timer = setTimeout(() => setAnimCells([]), 300);
      return () => clearTimeout(timer);
    }
  }, [animCells]);

  // Game Board Cell
  function renderCell(idx) {
    let highlight = "";
    if (winnerLine && winnerLine.includes(idx)) highlight = "cell-win";
    else if (animCells.includes(idx)) highlight = "cell-anim";
    return (
      <button
        className={`ttt-cell ${highlight}`}
        onClick={() => (mode === "AI" && !isXNext && !gameOver ? null : handleClick(idx))}
        disabled={Boolean(board[idx]) || gameOver || (mode === "AI" && !isXNext)}
        key={idx}
        aria-label={`Cell ${idx + 1} ${board[idx] ? board[idx] : ""}`}
      >
        {board[idx]}
      </button>
    );
  }

  // PUBLIC_INTERFACE
  return (
    <div className="App tic-tac-toe-bg">
      <header className="ttt-header" data-theme={theme}>
        <h1 className="ttt-title">
          <span role="img" aria-label="tictactoe">❌⭕️</span> Tic Tac Toe
        </h1>
        <div className="ttt-mode-picker" role="group" aria-label="Game mode">
          <button
            className={`ttt-mode${mode === "AI" ? " selected" : ""}`}
            onClick={() => handleModeChange("AI")}
            disabled={mode === "AI"}
          >
            <span role="img" aria-label="AI">🤖</span> vs AI
          </button>
          <button
            className={`ttt-mode${mode === "2P" ? " selected" : ""}`}
            onClick={() => handleModeChange("2P")}
            disabled={mode === "2P"}
          >
            <span role="img" aria-label="2 players">👥</span> 2 Player
          </button>
        </div>
      </header>
      <main className="ttt-main">
        <div className="ttt-board-container">
          <div className="ttt-board" role="grid" aria-label="Tic Tac Toe Board">
            {Array(9).fill(null).map((_, idx) => renderCell(idx))}
          </div>
          <div className="ttt-status">{status}</div>
          <button className="ttt-restart" onClick={handleRestart}>
            New Game
          </button>
        </div>
        <aside className="ttt-scoreboard" aria-label="Scoreboard">
          <div className="ttt-score-row ttt-score-x">
            <span className="ttt-score-label">{mode === "AI" ? "You (X)" : "Player X"}</span>
            <span className="ttt-score-val">{scores.user1}</span>
          </div>
          <div className="ttt-score-row ttt-score-o">
            <span className="ttt-score-label">{mode === "AI" ? "AI (O)" : "Player O"}</span>
            <span className="ttt-score-val">{scores.user2}</span>
          </div>
          <div className="ttt-score-row ttt-score-draw">
            <span className="ttt-score-label">Draw</span>
            <span className="ttt-score-val">{scores.draw}</span>
          </div>
        </aside>
      </main>
      <footer className="ttt-footer">
        <span>
          <a className="ttt-link" href="https://react.dev/" target="_blank" rel="noopener noreferrer">
            React
          </a>
          {" | "}UI by Kavia
        </span>
      </footer>
    </div>
  );
}

export default App;
