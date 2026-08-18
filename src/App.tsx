import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Stage } from './components/Stage';
import { ControlBar } from './components/ControlBar';
import { RightPanel } from './components/RightPanel';
import { LandingView } from './components/LandingView';
import { CreateRoomModal } from './components/CreateRoomModal';
import { SettingsModal } from './components/SettingsModal';
import { DomainSetupModal } from './components/DomainSetupModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { useWebRTC } from './hooks/useWebRTC';
import { AuthUser, UserProfile } from './types';
import { Check, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from './utils/api';

const DEFAULT_GUEST_USER: AuthUser = {
  id: `guest_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
  username: `gamer_${Math.floor(1000 + Math.random() * 9000)}`,
  displayName: 'Gamer Convidado',
  avatarColor: '#6366f1',
  createdAt: Date.now(),
  isGuest: true,
};

export default function App() {
  // Navigation & Room State
  const [currentView, setCurrentView] = useState<'landing' | 'room'>('landing');
  const [roomId, setRoomId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [activeStreamerId, setActiveStreamerId] = useState<string | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Profile
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    try {
      const saved = localStorage.getItem('dmg_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_GUEST_USER;
  });

  // Recent Rooms
  const [recentRooms, setRecentRooms] = useState<{ id: string; name: string }[]>(() => {
    try {
      const saved = localStorage.getItem('dmg_recent_rooms');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Verify auth token on initial mount
  useEffect(() => {
    const token = localStorage.getItem('dmg_auth_token');
    if (token && !token.startsWith('guest_')) {
      const apiBase = getApiBaseUrl();
      fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('dmg_auth_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Read URL query on mount (?room=xyz)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const cleanId = roomParam.toLowerCase().trim().replace(/\s+/g, '-');
      setRoomId(cleanId);
      setRoomName(cleanId.replace(/-/g, ' ').toUpperCase());
      setCurrentView('room');

      setRecentRooms((prev) => {
        const next = [{ id: cleanId, name: cleanId.replace(/-/g, ' ').toUpperCase() }, ...prev.filter((r) => r.id !== cleanId)];
        localStorage.setItem('dmg_recent_rooms', JSON.stringify(next));
        return next;
      });
    }
  }, []);

  // WebRTC Real-Time Signaling Hook
  const {
    isConnected,
    users,
    messages,
    pingMs,
    remoteStreams,
    localScreenStream,
    localMicStream,
    isStreaming,
    isMuted,
    isDeaf,
    hasCamera,
    isLocalSpeaking,
    streamQuality,
    setStreamQuality,
    startMicrophone,
    toggleMute,
    toggleDeafen,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    sendReaction,
  } = useWebRTC(currentView === 'room' ? roomId : '', {
    id: currentUser.id,
    name: currentUser.displayName || currentUser.username,
    avatar: currentUser.avatarUrl,
    avatarColor: currentUser.avatarColor,
  });

  // Calculate participants in the room
  const participants: UserProfile[] = useMemo(() => {
    // Current user representation in participants list
    const me: UserProfile = {
      id: currentUser.id,
      name: currentUser.displayName || currentUser.username,
      avatar: currentUser.avatarUrl,
      avatarColor: currentUser.avatarColor,
      status: 'online',
      isHost: true,
      isStreaming,
      isMicMuted: isMuted,
      isDeaf,
      isSpeaking: isLocalSpeaking,
      isCameraOn: hasCamera,
    };

    // Merge with remote connected users
    const others = users.filter((u) => u.id !== currentUser.id);
    return [me, ...others];
  }, [currentUser, isStreaming, isMuted, isDeaf, isLocalSpeaking, hasCamera, users]);

  // All streamers currently active
  const allStreamers = useMemo(() => {
    return participants.filter((p) => p.isStreaming);
  }, [participants]);

  // Active focused streamer on Stage
  const currentStreamer = useMemo(() => {
    if (activeStreamerId) {
      const found = participants.find((p) => p.id === activeStreamerId && p.isStreaming);
      if (found) return found;
    }
    // Default to first streamer or null
    return allStreamers[0] || null;
  }, [activeStreamerId, participants, allStreamers]);

  // Handle Screen Share Toggle
  const handleToggleScreenShare = async () => {
    if (isStreaming) {
      stopScreenShare();
      showToast('Compartilhamento de tela encerrado');
    } else {
      await startScreenShare();
    }
  };

  // Handle Mic Toggle
  const handleToggleMic = async () => {
    if (!localMicStream) {
      await startMicrophone();
    } else {
      toggleMute();
    }
  };

  // Handle Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Leave room
  const handleLeaveRoom = () => {
    if (isStreaming) {
      stopScreenShare();
    }
    setCurrentView('landing');
    setRoomId('');
    setRoomName('');
    window.history.pushState({}, '', window.location.pathname);
  };

  // Join Room by Code
  const handleJoinByCode = (code: string) => {
    const cleanId = code.toLowerCase().trim().replace(/\s+/g, '-');
    const displayName = code.trim().replace(/-/g, ' ');
    setRoomId(cleanId);
    setRoomName(displayName);

    setRecentRooms((prev) => {
      const next = [{ id: cleanId, name: displayName }, ...prev.filter((r) => r.id !== cleanId)];
      localStorage.setItem('dmg_recent_rooms', JSON.stringify(next));
      return next;
    });

    setCurrentView('room');
    window.history.pushState({}, '', `?room=${cleanId}`);
  };

  // Create Room & Join
  const handleCreateAndJoin = (name: string, newId: string) => {
    setRoomId(newId);
    setRoomName(name);

    setRecentRooms((prev) => {
      const next = [{ id: newId, name }, ...prev.filter((r) => r.id !== newId)];
      localStorage.setItem('dmg_recent_rooms', JSON.stringify(next));
      return next;
    });

    setCurrentView('room');
    window.history.pushState({}, '', `?room=${newId}`);
  };

  // Select room from sidebar
  const handleSelectRecentRoom = (selectedId: string) => {
    const found = recentRooms.find((r) => r.id === selectedId);
    const name = found ? found.name : selectedId;
    setRoomId(selectedId);
    setRoomName(name);
    setCurrentView('room');
    window.history.pushState({}, '', `?room=${selectedId}`);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('dmg_auth_token');
    localStorage.removeItem('dmg_auth_user');
    setCurrentUser(DEFAULT_GUEST_USER);
    setIsProfileModalOpen(false);
    showToast('Você saiu da sua conta.');
  };

  return (
    <div className="h-screen w-screen bg-[#07080d] text-zinc-100 flex flex-col overflow-hidden font-sans select-none antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border border-indigo-400/40 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {currentView === 'landing' ? (
        <LandingView
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onJoinRoomByCode={handleJoinByCode}
          onOpenDomainGuide={() => setIsDomainModalOpen(true)}
        />
      ) : (
        /* Room View Layout */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Main Content Area (Sidebar + Stage + Right Panel) */}
          <div className="flex-1 flex overflow-hidden">
            {/* 1. Sidebar Esquerda */}
            <Sidebar
              currentUser={currentUser}
              activeRoomId={roomId}
              onOpenCreateRoom={() => setIsCreateModalOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onOpenProfile={() => (currentUser.isGuest ? setIsAuthModalOpen(true) : setIsProfileModalOpen(true))}
              recentRooms={recentRooms}
              onSelectRoom={handleSelectRecentRoom}
            />

            {/* 2. Área Central (Stage / Compartilhamento de Tela) */}
            <Stage
              streamer={currentStreamer}
              allStreamers={allStreamers}
              onSelectStreamer={(id) => setActiveStreamerId(id)}
              localStream={localScreenStream}
              isLocalStreaming={isStreaming}
              onStartShare={handleToggleScreenShare}
              streamQuality={streamQuality}
              roomName={roomName || roomId}
              currentUserId={currentUser.id}
              remoteStreams={remoteStreams}
            />

            {/* 3. Painel Direito (Participantes & Chat) */}
            <RightPanel
              roomName={roomName || roomId}
              roomId={roomId}
              participants={participants}
              currentUserId={currentUser.id}
              messages={messages}
              onSendMessage={sendMessage}
              onSendReaction={sendReaction}
              onSelectStreamer={(id) => setActiveStreamerId(id)}
            />
          </div>

          {/* 4. Barra Inferior de Controles */}
          <ControlBar
            isMicMuted={isMuted}
            onToggleMic={handleToggleMic}
            isAudioMuted={isDeaf}
            onToggleAudio={toggleDeafen}
            isStreaming={isStreaming}
            onToggleShare={handleToggleScreenShare}
            isCameraOn={hasCamera}
            onToggleCamera={() => {}}
            onToggleFullscreen={handleToggleFullscreen}
            onLeaveRoom={handleLeaveRoom}
          />
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Bem-vindo, ${user.displayName || user.username}!`);
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          showToast('Perfil atualizado com sucesso!');
        }}
        onLogout={handleLogout}
      />

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAndJoin={handleCreateAndJoin}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        streamQuality={streamQuality}
        onUpdateQuality={(newQuality) => {
          setStreamQuality(newQuality);
          showToast(`Qualidade definida: ${newQuality.resolution} @ ${newQuality.fps} FPS`);
        }}
      />

      <DomainSetupModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
        currentRoomId={roomId || 'gameplay'}
      />
    </div>
  );
}
