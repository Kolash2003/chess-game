import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Chess } from "chess.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const chess = new Chess();

let players = {};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Assign player roles
  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  // Send board state to the new user
  socket.emit("boardState", chess.fen());

  // Handle moves
  socket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && socket.id !== players.white) return;
      if (chess.turn() === "b" && socket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        socket.emit("invalidMove", move);
      }
    } catch (err) {
      console.error("Invalid move:", err);
      socket.emit("invalidMove", move);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.id === players.white) delete players.white;
    if (socket.id === players.black) delete players.black;
  });
});

httpServer.listen(5000, () => {
  console.log("Server is running at http://localhost:5000");
});
