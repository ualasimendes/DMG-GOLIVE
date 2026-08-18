export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarColor: string;
  createdAt: number;
  isGuest?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  avatarColor?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  isHost?: boolean;
  isStreaming?: boolean;
  isMicMuted?: boolean;
  isCameraOn?: boolean;
  streamTitle?: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isDeaf?: boolean;
  joinedAt?: number;
}

export type User = UserProfile;

export interface StreamQuality {
  resolution: '720p' | '1080p' | '1440p' | '4K';
  fps: 30 | 60;
  bitrate: string;
  latencyMs: number;
}

export interface StreamQualityPreset {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
  frameRate: number;
  bitrateKbps: number;
}

export interface AudioSettings {
  selectedAudioInputId: string;
  selectedAudioOutputId: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  systemAudioEnabled: boolean;
  micAudioEnabled: boolean;
  micVolume: number;
  gameVolume: number;
}

export interface PeerStreamData {
  userId: string;
  userName: string;
  avatarColor: string;
  avatarUrl?: string;
  stream: MediaStream;
  streamType: 'screen' | 'camera';
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  avatarColor?: string;
  text: string;
  timestamp: number | string;
  type?: 'text' | 'system' | 'reaction';
}

export interface RoomData {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  participants: UserProfile[];
  currentStreamerId?: string | null;
}
