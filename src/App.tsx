import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Stage } from './components/Stage';
import { ControlBar } from './components/ControlBar';
import { RightPanel } from './components/RightPanel';
import { LandingView } from './components/LandingView';
import { CreateRoomModal } from './components/CreateRoomModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { TermsModal } from './components/TermsModal';
import { useWebRTC } from './hooks/useWebRTC';
import { AuthUser, UserProfile } from './types';
import { Check } from 'lucide-react';
import { getApiBaseUrl } from './utils/api';

// Dedicated Background Audio Player for each connected peer
const RemoteAudioPlayer: React.FC<{ stream: MediaStream; isDeaf: boolean }> = ({ stream, isDeaf }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !stream) return;

    audioEl.srcObject = stream;
    audioEl.muted = isDeaf;
    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio play request notice:', err);
      });
    }
  }, [stream, isDeaf]);

  return <audio ref={audioRef} autoPlay playsInline muted={isDeaf} className="hidden" />;
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
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Profile: strictly null if unauthenticated
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('dmg_auth_user');
      const token = localStorage.getItem('dmg_auth_token');
      if (saved && token && !token.startsWith('guest_')) {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.isGuest && (parsed.email || parsed.googleId)) {
          return parsed;
        }
      }
    } catch {}

    // Clear legacy guest tokens and old stored rooms
    try {
      localStorage.removeItem('dmg_auth_user');
      localStorage.removeItem('dmg_auth_token');
      localStorage.removeItem('dmg_recent_rooms');
    } catch {}
    return null;
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
          } else {
            setCurrentUser(null);
            localStorage.removeItem('dmg_auth_user');
            localStorage.removeItem('dmg_auth_token');
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

      const token = localStorage.getItem('dmg_auth_token');
      if (token && !token.startsWith('guest_')) {
        setCurrentView('room');
      } else {
        setIsAuthModalOpen(true);
        showToast('Faça login com sua Conta Google para acessar a sala.');
      }
    }
  }, []);

  const webrtcUser = useMemo(
    () => ({
      id: currentUser ? currentUser.id : `usr_${Date.now()}`,
      name: currentUser ? (currentUser.displayName || currentUser.username) : 'Visitante',
      avatar: currentUser?.avatarUrl,
      avatarColor: currentUser?.avatarColor || '#6366f1',
    }),
    [currentUser]
  );

  const handleRoomClosedByHost = useCallback((reason: string) => {
    setRoomId('');
    setRoomName('');
    setActiveStreamerId(null);
    setCurrentView('landing');

    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());

    showToast(reason || 'A sala foi encerrada e excluída.');
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
    closeRoom,
    activeYouTubeTrack,
    stopYouTubeTrack,
  } = useWebRTC(
    currentView === 'room' && !!currentUser ? roomId : '',
    webrtcUser,
    handleRoomClosedByHost
  );

  // Automatically start microphone when joining room
  useEffect(() => {
    if (currentView === 'room' && isConnected && currentUser) {
      startMicrophone().catch(() => {});
    }
  }, [currentView, isConnected, currentUser]);

  // Transform remoteStreams into list of streamers (Filter ONLY real video tracks)
  const allStreamers = useMemo(() => {
    const list = Array.from(remoteStreams.values())
      .filter((peer: any) => peer.stream && peer.stream.getVideoTracks().length > 0)
      .map((peer: any) => ({
        id: peer.userId,
        name: peer.userName,
        avatar: peer.avatarUrl,
        avatarColor: peer.avatarColor,
        isStreaming: true,
        stream: peer.stream,
        gameTitle: 'Transmissão Ao Vivo',
        viewers: users.length,
        isLocal: false,
      }));

    if (isStreaming && localScreenStream && currentUser) {
      list.unshift({
        id: currentUser.id,
        name: `${currentUser.displayName || currentUser.username} (Você)`,
        avatar: currentUser.avatarUrl,
        avatarColor: currentUser.avatarColor,
        isStreaming: true,
        stream: localScreenStream,
        gameTitle: 'Sua Transmissão',
        viewers: users.length,
        isLocal: true,
      });
    }

    return list;
  }, [remoteStreams, isStreaming, localScreenStream, currentUser, users]);

  // Current active streamer in the Stage
  const currentStreamer = useMemo(() => {
    if (allStreamers.length === 0) return null;
    if (activeStreamerId) {
      const found = allStreamers.find((s) => s.id === activeStreamerId);
      if (found) return found;
    }
    return allStreamers[0];
  }, [allStreamers, activeStreamerId]);

  // Build participant list
  const participants = useMemo<UserProfile[]>(() => {
    const list: UserProfile[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      avatarColor: u.avatarColor,
      status: 'online',
      isStreaming: u.isStreaming,
      isSpeaking: u.isSpeaking,
      isMuted: u.isMuted,
      isDeaf: u.isDeaf,
      streamTitle: u.streamTitle,
      isHost: u.id === users[0]?.id,
    }));

    if (currentUser) {
      const meInList = list.find((u) => u.id === currentUser.id);
      if (meInList) {
        meInList.isStreaming = isStreaming;
        meInList.isSpeaking = isLocalSpeaking;
        meInList.isMuted = isMuted;
        meInList.isDeaf = isDeaf;
      }
    }

    return list;
  }, [users, currentUser, isStreaming, isLocalSpeaking, isMuted, isDeaf]);

  // Handlers
  const handleCreateAndJoin = (name: string, id: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      showToast('Faça login com sua Conta Google para criar uma sala.');
      return;
    }

    setRoomId(id);
    setRoomName(name);
    setCurrentView('room');

    const url = new URL(window.location.href);
    url.searchParams.set('room', id);
    window.history.pushState({}, '', url.toString());

    showToast(`"${name}" criada com sucesso!`);
  };

  const handleJoinByCode = (code: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      showToast('Faça login com sua Conta Google para entrar na sala.');
      return;
    }

    const cleanId = code.toLowerCase().trim().replace(/\s+/g, '-');
    setRoomId(cleanId);
    setRoomName(cleanId.replace(/-/g, ' ').toUpperCase());
    setCurrentView('room');

    const url = new URL(window.location.href);
    url.searchParams.set('room', cleanId);
    window.history.pushState({}, '', url.toString());
  };

  const handleLeaveRoom = () => {
    stopScreenShare();
    setRoomId('');
    setRoomName('');
    setActiveStreamerId(null);
    setCurrentView('landing');

    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  const handleCloseAndDestroyRoom = () => {
    closeRoom();
    stopScreenShare();
    setRoomId('');
    setRoomName('');
    setActiveStreamerId(null);
    setCurrentView('landing');

    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());

    showToast('Você encerrou e excluiu a sala.');
  };

  const handleToggleScreenShare = async () => {
    if (isStreaming) {
      stopScreenShare();
      showToast('Transmissão de tela encerrada.');
    } else {
      try {
        await startScreenShare();
        showToast('Compartilhando tela em 1080p 60 FPS!');
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          showToast('Erro ao iniciar compartilhamento de tela.');
        }
      }
    }
  };

  const handleToggleMic = async () => {
    if (!localMicStream) {
      try {
        await startMicrophone();
      } catch {
        showToast('Microfone não encontrado ou sem permissão.');
      }
    } else {
      toggleMute();
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dmg_auth_token');
    localStorage.removeItem('dmg_auth_user');
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    setCurrentView('landing');
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

      {/* Dedicated Background Audio Players for every connected remote peer */}
      {currentView === 'room' &&
        Array.from(remoteStreams.entries()).map(([peerId, peerData]) => (
          <RemoteAudioPlayer key={peerId} stream={peerData.stream} isDeaf={isDeaf} />
        ))}

      {currentView === 'landing' ? (
        <LandingView
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenCreateModal={() => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
              showToast('Faça login com sua Conta Google para criar uma sala.');
            } else {
              setIsCreateModalOpen(true);
            }
          }}
          onJoinRoom={(code) => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
              showToast('Faça login com sua Conta Google para entrar.');
            } else {
              handleJoinByCode(code);
            }
          }}
          onOpenTermsModal={() => setIsTermsModalOpen(true)}
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
              activeRoomName={roomName}
              onOpenCreateRoom={() => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  showToast('Faça login com sua Conta Google para criar salas.');
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onOpenProfile={() => (!currentUser ? setIsAuthModalOpen(true) : setIsProfileModalOpen(true))}
              onLeaveRoom={handleLeaveRoom}
              onCloseRoom={handleCloseAndDestroyRoom}
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
              currentUserId={currentUser ? currentUser.id : ''}
              remoteStreams={remoteStreams}
            />

            {/* 3. Painel Direito (Participantes & Chat) */}
            <RightPanel
              roomName={roomName || roomId}
              roomId={roomId}
              participants={participants}
              currentUserId={currentUser ? currentUser.id : ''}
              messages={messages}
              activeYouTubeTrack={activeYouTubeTrack}
              onSendMessage={sendMessage}
              onSendReaction={sendReaction}
              onSelectStreamer={(id) => setActiveStreamerId(id)}
              onCloseRoom={handleCloseAndDestroyRoom}
              onStopYouTubeTrack={stopYouTubeTrack}
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

      {currentUser && (
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
      )}

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

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </div>
  );
}
