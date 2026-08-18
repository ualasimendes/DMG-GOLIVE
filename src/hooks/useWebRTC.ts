import { useEffect, useRef, useState, useCallback } from 'react';
import { User, ChatMessage, StreamQuality, AudioSettings, PeerStreamData } from '../types';
import { soundEngine, createAudioLevelDetector } from '../utils/audio';

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

export function useWebRTC(roomId: string, user: WebRTCUserProps) {
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

  // Quality Preset
  const [streamQuality, setStreamQuality] = useState<StreamQuality>({
    resolution: '1080p',
    fps: 60,
    bitrate: '8500 kbps',
    latencyMs: 12,
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    selectedAudioInputId: 'default',
    selectedAudioOutputId: 'default',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false,
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
          const remoteUser = users.find((u) => u.id === targetUserId);
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
    [attachLocalTracksToPC, users]
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

  // WebSocket signaling setup
  useEffect(() => {
    if (!roomId || !user.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Match subpath if running under /dmg-live-share
    const pathname = window.location.pathname;
    const basePath = pathname.includes('/dmg-live-share') ? '/dmg-live-share' : '';
    const wsUrl = `${protocol}//${window.location.host}${basePath}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 3000);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'join-room',
          roomId,
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          avatarColor: user.avatarColor,
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
            soundEngine.playJoin();
            break;
          }

          case 'user-joined': {
            const newUser: User = data.user;
            setUsers((prev) => {
              if (prev.some((u) => u.id === newUser.id)) return prev;
              return [...prev, newUser];
            });
            soundEngine.playJoin();

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
            soundEngine.playLeave();
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
            if (data.message.senderId !== user.id && data.message.type !== 'system') {
              soundEngine.playMessagePing();
            }
            break;
          }

          case 'reaction-received': {
            // Forward reaction
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
  }, [roomId, user.id, user.name, user.avatar, user.avatarColor, createPeerConnection, handleSignalingData]);

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

      // Attach track to all existing peer connections
      const audioTrack = stream.getAudioTracks()[0];
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const existingAudioSender = senders.find((s) => s.track?.kind === 'audio');
        if (existingAudioSender) {
          existingAudioSender.replaceTrack(audioTrack);
        } else {
          pc.addTrack(audioTrack, stream);
        }
      });

      // Local speaking detector
      createAudioLevelDetector(stream, (speaking) => {
        setIsLocalSpeaking(speaking && !isMuted);
      });

      renegotiateAllPeers();
      return stream;
    } catch (err) {
      console.warn('Microphone permission denied or not available:', err);
      return null;
    }
  }, [audioSettings, isMuted, renegotiateAllPeers]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localMicStreamRef.current) {
        localMicStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      if (next) {
        soundEngine.playMute();
      } else {
        soundEngine.playUnmute();
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'update-status',
            isMuted: next,
          })
        );
      }
      return next;
    });
  }, []);

  // Toggle Deafen (mute incoming audio + mute self)
  const toggleDeafen = useCallback(() => {
    setIsDeaf((prev) => {
      const next = !prev;
      if (next) {
        soundEngine.playMute();
      } else {
        soundEngine.playUnmute();
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'update-status',
            isDeaf: next,
          })
        );
      }
      return next;
    });
  }, []);

  // Stop Screen Share
  const stopScreenShare = useCallback(() => {
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalScreenStream(null);
    }
    setIsStreaming(false);

    // Remove video tracks from peer connections
    peerConnectionsRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      senders.forEach((sender) => {
        if (sender.track && sender.track.kind === 'video') {
          try {
            pc.removeTrack(sender);
          } catch (e) {
            console.warn('Error removing track:', e);
          }
        }
      });
    });

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'update-status',
          isStreaming: false,
          streamTitle: undefined,
        })
      );
    }

    renegotiateAllPeers();
  }, [renegotiateAllPeers]);

  // Start Screen Share (Go Live)
  const startScreenShare = useCallback(async () => {
    try {
      const idealWidth = streamQuality.resolution === '4K' ? 3840 : streamQuality.resolution === '1440p' ? 2560 : 1920;
      const idealHeight = streamQuality.resolution === '4K' ? 2160 : streamQuality.resolution === '1440p' ? 1440 : 1080;

      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
          width: { ideal: idealWidth, max: idealWidth },
          height: { ideal: idealHeight, max: idealHeight },
          frameRate: { ideal: streamQuality.fps, max: streamQuality.fps },
        },
        audio: audioSettings.systemAudioEnabled
          ? {
              autoGainControl: false,
              echoCancellation: false,
              noiseSuppression: false,
              channelCount: 2,
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      setLocalScreenStream(stream);
      setIsStreaming(true);
      soundEngine.playGoLive();

      // Optimize video track for smooth gameplay motion
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'contentHint' in videoTrack) {
        (videoTrack as any).contentHint = 'motion';
      }

      // Handle user stopping screen share via browser floating bar
      videoTrack.onended = () => {
        stopScreenShare();
      };

      // Add screen tracks to all peer connections
      peerConnectionsRef.current.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, stream);
          } catch (e) {
            console.warn('Track addition error:', e);
          }
        });
      });

      // Update room status
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'update-status',
            isStreaming: true,
            streamTitle: `${user.name}'s Screen (${streamQuality.resolution} ${streamQuality.fps}FPS)`,
          })
        );
      }

      renegotiateAllPeers();
    } catch (err: any) {
      console.warn('Screen share cancelled or failed:', err);
    }
  }, [audioSettings.systemAudioEnabled, renegotiateAllPeers, stopScreenShare, streamQuality.fps, streamQuality.resolution, user.name]);

  // Send Chat Message
  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'chat-message',
        text,
      })
    );
  }, []);

  // Send Reaction / Emoji
  const sendReaction = useCallback((emoji: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'send-reaction',
        emoji,
      })
    );
  }, []);

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
  };
}
