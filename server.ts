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
  activeSeconds?: number;
  lastSeenAt?: number;
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
  email?: string;
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

    // Default Seed Walace Mendes Super Admin if not present
    if (!usersDB.has("walac") && !Array.from(usersDB.values()).some((u) => u.email === "lacee.mds@gmail.com")) {
      const walaceAdmin: StoredUser = {
        id: "usr-walace-admin",
        email: "lacee.mds@gmail.com",
        username: "walac",
        displayName: "Walace Mendes",
        avatarColor: "#6366f1",
        activeSeconds: 58.4 * 3600,
        lastSeenAt: Date.now(),
        createdAt: Date.now() - 30 * 24 * 3600 * 1000,
      };
      usersDB.set("walac", walaceAdmin);
      saveUsers();
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
const PERMANENT_ROOM_ID = "dmg-premium";
const rooms = new Map<string, Map<string, UserConnection>>();
const roomMessages = new Map<string, ChatMessage[]>();
const roomAdminRoles = new Map<string, Map<string, "admin1" | "admin2">>(); // roomId -> (userId -> role)
const roomBans = new Map<string, Set<string>>(); // roomId -> Set<userId>
const roomTimeouts = new Map<string, Map<string, number>>(); // roomId -> Map<userId, expiresAt>
const roomNames = new Map<string, string>(); // roomId -> Room Name
const roomDestructionTimers = new Map<string, { expiresAt: number; timer: NodeJS.Timeout }>(); // roomId -> countdown timer

// Super Admin Emails (Strict ADMIN 1 Global Powers)
const SUPER_ADMIN_EMAILS = [
  "lacee.mds@gmail.com",
  "lacee.mds2@gmail.com",
  "lacee.mds3@gmail.com",
  "walac@walacemendes.com",
];

// Initialize permanent VIP room DMG#PREMIUM
rooms.set(PERMANENT_ROOM_ID, new Map());
roomMessages.set(PERMANENT_ROOM_ID, []);
roomAdminRoles.set(PERMANENT_ROOM_ID, new Map());
roomBans.set(PERMANENT_ROOM_ID, new Set());
roomNames.set(PERMANENT_ROOM_ID, "DMG#PREMIUM");

function scheduleRoomDestruction(roomId: string) {
  if (roomId === PERMANENT_ROOM_ID) return;
  if (roomDestructionTimers.has(roomId)) return;

  const expiresAt = Date.now() + 10000; // 10 seconds countdown
  const timer = setTimeout(() => {
    const currentRoom = rooms.get(roomId);
    if (!currentRoom || currentRoom.size === 0) {
      rooms.delete(roomId);
      roomMessages.delete(roomId);
      roomAdminRoles.delete(roomId);
      roomBans.delete(roomId);
      roomTimeouts.delete(roomId);
      roomNames.delete(roomId);
      roomDestructionTimers.delete(roomId);
    }
  }, 10000);

  roomDestructionTimers.set(roomId, { expiresAt, timer });
}

function cancelRoomDestruction(roomId: string) {
  const item = roomDestructionTimers.get(roomId);
  if (item) {
    clearTimeout(item.timer);
    roomDestructionTimers.delete(roomId);
  }
}

function getUserRole(roomId: string, userId: string, email?: string): "admin1" | "admin2" | "member" {
  if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim())) return "admin1";
  const roles = roomAdminRoles.get(roomId);
  if (roles && roles.has(userId)) return roles.get(userId)!;
  // In DMG#PREMIUM, regular users are strictly 'member' unless explicitly promoted
  if (roomId === PERMANENT_ROOM_ID) return "member";
  return "member";
}

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
    email: u.email,
    avatar: u.avatar,
    avatarColor: u.avatarColor,
    role: getUserRole(roomId, u.id, u.email),
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
          const { roomId, userId, name, avatar, avatarColor, email } = data;
          if (!roomId || !userId) return;

          // Check if user is banned from this room
          const banSet = roomBans.get(roomId);
          if (banSet && banSet.has(userId)) {
            ws.send(
              JSON.stringify({
                type: "room-closed",
                message: "Você está banido desta sala pelo ADMIN 1.",
              })
            );
            return;
          }

          // Cancel any pending 10s auto-destruction timer for this room
          cancelRoomDestruction(roomId);

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
            email: email ? String(email).toLowerCase().trim() : undefined,
            name: name || `Gamer-${userId.slice(0, 4)}`,
            avatar: avatar || undefined,
            avatarColor: avatarColor || "#6366f1",
            roomId,
            ws,
            isStreaming: false,
            isMuted: true,
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
                email: currentUser.email,
                name: currentUser.name,
                avatar: currentUser.avatar,
                avatarColor: currentUser.avatarColor,
                role: getUserRole(roomId, currentUser.id, currentUser.email),
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

          if (isStreaming !== undefined) {
            // Regra estrita: Apenas 1 transmissão ao vivo por vez na sala
            if (isStreaming === true) {
              const roomUsers = rooms.get(currentUser.roomId);
              let existingStreamer: UserConnection | null = null;
              if (roomUsers) {
                for (const [uId, uConn] of roomUsers.entries()) {
                  if (uId !== currentUser.id && uConn.isStreaming) {
                    existingStreamer = uConn;
                    break;
                  }
                }
              }

              if (existingStreamer) {
                ws.send(
                  JSON.stringify({
                    type: "stream-rejected",
                    message: `Já existe uma transmissão ao vivo de ${existingStreamer.name}. Apenas 1 transmissão por vez é permitida.`,
                  })
                );
                ws.send(
                  JSON.stringify({
                    type: "chat-message",
                    message: {
                      id: `sys-stream-limit-${Date.now()}`,
                      roomId: currentUser.roomId,
                      senderId: "system",
                      senderName: "Sistema 🚫",
                      avatarColor: "#ef4444",
                      text: `⚠️ Transmissão não permitida: ${existingStreamer.name} já está transmitindo. Apenas 1 live por vez é permitida nesta sala.`,
                      timestamp: Date.now(),
                      type: "system",
                    },
                  })
                );
                return;
              }
            }
            currentUser.isStreaming = isStreaming;
          }
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

          // Check if user is in chat timeout
          const timeouts = roomTimeouts.get(currentUser.roomId);
          const expiresAt = timeouts?.get(currentUser.id);
          if (expiresAt && Date.now() < expiresAt) {
            const remainingSecs = Math.ceil((expiresAt - Date.now()) / 1000);
            ws.send(
              JSON.stringify({
                type: "chat-message",
                message: {
                  id: `sys-timeout-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "Moderação ⏳",
                  avatarColor: "#ef4444",
                  text: `⛔ Você está em timeout e não pode enviar mensagens por mais ${remainingSecs} segundo(s).`,
                  timestamp: Date.now(),
                  type: "system",
                },
              })
            );
            return;
          }

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

          // Hierarchical Command Engine (ADMIN 1 > ADMIN 2 > MEMBER)
          if (text.startsWith("!")) {
            const parts = text.split(/\s+/);
            const cmd = parts[0].toLowerCase();
            const arg = parts.slice(1).join(" ").trim();
            const userRole = getUserRole(currentUser.roomId, currentUser.id, (currentUser as any).email);
            const isCallerAdmin1 = userRole === "admin1";
            const isCallerAdmin2 = userRole === "admin2";
            const isCallerAdmin = isCallerAdmin1 || isCallerAdmin2;

            if (["!playmusic", "!play", "!music", "!tocar"].includes(cmd)) {
              if (!isCallerAdmin) {
                const denyMsg: ChatMessage = {
                  id: `bot-deny-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "DJ YouTube Bot 🎵",
                  avatarColor: "#ef4444",
                  text: `⛔ Apenas ADMIN 1 e ADMIN 2 podem colocar músicas.`,
                  timestamp: Date.now(),
                  type: "system",
                };
                ws.send(JSON.stringify({ type: "chat-message", message: denyMsg }));
                return;
              }

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
                  text: `⚠️ Link do YouTube inválido. Ex: !playmusic https://www.youtube.com/watch?v=HVWvX6TujQA`,
                  timestamp: Date.now(),
                  type: "system",
                };
                ws.send(JSON.stringify({ type: "chat-message", message: errorBotMsg }));
              }
            } else if (["!stopmusic", "!stop", "!parar", "!pause"].includes(cmd)) {
              if (!isCallerAdmin) {
                const denyMsg: ChatMessage = {
                  id: `bot-deny-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "DJ YouTube Bot 🎵",
                  avatarColor: "#ef4444",
                  text: `⛔ Apenas ADMIN 1 e ADMIN 2 podem pausar a música.`,
                  timestamp: Date.now(),
                  type: "system",
                };
                ws.send(JSON.stringify({ type: "chat-message", message: denyMsg }));
                return;
              }

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
            } else if (["!setadmin1", "!admin1"].includes(cmd)) {
              if (!isCallerAdmin1) {
                ws.send(
                  JSON.stringify({
                    type: "chat-message",
                    message: {
                      id: `sys-deny-${Date.now()}`,
                      roomId: currentUser.roomId,
                      senderId: "system",
                      senderName: "Moderação 👑",
                      text: `⛔ Apenas ADMIN 1 possui permissão para promover novos ADMIN 1.`,
                      timestamp: Date.now(),
                      type: "system",
                    },
                  })
                );
                return;
              }

              const targetName = arg.toLowerCase();
              const roomUsers = rooms.get(currentUser.roomId);
              const targetUser = Array.from(roomUsers?.values() || []).find(
                (u) => u.name.toLowerCase().includes(targetName) || u.id === arg
              );

              if (targetUser) {
                let roleMap = roomAdminRoles.get(currentUser.roomId);
                if (!roleMap) {
                  roleMap = new Map();
                  roomAdminRoles.set(currentUser.roomId, roleMap);
                }
                roleMap.set(targetUser.id, "admin1");

                const opMsg: ChatMessage = {
                  id: `sys-op-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "Moderação 👑",
                  avatarColor: "#ef4444",
                  text: `👑 [ADMIN 1] ${targetUser.name} agora possui poder supremo de ADMIN 1 (promovido por ${currentUser.name}).`,
                  timestamp: Date.now(),
                  type: "system",
                };
                roomLog?.push(opMsg);
                broadcastToRoom(currentUser.roomId, { type: "chat-message", message: opMsg });
                broadcastToRoom(currentUser.roomId, {
                  type: "user-status-updated",
                  user: { ...targetUser, role: "admin1" },
                });
              }
            } else if (["!setadmin2", "!admin2", "!op", "!admin"].includes(cmd)) {
              if (!isCallerAdmin1) {
                ws.send(
                  JSON.stringify({
                    type: "chat-message",
                    message: {
                      id: `sys-deny-${Date.now()}`,
                      roomId: currentUser.roomId,
                      senderId: "system",
                      senderName: "Moderação 🛡️",
                      text: `⛔ Apenas ADMIN 1 possui permissão para delegar cargo de ADMIN 2.`,
                      timestamp: Date.now(),
                      type: "system",
                    },
                  })
                );
                return;
              }

              const targetName = arg.toLowerCase();
              const roomUsers = rooms.get(currentUser.roomId);
              const targetUser = Array.from(roomUsers?.values() || []).find(
                (u) => u.name.toLowerCase().includes(targetName) || u.id === arg
              );

              if (targetUser) {
                let roleMap = roomAdminRoles.get(currentUser.roomId);
                if (!roleMap) {
                  roleMap = new Map();
                  roomAdminRoles.set(currentUser.roomId, roleMap);
                }
                roleMap.set(targetUser.id, "admin2");

                const opMsg: ChatMessage = {
                  id: `sys-op-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "Moderação 🛡️",
                  avatarColor: "#6366f1",
                  text: `🛡️ [ADMIN 2] ${targetUser.name} foi promovido a ADMIN 2 por ${currentUser.name}.`,
                  timestamp: Date.now(),
                  type: "system",
                };
                roomLog?.push(opMsg);
                broadcastToRoom(currentUser.roomId, { type: "chat-message", message: opMsg });
                broadcastToRoom(currentUser.roomId, {
                  type: "user-status-updated",
                  user: { ...targetUser, role: "admin2" },
                });
              }
            } else if (["!removeadmin", "!deop", "!unadmin"].includes(cmd)) {
              if (!isCallerAdmin1) {
                ws.send(
                  JSON.stringify({
                    type: "chat-message",
                    message: {
                      id: `sys-deny-${Date.now()}`,
                      roomId: currentUser.roomId,
                      senderId: "system",
                      text: `⛔ Apenas ADMIN 1 pode revogar cargos administrativos.`,
                      timestamp: Date.now(),
                      type: "system",
                    },
                  })
                );
                return;
              }

              const targetName = arg.toLowerCase();
              const roomUsers = rooms.get(currentUser.roomId);
              const targetUser = Array.from(roomUsers?.values() || []).find(
                (u) => u.name.toLowerCase().includes(targetName) || u.id === arg
              );

              if (targetUser) {
                const roleMap = roomAdminRoles.get(currentUser.roomId);
                roleMap?.delete(targetUser.id);

                const deopMsg: ChatMessage = {
                  id: `sys-deop-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "Moderação 🛡️",
                  avatarColor: "#f59e0b",
                  text: `🛡️ Os cargos administrativos de ${targetUser.name} foram revogados por ${currentUser.name}.`,
                  timestamp: Date.now(),
                  type: "system",
                };
                roomLog?.push(deopMsg);
                broadcastToRoom(currentUser.roomId, { type: "chat-message", message: deopMsg });
                broadcastToRoom(currentUser.roomId, {
                  type: "user-status-updated",
                  user: { ...targetUser, role: "member" },
                });
              }
            } else if (["!ban", "!banir"].includes(cmd)) {
              if (!isCallerAdmin1) {
                ws.send(
                  JSON.stringify({
                    type: "chat-message",
                    message: {
                      id: `sys-deny-${Date.now()}`,
                      roomId: currentUser.roomId,
                      senderId: "system",
                      text: `⛔ Apenas ADMIN 1 possui autorização para banir da sala.`,
                      timestamp: Date.now(),
                      type: "system",
                    },
                  })
                );
                return;
              }

              const targetName = arg.toLowerCase();
              const roomUsers = rooms.get(currentUser.roomId);
              const targetUser = Array.from(roomUsers?.values() || []).find(
                (u) => u.name.toLowerCase().includes(targetName) || u.id === arg
              );

              if (targetUser) {
                const targetRole = getUserRole(currentUser.roomId, targetUser.id, (targetUser as any).email);
                if (targetRole === "admin1" && targetUser.id !== currentUser.id) {
                  ws.send(
                    JSON.stringify({
                      type: "chat-message",
                      message: {
                        id: `sys-deny-${Date.now()}`,
                        roomId: currentUser.roomId,
                        senderId: "system",
                        text: `⛔ Impossível banir outro ADMIN 1.`,
                        timestamp: Date.now(),
                        type: "system",
                      },
                    })
                  );
                  return;
                }

                let banSet = roomBans.get(currentUser.roomId);
                if (!banSet) {
                  banSet = new Set();
                  roomBans.set(currentUser.roomId, banSet);
                }
                banSet.add(targetUser.id);

                if (targetUser.ws.readyState === WebSocket.OPEN) {
                  targetUser.ws.send(
                    JSON.stringify({
                      type: "room-closed",
                      message: "Você foi banido desta sala pelo ADMIN 1.",
                    })
                  );
                  targetUser.ws.close();
                }

                const banMsg: ChatMessage = {
                  id: `sys-ban-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "BANIMENTO 🔨",
                  avatarColor: "#ef4444",
                  text: `🔨 [BANIMENTO] ${targetUser.name} foi banido permanentemente da sala pelo ADMIN 1 (${currentUser.name}).`,
                  timestamp: Date.now(),
                  type: "system",
                };
                roomLog?.push(banMsg);
                broadcastToRoom(currentUser.roomId, { type: "chat-message", message: banMsg });
              }
            } else if (["!unban", "!desbanir"].includes(cmd)) {
              if (!isCallerAdmin1) return;
              const banSet = roomBans.get(currentUser.roomId);
              banSet?.delete(arg);

              const unbanMsg: ChatMessage = {
                id: `sys-unban-${Date.now()}`,
                roomId: currentUser.roomId,
                senderId: "system",
                senderName: "Moderação 🕊️",
                avatarColor: "#10b981",
                text: `🕊️ [Desbanimento] ${arg} foi desbanido da sala pelo ADMIN 1.`,
                timestamp: Date.now(),
                type: "system",
              };
              roomLog?.push(unbanMsg);
              broadcastToRoom(currentUser.roomId, { type: "chat-message", message: unbanMsg });
            } else if (["!timeout", "!silenciar"].includes(cmd)) {
              if (!isCallerAdmin) {
                ws.send(
                  JSON.stringify({
                    type: "chat-message",
                    message: {
                      id: `sys-err-${Date.now()}`,
                      roomId: currentUser.roomId,
                      senderId: "system",
                      text: `⛔ Apenas Administradores podem aplicar timeout.`,
                      timestamp: Date.now(),
                      type: "system",
                    },
                  })
                );
                return;
              }

              const [targetParam, durationParam] = arg.split(/\s+/);
              const minutes = parseInt(durationParam) || 5;
              const targetName = (targetParam || "").toLowerCase();

              const roomUsers = rooms.get(currentUser.roomId);
              const targetUser = Array.from(roomUsers?.values() || []).find(
                (u) => u.name.toLowerCase().includes(targetName) || u.id === targetParam
              );

              if (targetUser) {
                const targetRole = getUserRole(currentUser.roomId, targetUser.id, (targetUser as any).email);
                if (targetRole === "admin1") {
                  ws.send(
                    JSON.stringify({
                      type: "chat-message",
                      message: {
                        id: `sys-deny-${Date.now()}`,
                        roomId: currentUser.roomId,
                        senderId: "system",
                        text: `⛔ ADMIN 1 é imune a timeout.`,
                        timestamp: Date.now(),
                        type: "system",
                      },
                    })
                  );
                  return;
                }

                if (isCallerAdmin2 && targetRole === "admin2") {
                  ws.send(
                    JSON.stringify({
                      type: "chat-message",
                      message: {
                        id: `sys-deny-${Date.now()}`,
                        roomId: currentUser.roomId,
                        senderId: "system",
                        text: `⛔ ADMIN 2 não possui poder de moderação sobre outro ADMIN 2.`,
                        timestamp: Date.now(),
                        type: "system",
                      },
                    })
                  );
                  return;
                }

                let timeouts = roomTimeouts.get(currentUser.roomId);
                if (!timeouts) {
                  timeouts = new Map();
                  roomTimeouts.set(currentUser.roomId, timeouts);
                }
                const expiresAt = Date.now() + minutes * 60 * 1000;
                timeouts.set(targetUser.id, expiresAt);

                const timeoutMsg: ChatMessage = {
                  id: `sys-timeout-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "Moderação ⏳",
                  avatarColor: "#ef4444",
                  text: `⏳ ${targetUser.name} foi silenciado no chat por ${minutes} minuto(s) por ${currentUser.name}.`,
                  timestamp: Date.now(),
                  type: "system",
                };
                roomLog?.push(timeoutMsg);
                broadcastToRoom(currentUser.roomId, { type: "chat-message", message: timeoutMsg });
              }
            } else if (["!kick", "!expulsar"].includes(cmd)) {
              if (!isCallerAdmin) return;
              const targetName = arg.toLowerCase();
              const roomUsers = rooms.get(currentUser.roomId);
              const targetUser = Array.from(roomUsers?.values() || []).find(
                (u) => u.name.toLowerCase().includes(targetName) || u.id === arg
              );

              if (targetUser) {
                const targetRole = getUserRole(currentUser.roomId, targetUser.id, (targetUser as any).email);
                if (targetRole === "admin1") {
                  ws.send(
                    JSON.stringify({
                      type: "chat-message",
                      message: {
                        id: `sys-deny-${Date.now()}`,
                        roomId: currentUser.roomId,
                        senderId: "system",
                        text: `⛔ Impossível expulsar o ADMIN 1.`,
                        timestamp: Date.now(),
                        type: "system",
                      },
                    })
                  );
                  return;
                }

                if (isCallerAdmin2 && targetRole === "admin2") {
                  ws.send(
                    JSON.stringify({
                      type: "chat-message",
                      message: {
                        id: `sys-deny-${Date.now()}`,
                        roomId: currentUser.roomId,
                        senderId: "system",
                        text: `⛔ ADMIN 2 não tem poder sobre outro ADMIN 2.`,
                        timestamp: Date.now(),
                        type: "system",
                      },
                    })
                  );
                  return;
                }

                if (targetUser.ws.readyState === WebSocket.OPEN) {
                  targetUser.ws.send(
                    JSON.stringify({
                      type: "room-closed",
                      message: "Você foi expulso da sala pelo administrador.",
                    })
                  );
                  targetUser.ws.close();
                }

                const kickMsg: ChatMessage = {
                  id: `sys-kick-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "Moderação 👢",
                  avatarColor: "#ef4444",
                  text: `👢 [Expulsão] ${targetUser.name} foi expulso da sala por ${currentUser.name}.`,
                  timestamp: Date.now(),
                  type: "system",
                };
                roomLog?.push(kickMsg);
                broadcastToRoom(currentUser.roomId, { type: "chat-message", message: kickMsg });
              }
            } else if (["!mute", "!mutar"].includes(cmd)) {
              if (!isCallerAdmin) return;
              const targetName = arg.toLowerCase();
              const roomUsers = rooms.get(currentUser.roomId);
              const targetUser = Array.from(roomUsers?.values() || []).find(
                (u) => u.name.toLowerCase().includes(targetName) || u.id === arg
              );

              if (targetUser) {
                const targetRole = getUserRole(currentUser.roomId, targetUser.id, (targetUser as any).email);
                if (targetRole === "admin1") {
                  ws.send(
                    JSON.stringify({
                      type: "chat-message",
                      message: {
                        id: `sys-deny-${Date.now()}`,
                        roomId: currentUser.roomId,
                        senderId: "system",
                        text: `⛔ ADMIN 1 é imune a mute.`,
                        timestamp: Date.now(),
                        type: "system",
                      },
                    })
                  );
                  return;
                }

                targetUser.isMuted = true;
                broadcastToRoom(currentUser.roomId, {
                  type: "user-status-updated",
                  user: { ...targetUser, isMuted: true },
                });

                const muteMsg: ChatMessage = {
                  id: `sys-mute-${Date.now()}`,
                  roomId: currentUser.roomId,
                  senderId: "system",
                  senderName: "Moderação 🔇",
                  avatarColor: "#ef4444",
                  text: `🔇 ${targetUser.name} foi mutado no microfone por ${currentUser.name}.`,
                  timestamp: Date.now(),
                  type: "system",
                };
                roomLog?.push(muteMsg);
                broadcastToRoom(currentUser.roomId, { type: "chat-message", message: muteMsg });
              }
            } else if (["!fecharsala", "!close"].includes(cmd)) {
              if (!isCallerAdmin1) {
                ws.send(
                  JSON.stringify({
                    type: "chat-message",
                    message: {
                      id: `sys-deny-${Date.now()}`,
                      roomId: currentUser.roomId,
                      senderId: "system",
                      text: `⛔ Apenas o ADMIN 1 pode fechar e excluir a sala.`,
                      timestamp: Date.now(),
                      type: "system",
                    },
                  })
                );
                return;
              }

              if (currentUser.roomId === PERMANENT_ROOM_ID) {
                ws.send(
                  JSON.stringify({
                    type: "chat-message",
                    message: {
                      id: `sys-err-${Date.now()}`,
                      roomId: currentUser.roomId,
                      senderId: "system",
                      text: `⚠️ A sala oficial DMG#PREMIUM não pode ser fechada.`,
                      timestamp: Date.now(),
                      type: "system",
                    },
                  })
                );
                return;
              }

              broadcastToRoom(currentUser.roomId, {
                type: "room-closed",
                message: `A sala foi encerrada pelo ADMIN 1 (${currentUser.name}).`,
              });
              rooms.delete(currentUser.roomId);
              roomMessages.delete(currentUser.roomId);
              roomAdminRoles.delete(currentUser.roomId);
              roomBans.delete(currentUser.roomId);
              roomTimeouts.delete(currentUser.roomId);
              roomNames.delete(currentUser.roomId);
            } else if (["!ajuda", "!help", "!comandos"].includes(cmd)) {
              const helpMsg: ChatMessage = {
                id: `bot-help-${Date.now()}`,
                roomId: currentUser.roomId,
                senderId: "system",
                senderName: "DMG Central de Ajuda 📋",
                avatarColor: "#6366f1",
                text: `👑 HIERARQUIA & COMANDOS DMG:\n\n[ ADMIN 1 (Poder Absoluto) ]\n• !setadmin1 <nome> (Promove a ADMIN 1)\n• !setadmin2 <nome> (Promove a ADMIN 2)\n• !removeadmin <nome> (Remove cargos)\n• !ban <nome> (Bane da sala permanentemente)\n• !unban <id> (Desbane usuário)\n• !fecharsala (Encerra e exclui sala)\n\n[ ADMIN 2 (Moderação Delegada) ]\n• !kick <nome> (Expulsa membros normais)\n• !timeout <nome> <minutos> (Silencia no chat)\n• !mute <nome> (Muta microfone)\n• !playmusic <link> (Toca música YouTube)\n• !stopmusic (Pausa música YouTube)\n\n[ MEMBROS ]\n• !help (Exibe lista de ajuda)`,
                timestamp: Date.now(),
                type: "system",
              };
              ws.send(JSON.stringify({ type: "chat-message", message: helpMsg }));
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
          const userRole = getUserRole(targetRoomId, currentUser.id, (currentUser as any).email);
          const isCallerAdmin1 = userRole === "admin1";
          if (!isCallerAdmin1) {
            ws.send(
              JSON.stringify({
                type: "chat-message",
                message: {
                  id: `sys-deny-${Date.now()}`,
                  roomId: targetRoomId,
                  senderId: "system",
                  text: `⛔ Apenas o ADMIN 1 pode fechar e excluir esta sala.`,
                  timestamp: Date.now(),
                  type: "system",
                },
              })
            );
            return;
          }

          if (targetRoomId === PERMANENT_ROOM_ID) {
            ws.send(
              JSON.stringify({
                type: "chat-message",
                message: {
                  id: `sys-err-${Date.now()}`,
                  roomId: targetRoomId,
                  senderId: "system",
                  text: `⚠️ A sala oficial DMG#PREMIUM é permanente e não pode ser fechada.`,
                  timestamp: Date.now(),
                  type: "system",
                },
              })
            );
            return;
          }

          broadcastToRoom(targetRoomId, {
            type: "room-closed",
            message: "A sala foi encerrada e excluída pelo ADMIN 1.",
          });
          rooms.delete(targetRoomId);
          roomMessages.delete(targetRoomId);
          roomAdminRoles.delete(targetRoomId);
          roomBans.delete(targetRoomId);
          roomTimeouts.delete(targetRoomId);
          roomNames.delete(targetRoomId);
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
        if (room.size === 0 && currentUser.roomId !== PERMANENT_ROOM_ID) {
          scheduleRoomDestruction(currentUser.roomId);
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

// Create Room Endpoint (Strict format: "Sala do [Nome]")
apiRouter.post("/room/create", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Faça login com sua Conta Google para criar uma sala." });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }

    const hostName = user.displayName || user.username || "Gamer";
    const roomName = `Sala do ${hostName}`;
    const cleanSlug = hostName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const roomId = `sala-${cleanSlug || "gamer"}-${randomSuffix}`;

    rooms.set(roomId, new Map());
    roomMessages.set(roomId, []);
    roomNames.set(roomId, roomName);

    const roleMap = new Map<string, "admin1" | "admin2">();
    roleMap.set(user.id, "admin1");
    roomAdminRoles.set(roomId, roleMap);

    res.json({
      success: true,
      roomId,
      roomName,
    });
  } catch (err: any) {
    console.error("Error creating room:", err);
    res.status(500).json({ error: "Erro ao criar sala." });
  }
});

// Rooms list (Pins DMG#PREMIUM first, followed by active user rooms and 10s countdown rooms)
apiRouter.get("/rooms", (_req, res) => {
  const permUsers = rooms.get(PERMANENT_ROOM_ID) || new Map();
  const permUsersArr = Array.from(permUsers.values());
  const permStreamer = permUsersArr.find((u) => u.isStreaming);

  const premiumRoom = {
    id: PERMANENT_ROOM_ID,
    name: "DMG#PREMIUM",
    isPermanent: true,
    userCount: permUsers.size,
    emptyCountdownSecs: null,
    streamingCount: permUsersArr.filter((u) => u.isStreaming).length,
    host: {
      id: "admin-dmg",
      name: "DMG Comunidade",
      avatarColor: "#8b5cf6",
    },
    activeStreamer: permStreamer
      ? {
          id: permStreamer.id,
          name: permStreamer.name,
          avatar: permStreamer.avatar,
          avatarColor: permStreamer.avatarColor,
          streamTitle: permStreamer.streamTitle,
        }
      : undefined,
    createdAt: 0,
  };

  const userRooms = Array.from(rooms.entries())
    .filter(([id, userMap]) => id !== PERMANENT_ROOM_ID && (userMap.size > 0 || roomDestructionTimers.has(id)))
    .map(([id, userMap]) => {
      const usersArr = Array.from(userMap.values());
      const host = usersArr[0];
      const activeStreamer = usersArr.find((u) => u.isStreaming);
      const customName = roomNames.get(id) || `Sala do ${host?.name || "Gamer"}`;
      const destruct = roomDestructionTimers.get(id);
      const countdownSecs = destruct ? Math.max(0, Math.ceil((destruct.expiresAt - Date.now()) / 1000)) : null;

      return {
        id,
        name: customName,
        isPermanent: false,
        userCount: userMap.size,
        emptyCountdownSecs: countdownSecs,
        streamingCount: usersArr.filter((u) => u.isStreaming).length,
        host: host
          ? {
              id: host.id,
              name: host.name,
              avatar: host.avatar,
              avatarColor: host.avatarColor,
            }
          : undefined,
        activeStreamer: activeStreamer
          ? {
              id: activeStreamer.id,
              name: activeStreamer.name,
              avatar: activeStreamer.avatar,
              avatarColor: activeStreamer.avatarColor,
              streamTitle: activeStreamer.streamTitle,
            }
          : undefined,
        createdAt: host?.joinedAt || Date.now(),
      };
    });

  res.json({
    rooms: [premiumRoom, ...userRooms],
  });
});

// Top active community users ranking (Most active hours, admin vs member vs guest)
apiRouter.get("/community/top-users", (_req, res) => {
  // Collect all currently connected users across all rooms
  const onlineUserIds = new Set<string>();
  const onlineUserRooms = new Map<string, string>();

  for (const [roomId, userMap] of rooms.entries()) {
    for (const [userId, conn] of userMap.entries()) {
      onlineUserIds.add(userId);
      onlineUserRooms.set(userId, roomId);
    }
  }

  interface TopUserEntry {
    id: string;
    name: string;
    avatarUrl?: string;
    avatarColor: string;
    roleType: "admin1" | "admin2" | "member" | "guest";
    roleLabel: string;
    activeHours: number;
    isOnline: boolean;
    currentRoom?: string;
  }

  // Build top user list
  const usersList: TopUserEntry[] = Array.from(usersDB.values()).map((u) => {
    const isOnline = onlineUserIds.has(u.id);
    const hours = Math.max(0.5, Math.round(((u.activeSeconds || 3600) / 3600) * 10) / 10);
    const isSuperAdmin = u.email && SUPER_ADMIN_EMAILS.includes(u.email.toLowerCase().trim());

    let roleType: "admin1" | "admin2" | "member" | "guest" = "member";
    let roleLabel = "MEMBRO DMG";

    if (isSuperAdmin) {
      roleType = "admin1";
      roleLabel = "ADMIN 1 (Dono)";
    } else if (u.googleId || u.email) {
      roleType = "member";
      roleLabel = "MEMBRO DMG";
    } else {
      roleType = "guest";
      roleLabel = "CONVIDADO";
    }

    return {
      id: u.id,
      name: u.displayName || u.username,
      avatarUrl: u.avatarUrl,
      avatarColor: u.avatarColor || "#6366f1",
      roleType,
      roleLabel,
      activeHours: hours,
      isOnline,
      currentRoom: isOnline ? onlineUserRooms.get(u.id) : undefined,
    };
  });

  // If list is small, add sample community members so leaderboard looks full
  if (usersList.length < 4) {
    const demoMembers: TopUserEntry[] = [
      {
        id: "usr-dmg-pro-1",
        name: "ShadowGamer_BR",
        avatarColor: "#10b981",
        roleType: "member",
        roleLabel: "MEMBRO DMG",
        activeHours: 24.8,
        isOnline: false,
      },
      {
        id: "usr-dmg-pro-2",
        name: "Valkyrie_Stream",
        avatarColor: "#ec4899",
        roleType: "admin2",
        roleLabel: "ADMIN 2 (Mod)",
        activeHours: 19.3,
        isOnline: false,
      },
      {
        id: "usr-dmg-pro-3",
        name: "CyberKnight99",
        avatarColor: "#8b5cf6",
        roleType: "member",
        roleLabel: "MEMBRO DMG",
        activeHours: 12.5,
        isOnline: false,
      },
      {
        id: "usr-dmg-guest-1",
        name: "Guest-Player#882",
        avatarColor: "#71717a",
        roleType: "guest",
        roleLabel: "CONVIDADO",
        activeHours: 4.1,
        isOnline: false,
      },
    ];
    for (const demo of demoMembers) {
      if (!usersList.some((u) => u.id === demo.id)) {
        usersList.push(demo);
      }
    }
  }

  // Sort by activeHours descending
  usersList.sort((a, b) => b.activeHours - a.activeHours);

  res.json({
    success: true,
    topUsers: usersList.slice(0, 8),
  });
});

// Room details (Checks whether room exists or is permanent)
apiRouter.get("/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  const isPermanent = roomId === PERMANENT_ROOM_ID;
  const roomUsers = rooms.get(roomId);
  const exists = isPermanent || (!!roomUsers && (roomUsers.size > 0 || roomNames.has(roomId)));

  const customName = isPermanent
    ? "DMG#PREMIUM"
    : roomNames.get(roomId) || (roomUsers && roomUsers.size > 0 ? `Sala do ${Array.from(roomUsers.values())[0].name}` : roomId);

  res.json({
    exists,
    isPermanent,
    id: roomId,
    name: customName,
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
