import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

// Interfaces
interface StoredUser {
  id: string;
  email?: string;
  googleId?: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarUrl?: string;
  passwordHash?: string;
  passwordSalt?: string;
  createdAt: number;
}

interface SafeUser {
  id: string;
  email?: string;
  googleId?: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarUrl?: string;
  createdAt: number;
}

interface UserConnection {
  id: string;
  name: string;
  avatar?: string;
  avatarColor: string;
  roomId: string;
  ws: WebSocket;
  isStreaming: boolean;
  isMuted: boolean;
  isDeaf: boolean;
  hasCamera: boolean;
  streamTitle?: string;
  joinedAt: number;
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  avatarColor?: string;
  text: string;
  timestamp: number;
  type: "text" | "system" | "reaction";
}

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "dmg-liveshare-secret-key-2026-auth";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "986855077085-ba6jsg0nkt7s3oj78mersmgqard7usqg.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

app.use(express.json());

// Persistent User Store
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let usersDB: Map<string, StoredUser> = new Map();

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const list: StoredUser[] = JSON.parse(data);
      usersDB.clear();
      for (const u of list) {
        usersDB.set(u.username.toLowerCase(), u);
      }
      console.log(`Loaded ${usersDB.size} users from database.`);
    }
  } catch (err) {
    console.error("Error loading users database:", err);
  }
}

function saveUsers() {
  try {
    const list = Array.from(usersDB.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving users database:", err);
  }
}

loadUsers();

// Auth Helpers
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function createToken(user: SafeUser): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      googleId: user.googleId,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      avatarUrl: user.avatarUrl,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

function verifyToken(token: string): SafeUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSig = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (decoded.exp && Date.now() > decoded.exp) return null;

    return {
      id: decoded.id,
      email: decoded.email,
      googleId: decoded.googleId,
      username: decoded.username,
      displayName: decoded.displayName,
      avatarColor: decoded.avatarColor,
      avatarUrl: decoded.avatarUrl,
      createdAt: decoded.createdAt || Date.now(),
    };
  } catch {
    return null;
  }
}

function toSafeUser(user: StoredUser): SafeUser {
  return {
    id: user.id,
    email: user.email,
    googleId: user.googleId,
    username: user.username,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

// In-memory room and client store
const rooms = new Map<string, Map<string, UserConnection>>();
const roomMessages = new Map<string, ChatMessage[]>();

// WebSocket Server attached to HTTP server
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const pathname = request.url ? request.url.split("?")[0] : "";
  if (pathname.endsWith("/ws") || pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
  const roomUsers = rooms.get(roomId);
  if (!roomUsers) return;

  const payload = JSON.stringify(message);
  for (const [userId, user] of roomUsers.entries()) {
    if (excludeUserId && userId === excludeUserId) continue;
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(payload);
    }
  }
}

function getRoomUsersList(roomId: string) {
  const roomUsers = rooms.get(roomId);
  if (!roomUsers) return [];
  return Array.from(roomUsers.values()).map((u) => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    avatarColor: u.avatarColor,
    isStreaming: u.isStreaming,
    isMuted: u.isMuted,
    isDeaf: u.isDeaf,
    hasCamera: u.hasCamera,
    streamTitle: u.streamTitle,
    joinedAt: u.joinedAt,
  }));
}

wss.on("connection", (ws: WebSocket) => {
  let currentUser: UserConnection | null = null;

  ws.on("message", (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      switch (data.type) {
        case "join-room": {
          const { roomId, userId, name, avatar, avatarColor } = data;
          if (!roomId || !userId) return;

          // Clean up prior room if user was in one
          if (currentUser && currentUser.roomId !== roomId) {
            const oldRoom = rooms.get(currentUser.roomId);
            if (oldRoom) {
              oldRoom.delete(currentUser.id);
              broadcastToRoom(currentUser.roomId, {
                type: "user-left",
                userId: currentUser.id,
                name: currentUser.name,
              });
            }
          }

          currentUser = {
            id: userId,
            name: name || `Gamer-${userId.slice(0, 4)}`,
            avatar: avatar || undefined,
            avatarColor: avatarColor || "#6366f1",
            roomId,
            ws,
            isStreaming: false,
            isMuted: false,
            isDeaf: false,
            hasCamera: false,
            joinedAt: Date.now(),
          };

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
            roomMessages.set(roomId, []);
          }

          const currentRoom = rooms.get(roomId)!;
          currentRoom.set(userId, currentUser);

          // Send current room members and recent messages to newcomer
          const usersList = getRoomUsersList(roomId);
          const messages = roomMessages.get(roomId)?.slice(-50) || [];

          ws.send(
            JSON.stringify({
              type: "room-joined",
              roomId,
              userId,
              users: usersList,
              messages,
            })
          );

          // Broadcast to all other users in room
          broadcastToRoom(
            roomId,
            {
              type: "user-joined",
              user: {
                id: currentUser.id,
                name: currentUser.name,
                avatar: currentUser.avatar,
                avatarColor: currentUser.avatarColor,
                isStreaming: currentUser.isStreaming,
                isMuted: currentUser.isMuted,
                isDeaf: currentUser.isDeaf,
                hasCamera: currentUser.hasCamera,
                joinedAt: currentUser.joinedAt,
              },
            },
            userId
          );

          // Send system chat message
          const joinMsg: ChatMessage = {
            id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            roomId,
            senderId: "system",
            senderName: "Sistema",
            avatarColor: "#10b981",
            text: `${currentUser.name} entrou na sala.`,
            timestamp: Date.now(),
            type: "system",
          };
          roomMessages.get(roomId)?.push(joinMsg);
          broadcastToRoom(roomId, { type: "chat-message", message: joinMsg });
          break;
        }

        case "signal": {
          // WebRTC signaling relay (offer / answer / ice-candidate)
          const { targetId, signalData, streamType } = data;
          if (!currentUser || !targetId) return;

          const targetRoom = rooms.get(currentUser.roomId);
          const targetUser = targetRoom?.get(targetId);

          if (targetUser && targetUser.ws.readyState === WebSocket.OPEN) {
            targetUser.ws.send(
              JSON.stringify({
                type: "signal",
                senderId: currentUser.id,
                senderName: currentUser.name,
                avatarColor: currentUser.avatarColor,
                avatar: currentUser.avatar,
                signalData,
                streamType: streamType || "screen",
              })
            );
          }
          break;
        }

        case "update-status": {
          if (!currentUser) return;
          const { isStreaming, isMuted, isDeaf, hasCamera, streamTitle } = data;

          if (isStreaming !== undefined) currentUser.isStreaming = isStreaming;
          if (isMuted !== undefined) currentUser.isMuted = isMuted;
          if (isDeaf !== undefined) currentUser.isDeaf = isDeaf;
          if (hasCamera !== undefined) currentUser.hasCamera = hasCamera;
          if (streamTitle !== undefined) currentUser.streamTitle = streamTitle;

          broadcastToRoom(currentUser.roomId, {
            type: "user-status-updated",
            user: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar,
              avatarColor: currentUser.avatarColor,
              isStreaming: currentUser.isStreaming,
              isMuted: currentUser.isMuted,
              isDeaf: currentUser.isDeaf,
              hasCamera: currentUser.hasCamera,
              streamTitle: currentUser.streamTitle,
            },
          });
          break;
        }

        case "chat-message": {
          if (!currentUser) return;
          const text = (data.text || data.message?.text || "").trim();
          if (!text) return;

          const newMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            roomId: currentUser.roomId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            avatarColor: currentUser.avatarColor,
            text,
            timestamp: Date.now(),
            type: data.messageType || data.message?.type || "text",
          };

          const roomLog = roomMessages.get(currentUser.roomId);
          if (roomLog) {
            roomLog.push(newMsg);
            if (roomLog.length > 200) roomLog.shift();
          }

          broadcastToRoom(currentUser.roomId, {
            type: "chat-message",
            message: newMsg,
          });

          // Check for YouTube DJ Bot Commands
          if (text.startsWith("!")) {
            const parts = text.split(/\s+/);
            const cmd = parts[0].toLowerCase();
            const arg = parts.slice(1).join(" ").trim();

            if (["!playmusic", "!play", "!music", "!tocar"].includes(cmd)) {
              // Extract YouTube Video ID
              const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
              const match = arg.match(ytRegex);

              if (match && match[1]) {
                const videoId = match[1];
                const botMsg: ChatMessage = {
                  id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "DJ YouTube Bot 🎵",
                  avatarColor: "#ef4444",
                  text: `🎵 Tocando agora no som da sala: https://youtu.be/${videoId} (solicitado por ${currentUser.name})`,
                  timestamp: Date.now(),
                  type: "system",
                };

                roomLog?.push(botMsg);
                broadcastToRoom(currentUser.roomId, {
                  type: "chat-message",
                  message: botMsg,
                });

                broadcastToRoom(currentUser.roomId, {
                  type: "youtube-track-play",
                  videoId,
                  requestedBy: currentUser.name,
                  originalUrl: arg,
                  timestamp: Date.now(),
                });
              } else {
                const errorBotMsg: ChatMessage = {
                  id: `bot-err-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "DJ YouTube Bot 🎵",
                  avatarColor: "#ef4444",
                  text: `⚠️ Link do YouTube inválido. Use: !playmusic https://www.youtube.com/watch?v=HVWvX6TujQA`,
                  timestamp: Date.now(),
                  type: "system",
                };
                broadcastToRoom(currentUser.roomId, {
                  type: "chat-message",
                  message: errorBotMsg,
                });
              }
            } else if (["!stopmusic", "!stop", "!parar", "!pause"].includes(cmd)) {
              const stopBotMsg: ChatMessage = {
                id: `bot-stop-${Date.now()}`,
                roomId: currentUser.roomId,
                senderId: "system",
                senderName: "DJ YouTube Bot 🎵",
                avatarColor: "#ef4444",
                text: `⏹️ Música pausada por ${currentUser.name}.`,
                timestamp: Date.now(),
                type: "system",
              };
              roomLog?.push(stopBotMsg);
              broadcastToRoom(currentUser.roomId, {
                type: "chat-message",
                message: stopBotMsg,
              });

              broadcastToRoom(currentUser.roomId, {
                type: "youtube-track-stop",
                requestedBy: currentUser.name,
              });
            } else if (["!ajuda", "!help", "!comandos"].includes(cmd)) {
              const helpMsg: ChatMessage = {
                id: `bot-help-${Date.now()}`,
                roomId: currentUser.roomId,
                senderId: "system",
                senderName: "DJ YouTube Bot 🎵",
                avatarColor: "#ef4444",
                text: `💡 Comandos do DJ Bot: \n• !playmusic <link_youtube> (Toca música na sala)\n• !stopmusic (Pausa música)`,
                timestamp: Date.now(),
                type: "system",
              };
              broadcastToRoom(currentUser.roomId, {
                type: "chat-message",
                message: helpMsg,
              });
            }
          }

          break;
        }

        case "send-reaction": {
          if (!currentUser) return;
          broadcastToRoom(currentUser.roomId, {
            type: "reaction-received",
            senderId: currentUser.id,
            senderName: currentUser.name,
            emoji: data.emoji || "🔥",
            timestamp: Date.now(),
          });
          break;
        }

        case "close-room":
        case "delete-room": {
          if (!currentUser) return;
          const targetRoomId = data.roomId || currentUser.roomId;
          broadcastToRoom(targetRoomId, {
            type: "room-closed",
            message: "A sala foi encerrada e excluída.",
          });
          rooms.delete(targetRoomId);
          roomMessages.delete(targetRoomId);
          break;
        }

        case "ping": {
          ws.send(JSON.stringify({ type: "pong", clientTimestamp: data.timestamp, serverTimestamp: Date.now() }));
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error("Error processing websocket message:", err);
    }
  });

  ws.on("close", () => {
    if (currentUser) {
      const room = rooms.get(currentUser.roomId);
      if (room) {
        room.delete(currentUser.id);
        if (room.size === 0) {
          rooms.delete(currentUser.roomId);
          roomMessages.delete(currentUser.roomId);
        } else {
          broadcastToRoom(currentUser.roomId, {
            type: "user-left",
            userId: currentUser.id,
            name: currentUser.name,
          });

          const leaveMsg: ChatMessage = {
            id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            roomId: currentUser.roomId,
            senderId: "system",
            senderName: "Sistema",
            avatarColor: "#ef4444",
            text: `${currentUser.name} saiu da sala.`,
            timestamp: Date.now(),
            type: "system",
          };
          roomMessages.get(currentUser.roomId)?.push(leaveMsg);
          broadcastToRoom(currentUser.roomId, {
            type: "chat-message",
            message: leaveMsg,
          });
        }
      }
    }
  });
});

// Express Auth & API Router
const apiRouter = express.Router();

// Register
apiRouter.post("/auth/register", (req, res) => {
  try {
    const { username, password, displayName, avatarColor, avatarUrl } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Nome de usuário é obrigatório." });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 24) {
      return res.status(400).json({ error: "O nome de usuário deve ter entre 3 e 24 caracteres." });
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: "O nome de usuário só pode conter letras, números, '.', '_' e '-'." });
    }

    if (!password || typeof password !== "string" || password.length < 4) {
      return res.status(400).json({ error: "A senha deve conter no mínimo 4 caracteres." });
    }

    if (usersDB.has(cleanUsername)) {
      return res.status(400).json({ error: "Este nome de usuário já está em uso." });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const cleanDisplayName = (displayName && typeof displayName === "string" ? displayName.trim() : "") || cleanUsername;

    const newUser: StoredUser = {
      id: userId,
      username: cleanUsername,
      displayName: cleanDisplayName,
      avatarColor: avatarColor || "#6366f1",
      avatarUrl: avatarUrl || undefined,
      passwordHash,
      passwordSalt: salt,
      createdAt: Date.now(),
    };

    usersDB.set(cleanUsername, newUser);
    saveUsers();

    const safeUser = toSafeUser(newUser);
    const token = createToken(safeUser);

    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Erro interno no servidor ao cadastrar." });
  }
});

// Google Sign-In Authentication
apiRouter.post("/auth/google", async (req, res) => {
  try {
    const { credential, profile } = req.body;

    let googleData: {
      sub: string;
      email?: string;
      name?: string;
      picture?: string;
    } | null = null;

    if (credential && typeof credential === "string") {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
          const payload = JSON.parse(payloadJson);
          if (payload && payload.sub) {
            googleData = {
              sub: payload.sub,
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
            };
          }
        }
      } catch (decodeErr) {
        console.warn("Failed to decode Google credential locally, trying Google API:", decodeErr);
      }

      if (!googleData) {
        try {
          const tokenInfoRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
          );
          if (tokenInfoRes.ok) {
            const data = await tokenInfoRes.json();
            if (data && data.sub) {
              googleData = {
                sub: data.sub,
                email: data.email,
                name: data.name,
                picture: data.picture,
              };
            }
          }
        } catch (fetchErr) {
          console.warn("Google API verification error:", fetchErr);
        }
      }
    } else if (profile && profile.sub) {
      googleData = profile;
    }

    if (!googleData || !googleData.sub) {
      return res.status(400).json({ error: "Credencial do Google inválida ou expirada." });
    }

    const email = googleData.email ? googleData.email.toLowerCase().trim() : undefined;
    const googleId = googleData.sub;
    const displayName = googleData.name ? googleData.name.trim() : "Gamer Google";
    const avatarUrl = googleData.picture || undefined;

    // Look for existing user by googleId or email
    let user: StoredUser | undefined;
    for (const u of usersDB.values()) {
      if ((u.googleId && u.googleId === googleId) || (email && u.email && u.email.toLowerCase() === email)) {
        user = u;
        break;
      }
    }

    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    if (user) {
      // Update existing user with latest Google info
      user.googleId = googleId;
      if (email) user.email = email;
      if (displayName && (!user.displayName || user.displayName.startsWith("guest_"))) {
        user.displayName = displayName;
      }
      if (avatarUrl) user.avatarUrl = avatarUrl;
      usersDB.set(user.username.toLowerCase(), user);
    } else {
      // Register new user from Google profile
      const usernameBase = email ? email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") : `google_${googleId.slice(0, 6)}`;
      let finalUsername = usernameBase || `user_${Date.now()}`;
      if (usersDB.has(finalUsername.toLowerCase())) {
        finalUsername = `${finalUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      const userId = `usr_g_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      user = {
        id: userId,
        email,
        googleId,
        username: finalUsername,
        displayName,
        avatarColor: randomColor,
        avatarUrl,
        createdAt: Date.now(),
      };
      usersDB.set(finalUsername.toLowerCase(), user);
    }

    saveUsers();

    const safeUser = toSafeUser(user);
    const token = createToken(safeUser);

    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Erro interno no servidor ao autenticar com Google." });
  }
});

// Login
apiRouter.post("/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Informe usuário e senha." });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = usersDB.get(cleanUsername);

    if (!user) {
      return res.status(401).json({ error: "Usuário ou senha incorretos." });
    }

    const computedHash = hashPassword(password, user.passwordSalt);
    if (computedHash !== user.passwordHash) {
      return res.status(401).json({ error: "Usuário ou senha incorretos." });
    }

    const safeUser = toSafeUser(user);
    const token = createToken(safeUser);

    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Erro interno no servidor ao autenticar." });
  }
});

// Me (Verify session token)
apiRouter.get("/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  const token = authHeader.substring(7);
  const userPayload = verifyToken(token);

  if (!userPayload) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }

  const dbUser = usersDB.get(userPayload.username.toLowerCase());
  if (dbUser) {
    return res.json({ success: true, user: toSafeUser(dbUser) });
  }

  res.json({ success: true, user: userPayload });
});

// Update Profile
apiRouter.put("/auth/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const token = authHeader.substring(7);
  const userPayload = verifyToken(token);

  if (!userPayload) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }

  const dbUser = usersDB.get(userPayload.username.toLowerCase());
  if (!dbUser) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const { displayName, avatarColor, avatarUrl } = req.body;
  if (displayName && typeof displayName === "string") {
    dbUser.displayName = displayName.trim().slice(0, 32);
  }
  if (avatarColor && typeof avatarColor === "string") {
    dbUser.avatarColor = avatarColor;
  }
  if (avatarUrl !== undefined) {
    dbUser.avatarUrl = avatarUrl ? String(avatarUrl).trim() : undefined;
  }

  usersDB.set(dbUser.username.toLowerCase(), dbUser);
  saveUsers();

  const safeUser = toSafeUser(dbUser);
  const newToken = createToken(safeUser);

  res.json({
    success: true,
    token: newToken,
    user: safeUser,
  });
});

// Health check
apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    activeRooms: rooms.size,
    totalConnections: Array.from(rooms.values()).reduce((acc, r) => acc + r.size, 0),
    totalRegisteredUsers: usersDB.size,
  });
});

// Rooms list
apiRouter.get("/rooms", (_req, res) => {
  const list = Array.from(rooms.entries()).map(([id, userMap]) => ({
    id,
    userCount: userMap.size,
    streamingCount: Array.from(userMap.values()).filter((u) => u.isStreaming).length,
  }));
  res.json({ rooms: list });
});

// Room details
apiRouter.get("/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  const roomUsers = rooms.get(roomId);
  res.json({
    exists: !!roomUsers,
    userCount: roomUsers ? roomUsers.size : 0,
    streamingCount: roomUsers ? Array.from(roomUsers.values()).filter((u) => u.isStreaming).length : 0,
  });
});

// Mount API routes on both /api and /dmg-live-share/api
app.use("/api", apiRouter);
app.use("/dmg-live-share/api", apiRouter);

// Vite Middleware & Static handling
async function start() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  if (hasDist) {
    console.log("Serving pre-built production static files from dist...");
    app.use(express.static(distPath));
    app.use("/dmg-live-share", express.static(distPath));

    app.get("/dmg-live-share/*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    app.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/dmg-live-share/api")) return;
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("No pre-built dist found, starting with Vite middleware...");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use("/dmg-live-share", vite.middlewares);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`LiveShare Play Server running on http://0.0.0.0:${PORT}`);
    console.log(`Base Subpath support: http://0.0.0.0:${PORT}/dmg-live-share`);
  });
}

start();
