import { useEffect, useRef, useState, useCallback } from 'react';
import { User, ChatMessage, StreamQuality, AudioSettings, PeerStreamData } from '../types';
import { createAudioLevelDetector } from '../utils/audio';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

export interface WebRTCUserProps {
  id: string;
  name: string;
  avatar?: string;
  avatarColor: string;
}

export function useWebRTC(
  roomId: string,
  user: WebRTCUserProps,
  onRoomClosed?: (reason: string) => void
) {
  const onRoomClosedRef = useRef(onRoomClosed);
  onRoomClosedRef.current = onRoomClosed;

  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pingMs, setPingMs] = useState<number>(12);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, PeerStreamData>>(new Map());

  // Local Media states
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [localMicStream, setLocalMicStream] = useState<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeaf, setIsDeaf] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  // Quality & Audio settings
  const [streamQuality, setStreamQuality] = useState<StreamQuality>({
    resolution: '1080p',
    fps: 60,
    bitrate: '8000 Kbps',
    latencyMs: 12,
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    selectedAudioInputId: 'default',
    selectedAudioOutputId: 'default',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    systemAudioEnabled: true,
    micAudioEnabled: true,
    micVolume: 100,
    gameVolume: 100,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const speakingCleanupsRef = useRef<Map<string, () => void>>(new Map());
  const localMicStreamRef = useRef<MediaStream | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);
  const userRef = useRef<WebRTCUserProps>(user);
  const usersRef = useRef<User[]>(users);

  userRef.current = user;
  usersRef.current = users;
  localMicStreamRef.current = localMicStream;
  localScreenStreamRef.current = localScreenStream;

  // Attach local streams (mic + screen) to a given RTCPeerConnection
  const attachLocalTracksToPC = useCallback((pc: RTCPeerConnection) => {
    const senders = pc.getSenders();

    // Add microphone audio tracks
    const mic = localMicStreamRef.current;
    if (mic) {
      mic.getAudioTracks().forEach((track) => {
        const existing = senders.find((s) => s.track?.kind === 'audio' && s.track?.id === track.id);
        if (!existing) {
          try {
            pc.addTrack(track, mic);
          } catch (e) {
            console.warn('Track already added or failed:', e);
          }
        }
      });
    }

    // Add screen video & audio tracks
    const screen = localScreenStreamRef.current;
    if (screen) {
      screen.getTracks().forEach((track) => {
        const existing = senders.find((s) => s.track?.id === track.id);
        if (!existing) {
          try {
            pc.addTrack(track, screen);
          } catch (e) {
            console.warn('Screen track already added or failed:', e);
          }
        }
      });
    }
  }, []);

  // Create or retrieve PeerConnection for a remote peer
  const createPeerConnection = useCallback(
    (targetUserId: string, isInitiator: boolean = false) => {
      if (peerConnectionsRef.current.has(targetUserId)) {
        return peerConnectionsRef.current.get(targetUserId)!;
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(targetUserId, pc);

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'signal',
              targetId: targetUserId,
              signalData: {
                type: 'candidate',
                candidate: event.candidate,
              },
            })
          );
        }
      };

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);

        setRemoteStreams((prev) => {
          const next = new Map(prev);
          const remoteUser = usersRef.current.find((u) => u.id === targetUserId);
          next.set(targetUserId, {
            userId: targetUserId,
            userName: remoteUser?.name || `Gamer-${targetUserId.slice(0, 4)}`,
            avatarColor: remoteUser?.avatarColor || '#6366f1',
            avatarUrl: remoteUser?.avatar,
            stream,
            streamType: stream.getVideoTracks().length > 0 ? 'screen' : 'screen',
          });
          return next;
        });

        // Set up speaking level indicator for remote user audio
        if (event.track.kind === 'audio') {
          const cleanupExisting = speakingCleanupsRef.current.get(targetUserId);
          if (cleanupExisting) cleanupExisting();

          const stopDetect = createAudioLevelDetector(stream, (speaking) => {
            setUsers((prev) =>
              prev.map((u) => (u.id === targetUserId ? { ...u, isSpeaking: speaking } : u))
            );
          });
          speakingCleanupsRef.current.set(targetUserId, stopDetect);
        }
      };

      // Attach current local tracks if available
      attachLocalTracksToPC(pc);

      // If initiator, generate offer
      if (isInitiator) {
        pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'signal',
                  targetId: targetUserId,
                  signalData: pc.localDescription,
                })
              );
            }
          })
          .catch((err) => console.error('Failed to create offer:', err));
      }

      return pc;
    },
    [attachLocalTracksToPC]
  );

  // Handle incoming signaling messages
  const handleSignalingData = useCallback(
    async (senderId: string, signalData: any) => {
      let pc = peerConnectionsRef.current.get(senderId);
      if (!pc) {
        pc = createPeerConnection(senderId, false);
      }

      try {
        if (signalData.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));

          // Process any queued candidates
          const queued = iceCandidatesQueueRef.current.get(senderId) || [];
          for (const candidate of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
          iceCandidatesQueueRef.current.delete(senderId);

          // Attach local tracks before answering
          attachLocalTracksToPC(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'signal',
                targetId: senderId,
                signalData: pc.localDescription,
              })
            );
          }
        } else if (signalData.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));

          // Process any queued candidates
          const queued = iceCandidatesQueueRef.current.get(senderId) || [];
          for (const candidate of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
          iceCandidatesQueueRef.current.delete(senderId);
        } else if (signalData.type === 'candidate') {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } else {
            // Queue candidate until remote description is set
            const queue = iceCandidatesQueueRef.current.get(senderId) || [];
            queue.push(signalData.candidate);
            iceCandidatesQueueRef.current.set(senderId, queue);
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', err);
      }
    },
    [attachLocalTracksToPC, createPeerConnection]
  );

  // Broadcast track additions or updates to all connected peers
  const renegotiateAllPeers = useCallback(() => {
    peerConnectionsRef.current.forEach((pc, targetId) => {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'signal',
                targetId,
                signalData: pc.localDescription,
              })
            );
          }
        })
        .catch((err) => console.error('Renegotiation error with', targetId, err));
    });
  }, []);

  // WebSocket signaling setup (connects ONCE per roomId/userId)
  useEffect(() => {
    if (!roomId || !user.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const pathname = window.location.pathname;
    const basePath = pathname.includes('/dmg-live-share') ? '/dmg-live-share' : '';
    const wsUrl = `${protocol}//${window.location.host}${basePath}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 4000);

    ws.onopen = () => {
      setIsConnected(true);
      const currentUser = userRef.current;
      ws.send(
        JSON.stringify({
          type: 'join-room',
          roomId,
          userId: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          avatarColor: currentUser.avatarColor,
        })
      );
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'pong': {
            if (data.clientTimestamp) {
              const diff = Date.now() - data.clientTimestamp;
              setPingMs(Math.max(4, diff));
              setStreamQuality((prev) => ({ ...prev, latencyMs: Math.max(4, diff) }));
            }
            break;
          }

          case 'room-joined': {
            setUsers(data.users || []);
            setMessages(data.messages || []);
            break;
          }

          case 'user-joined': {
            const newUser: User = data.user;
            setUsers((prev) => {
              if (prev.some((u) => u.id === newUser.id)) return prev;
              return [...prev, newUser];
            });

            // Initiate WebRTC offer to new user
            createPeerConnection(newUser.id, true);
            break;
          }

          case 'user-left': {
            setUsers((prev) => prev.filter((u) => u.id !== data.userId));
            const pc = peerConnectionsRef.current.get(data.userId);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(data.userId);
            }
            setRemoteStreams((prev) => {
              const next = new Map(prev);
              next.delete(data.userId);
              return next;
            });
            break;
          }

          case 'user-status-updated': {
            const updatedUser: User = data.user;
            setUsers((prev) =>
              prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
            );
            break;
          }

          case 'chat-message': {
            setMessages((prev) => [...prev, data.message]);
            break;
          }

          case 'reaction-received': {
            break;
          }

          case 'room-closed': {
            // Room was closed by host
            if (onRoomClosedRef.current) {
              onRoomClosedRef.current(data.message || 'A sala foi encerrada pelo anfitrião.');
            }
            break;
          }

          case 'signal': {
            handleSignalingData(data.senderId, data.signalData);
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      iceCandidatesQueueRef.current.clear();
      speakingCleanupsRef.current.forEach((cleanup) => cleanup());
      speakingCleanupsRef.current.clear();
    };
  }, [roomId, user.id, createPeerConnection, handleSignalingData]);

  // Start Microphone
  const startMicrophone = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: audioSettings.selectedAudioInputId !== 'default' ? { exact: audioSettings.selectedAudioInputId } : undefined,
          echoCancellation: audioSettings.echoCancellation,
          noiseSuppression: audioSettings.noiseSuppression,
          autoGainControl: audioSettings.autoGainControl,
          channelCount: 2,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalMicStream(stream);

      // Speaking detector for local microphone
      const stopLocalDetect = createAudioLevelDetector(stream, (speaking) => {
        setIsLocalSpeaking(speaking);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'update-status',
              isSpeaking: speaking,
            })
          );
        }
      });

      // Update all active peer connections with new microphone track
      stream.getAudioTracks().forEach((track) => {
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const existing = senders.find((s) => s.track?.kind === 'audio');
          if (existing) {
            existing.replaceTrack(track).catch(() => {});
          } else {
            pc.addTrack(track, stream);
          }
        });
      });

      renegotiateAllPeers();
      return () => stopLocalDetect();
    } catch (err) {
      console.warn('Microphone error:', err);
      throw err;
    }
  }, [audioSettings, renegotiateAllPeers]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (localMicStream) {
      const newMuted = !isMuted;
      localMicStream.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'update-status',
            isMuted: newMuted,
          })
        );
      }
    }
  }, [localMicStream, isMuted]);

  // Toggle Deafen
  const toggleDeafen = useCallback(() => {
    const newDeaf = !isDeaf;
    setIsDeaf(newDeaf);

    if (localMicStream) {
      localMicStream.getAudioTracks().forEach((track) => {
        track.enabled = !newDeaf && !isMuted;
      });
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'update-status',
          isDeaf: newDeaf,
        })
      );
    }
  }, [isDeaf, isMuted, localMicStream]);

  // Start Screen Sharing
  const startScreenShare = useCallback(async () => {
    try {
      const constraints: DisplayMediaStreamOptions = {
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 60, max: 60 },
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
        },
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Enhance motion smoothness hint
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'contentHint' in videoTrack) {
        (videoTrack as any).contentHint = 'motion';
      }

      setLocalScreenStream(stream);
      setIsStreaming(true);

      // Notify WebSocket room
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'update-status',
            isStreaming: true,
            streamTitle: 'Gameplay Ao Vivo',
          })
        );
      }

      // Add screen tracks to all peer connections
      stream.getTracks().forEach((track) => {
        peerConnectionsRef.current.forEach((pc) => {
          pc.addTrack(track, stream);
        });
      });

      renegotiateAllPeers();

      // Handle user stopping screen share from browser banner
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Screen share error or cancelled:', err);
      throw err;
    }
  }, [renegotiateAllPeers]);

  // Stop Screen Share
  const stopScreenShare = useCallback(() => {
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((track) => track.stop());
      setLocalScreenStream(null);
    }
    setIsStreaming(false);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'update-status',
          isStreaming: false,
          streamTitle: '',
        })
      );
    }

    // Remove video senders from peer connections
    peerConnectionsRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          try {
            pc.removeTrack(sender);
          } catch {}
        }
      });
    });

    renegotiateAllPeers();
  }, [localScreenStream, renegotiateAllPeers]);

  // Send text message in room chat
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;

      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        roomId,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        avatarColor: user.avatarColor,
        text: text.trim(),
        timestamp: Date.now(),
        type: 'text',
      };

      wsRef.current.send(
        JSON.stringify({
          type: 'chat-message',
          message: newMsg,
        })
      );
    },
    [roomId, user]
  );

  // Send interactive emoji reaction
  const sendReaction = useCallback((emoji: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'send-reaction',
        emoji,
      })
    );
  }, []);

  // Close / Delete entire room for all participants
  const closeRoom = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(
        JSON.stringify({
          type: 'close-room',
          roomId,
        })
      );
    }
  }, [roomId]);

  return {
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
    audioSettings,
    setAudioSettings,
    startMicrophone,
    toggleMute,
    toggleDeafen,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    sendReaction,
    closeRoom,
  };
}
