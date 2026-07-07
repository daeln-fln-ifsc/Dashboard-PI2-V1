import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { Server } from "socket.io";

import { iniciarMQTT } from "./mqtt";
import { apiRoutes } from "./routes/api";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";

const app = express();

// Configuração de CORS para o Deploy Híbrido (IFSC + Cloudflare)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://aguasvivas.eco.br",
  "https://www.aguasvivas.eco.br"
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite se não houver origin (ex: mobile) ou se estiver na lista ou se for Cloudflare temporário
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".trycloudflare.com")) {
      callback(null, true);
    } else {
      callback(new Error("Não permitido pelo CORS"));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Serve the frontend static files
const frontendPath = path.join(__dirname, "../../dist");
app.use(express.static(frontendPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, "index.html"));
  } else {
    next();
  }
});

io.on("connection", (socket) => {
  console.log("Frontend conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("Frontend desconectado:", socket.id);
  });
});

iniciarMQTT(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});