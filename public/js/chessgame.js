const socket = io();
const chess = new Chess();
const chessboard = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Unicode map
const getPieceUnicode = (piece) => {
  const unicodeMap = {
    p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚", // black
    P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔", // white
  };
  return unicodeMap[piece.color === "w" ? piece.type.toUpperCase() : piece.type];
};

const convertToSquare = (row, col) => {
  const files = "abcdefgh";
  const ranks = "87654321";
  return files[col] + ranks[row];
};

const renderBoard = () => {
  const board = chess.board();
  chessboard.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareElement = document.createElement("div");
      squareElement.className = `square ${(rowIndex + colIndex) % 2 === 0 ? "light" : "dark"}`;
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.className = `piece ${square.color === "w" ? "white" : "black"}`;
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: colIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => e.preventDefault());

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece && sourceSquare) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col)
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      chessboard.appendChild(squareElement);
    });
  });
};

const handleMove = (source, target) => {
  const move = {
    from: convertToSquare(source.row, source.col),
    to: convertToSquare(target.row, target.col),
    promotion: "q"
  };
  socket.emit("move", move);
};

// Socket events
socket.on("playerRole", (role) => {
  playerRole = role.trim();
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

socket.on("invalidMove", () => {
  alert("Invalid move!");
});

renderBoard();
