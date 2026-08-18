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
    { urls: 'stun:stun.services.mozilla.com' },
    // Servidores TURN Públicos Gratuitos para Transposição de NAT Simétrico / CGNAT
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

export interface WebRTCUserProps {
  id: string;
  name: string;
  avatar?: string;
  avatarColor: string;
  email?: string;
  role?: 'admin1' | 'admin2' | 'member';
}

function getBitrateKbps(quality: StreamQuality): number {
  if (quality.bitrate) {
    const parsed = parseInt(quality.bitrate, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  switch (quality.resolution) {
    case '4K':
      return 18000;
    case '1440p':
      return 12000;
    case '1080p':
      return 8000;
    case '720p':
    default:
      return 4000;
  }
}

function enhanceSdpQuality(sdp: string, bitrateKbps: number = 8000): string {
  const lines = sdp.split('\r\n');
  const result: string[] = [];
  let isVideoSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('m=video')) {
      isVideoSection = true;
      result.push(line);
      // Injeta taxas de transmissão em Kbps (b=AS) e bps (b=TIAS)
      result.push(`b=AS:${bitrateKbps}`);
      result.push(`b=TIAS:${bitrateKbps * 1000}`);
      continue;
    } else if (line.startsWith('m=')) {
      isVideoSection = false;
    }

    if (isVideoSection && line.startsWith('a=fmtp:')) {
      // Injeta parâmetros de bitrate do Google para Chrome / Edge / Brave / Firefox
      if (!line.includes('x-google-min-bitrate')) {
        result.push(
          `${line};x-google-min-bitrate=3500;x-google-start-bitrate=6000;x-google-max-bitrate=${bitrateKbps}`
        );
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\r\n');
}

function applyCodecPreferences(transceiver: RTCRtpTransceiver) {
  if ('getCapabilities' in RTCRtpSender) {
    try {
      const capabilities = RTCRtpSender.getCapabilities('video');
      if (capabilities && capabilities.codecs) {
        const sorted = [...capabilities.codecs].sort((a, b) => {
          const mimeA = a.mimeType.toLowerCase();
          const mimeB = b.mimeType.toLowerCase();
          const score = (m: string, fmtp?: string) => {
            if (m === 'video/h264') {
              if (fmtp?.includes('profile-level-id=42e0') || fmtp?.includes('profile-level-id=6400'))
                return 100;
              return 90;
            }
            if (m === 'video/vp9') return 85;
            if (m === 'video/av1') return 80;
            if (m === 'video/vp8') return 50;
            return 10;
          };
          return score(mimeB, b.sdpFmtpLine) - score(mimeA, a.sdpFmtpLine);
        });
        transceiver.setCodecPreferences(sorted);
      }
    } catch (e) {
      console.warn('[WebRTC] Codec preferences notice:', e);
    }
  }
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
  const [isMuted, setIsMuted] = useState(true);
  const [isDeaf, setIsDeaf] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [activeYouTubeTrack, setActiveYouTubeTrack] = useState<{
    videoId: string;
    requestedBy: string;
    isPlaying: boolean;
  } | null>(null);

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
  const makingOfferRef = useRef<Map<string, boolean>>(new Map());
  const ignoreOfferRef = useRef<Map<string, boolean>>(new Map());
  const isSettingRemoteAnswerPendingRef = useRef<Map<string, boolean>>(new Map());
  const iceCandidatesQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const speakingCleanupsRef = useRef<Map<string, () => void>>(new Map());
  const localMicStreamRef = useRef<MediaStream | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);
  const userRef = useRef<WebRTCUserProps>(user);
  const usersRef = useRef<User[]>(users);
  const compositeStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const streamQualityRef = useRef<StreamQuality>(streamQuality);

  userRef.current = user;
  usersRef.current = users;
  localMicStreamRef.current = localMicStream;
  localScreenStreamRef.current = localScreenStream;
  streamQualityRef.current = streamQuality;

  // Apply maximum resolution and bitrate parameters to RTCRtpSender
  const applyVideoQualityToPc = useCallback(
    async (pc: RTCPeerConnection, quality: StreamQuality) => {
      const bitrateKbps = getBitrateKbps(quality);
      const fps = quality.fps || 60;

      const senders = pc.getSenders();
      for (const sender of senders) {
        if (sender.track?.kind === 'video') {
          try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = bitrateKbps * 1000;
            params.encodings[0].maxFramerate = fps;
            params.encodings[0].scaleResolutionDownBy = 1.0;
            (params.encodings[0] as any).networkPriority = 'high';
            (params.encodings[0] as any).priority = 'high';
            (params as any).degradationPreference = 'maintain-resolution';

            await sender.setParameters(params);
            console.log(`[WebRTC Quality] Configurado ${bitrateKbps} Kbps @ ${fps} FPS`);
          } catch (err) {
            console.warn('[WebRTC Quality] Sender parameters notice:', err);
          }
        }
      }
    },
    []
  );

  // Live quality update across all active connections
  useEffect(() => {
    peerConnectionsRef.current.forEach((pc) => {
      applyVideoQualityToPc(pc, streamQuality);
    });
  }, [streamQuality, applyVideoQualityToPc]);

  // Create or retrieve PeerConnection for a remote peer with Perfect Negotiation
  const getOrCreatePeerConnection = useCallback(
    (targetUserId: string): RTCPeerConnection => {
      if (peerConnectionsRef.current.has(targetUserId)) {
        return peerConnectionsRef.current.get(targetUserId)!;
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(targetUserId, pc);
      makingOfferRef.current.set(targetUserId, false);
      ignoreOfferRef.current.set(targetUserId, false);
      isSettingRemoteAnswerPendingRef.current.set(targetUserId, false);

      // W3C Perfect Negotiation Pattern: onnegotiationneeded
      pc.onnegotiationneeded = async () => {
        try {
          makingOfferRef.current.set(targetUserId, true);
          await pc.setLocalDescription();
          if (wsRef.current?.readyState === WebSocket.OPEN && pc.localDescription) {
            const bitrateKbps = getBitrateKbps(streamQualityRef.current);
            const enhancedSdp = enhanceSdpQuality(pc.localDescription.sdp, bitrateKbps);
            const modifiedSignal = {
              type: pc.localDescription.type,
              sdp: enhancedSdp,
            };

            wsRef.current.send(
              JSON.stringify({
                type: 'signal',
                targetId: targetUserId,
                signalData: modifiedSignal,
              })
            );
          }
        } catch (err) {
          console.warn(`[WebRTC] Negotiation needed notice for ${targetUserId}:`, err);
        } finally {
          makingOfferRef.current.set(targetUserId, false);
        }
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'signal',
              targetId: targetUserId,
              signalData: {
                type: 'candidate',
                candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
              },
            })
          );
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC ICE ${targetUserId}] state:`, pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          try {
            pc.restartIce();
          } catch {}
        }
      };

      // Initialize unified transceivers
      try {
        const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
        const mic = localMicStreamRef.current;
        if (mic && mic.getAudioTracks().length > 0) {
          audioTransceiver.sender.replaceTrack(mic.getAudioTracks()[0]).catch(() => {});
        }
      } catch (e) {
        console.warn('[WebRTC] Audio transceiver setup notice:', e);
      }

      try {
        const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });
        applyCodecPreferences(videoTransceiver);

        const screen = localScreenStreamRef.current;
        if (screen && screen.getVideoTracks().length > 0) {
          videoTransceiver.sender.replaceTrack(screen.getVideoTracks()[0]).catch(() => {});
          applyVideoQualityToPc(pc, streamQualityRef.current);
        }
      } catch (e) {
        console.warn('[WebRTC] Video transceiver setup notice:', e);
      }

      // Handle incoming remote media tracks (Audio + Screen Video)
      pc.ontrack = (event) => {
        console.log(`[WebRTC ontrack] Track from ${targetUserId}:`, event.track.kind, event.track.id);

        let composite = compositeStreamsRef.current.get(targetUserId);
        if (!composite) {
          composite = new MediaStream();
          compositeStreamsRef.current.set(targetUserId, composite);
        }

        // Add track to persistent composite stream if not yet present
        if (!composite.getTracks().some((t) => t.id === event.track.id)) {
          composite.addTrack(event.track);
        }

        const syncRemoteStreams = () => {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            const remoteUser = usersRef.current.find((u) => u.id === targetUserId);
            const currentStream = compositeStreamsRef.current.get(targetUserId);

            if (currentStream) {
              next.set(targetUserId, {
                userId: targetUserId,
                userName: remoteUser?.name || `Gamer-${targetUserId.slice(0, 4)}`,
                avatarColor: remoteUser?.avatarColor || '#6366f1',
                avatarUrl: remoteUser?.avatar,
                stream: currentStream,
                streamType: 'screen',
              });
            }
            return next;
          });
        };

        syncRemoteStreams();

        event.track.onended = () => {
          console.log(`[WebRTC track ended] ${event.track.kind} ended from ${targetUserId}`);
          try {
            composite?.removeTrack(event.track);
          } catch {}
          syncRemoteStreams();
        };

        event.track.onmute = () => {
          syncRemoteStreams();
        };

        event.track.onunmute = () => {
          syncRemoteStreams();
        };

        // Set up speaking level indicator for remote user audio
        if (event.track.kind === 'audio') {
          const cleanupExisting = speakingCleanupsRef.current.get(targetUserId);
          if (cleanupExisting) cleanupExisting();

          const stopDetect = createAudioLevelDetector(composite, (speaking) => {
            setUsers((prev) =>
              prev.map((u) => (u.id === targetUserId ? { ...u, isSpeaking: speaking } : u))
            );
          });
          speakingCleanupsRef.current.set(targetUserId, stopDetect);
        }
      };

      return pc;
    },
    [applyVideoQualityToPc]
  );

  // Handle incoming signaling messages with Perfect Negotiation
  const handleSignalingData = useCallback(
    async (senderId: string, signalData: any) => {
      if (!senderId || !signalData) return;
      const pc = getOrCreatePeerConnection(senderId);

      try {
        if (signalData.type === 'offer' || signalData.type === 'answer') {
          const isOffer = signalData.type === 'offer';
          const isMakingOffer = makingOfferRef.current.get(senderId) || false;

          // Perfect Negotiation: Polite peer yields on collision
          const offerCollision = isOffer && (isMakingOffer || pc.signalingState !== 'stable');
          const isPolite = userRef.current.id < senderId;
          const shouldIgnore = !isPolite && offerCollision;
          ignoreOfferRef.current.set(senderId, shouldIgnore);

          if (shouldIgnore) {
            console.warn(`[WebRTC] Glare collision: Impolite peer ignoring offer from ${senderId}`);
            return;
          }

          if (offerCollision && isPolite) {
            console.log(`[WebRTC] Glare collision: Polite peer rolling back for ${senderId}`);
            await pc.setLocalDescription({ type: 'rollback' } as any).catch(() => {});
          }

          isSettingRemoteAnswerPendingRef.current.set(senderId, !isOffer);
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));
          isSettingRemoteAnswerPendingRef.current.set(senderId, false);

          // Drain queued ICE candidates
          const queued = iceCandidatesQueueRef.current.get(senderId) || [];
          for (const candidate of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn('[WebRTC] Error adding queued ICE candidate:', e);
            }
          }
          iceCandidatesQueueRef.current.delete(senderId);

          if (isOffer) {
            await pc.setLocalDescription();
            if (wsRef.current?.readyState === WebSocket.OPEN && pc.localDescription) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'signal',
                  targetId: senderId,
                  signalData: pc.localDescription,
                })
              );
            }
          }
        } else if (signalData.type === 'candidate') {
          const candidateInit = signalData.candidate;
          if (!candidateInit) return;

          try {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
            } else {
              const queue = iceCandidatesQueueRef.current.get(senderId) || [];
              queue.push(candidateInit);
              iceCandidatesQueueRef.current.set(senderId, queue);
            }
          } catch (err) {
            if (!ignoreOfferRef.current.get(senderId)) {
              console.warn('[WebRTC] Error adding ICE candidate:', err);
            }
          }
        }
      } catch (err) {
        console.error(`[WebRTC] Error processing signal from ${senderId}:`, err);
      }
    },
    [getOrCreatePeerConnection]
  );

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
          email: currentUser.email,
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

            // For existing members in room, initialize peer connections
            if (Array.isArray(data.users)) {
              data.users.forEach((existingUser: User) => {
                if (existingUser.id !== userRef.current.id) {
                  getOrCreatePeerConnection(existingUser.id);
                }
              });
            }
            break;
          }

          case 'user-joined': {
            const newUser: User = data.user;
            setUsers((prev) => {
              if (prev.some((u) => u.id === newUser.id)) return prev;
              return [...prev, newUser];
            });

            // Initialize connection for newcomer
            getOrCreatePeerConnection(newUser.id);
            break;
          }

          case 'user-left': {
            setUsers((prev) => prev.filter((u) => u.id !== data.userId));
            const pc = peerConnectionsRef.current.get(data.userId);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(data.userId);
            }
            makingOfferRef.current.delete(data.userId);
            ignoreOfferRef.current.delete(data.userId);
            isSettingRemoteAnswerPendingRef.current.delete(data.userId);
            iceCandidatesQueueRef.current.delete(data.userId);
            compositeStreamsRef.current.delete(data.userId);

            const stopSpeaking = speakingCleanupsRef.current.get(data.userId);
            if (stopSpeaking) {
              stopSpeaking();
              speakingCleanupsRef.current.delete(data.userId);
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

          case 'youtube-track-play': {
            setActiveYouTubeTrack({
              videoId: data.videoId,
              requestedBy: data.requestedBy || 'DJ Bot',
              isPlaying: true,
            });
            break;
          }

          case 'youtube-track-stop': {
            setActiveYouTubeTrack(null);
            break;
          }

          case 'reaction-received': {
            break;
          }

          case 'room-closed': {
            if (onRoomClosedRef.current) {
              onRoomClosedRef.current(data.message || 'A sala foi encerrada pelo anfitrião.');
            }
            break;
          }

          case 'stream-rejected': {
            stopScreenShare();
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
      makingOfferRef.current.clear();
      ignoreOfferRef.current.clear();
      isSettingRemoteAnswerPendingRef.current.clear();
      iceCandidatesQueueRef.current.clear();
      speakingCleanupsRef.current.forEach((cleanup) => cleanup());
      speakingCleanupsRef.current.clear();
      compositeStreamsRef.current.clear();
    };
  }, [roomId, user.id, getOrCreatePeerConnection, handleSignalingData]);

  // Start Microphone with replaceTrack on transceivers
  const startMicrophone = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId:
            audioSettings.selectedAudioInputId !== 'default'
              ? { exact: audioSettings.selectedAudioInputId }
              : undefined,
          echoCancellation: audioSettings.echoCancellation,
          noiseSuppression: audioSettings.noiseSuppression,
          autoGainControl: audioSettings.autoGainControl,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }

      setLocalMicStream(stream);
      localMicStreamRef.current = stream;

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
      if (audioTrack) {
        peerConnectionsRef.current.forEach((pc) => {
          const transceivers = pc.getTransceivers();
          const audioTransceiver = transceivers.find((t) => t.receiver.track.kind === 'audio');
          const audioSender = pc.getSenders().find((s) => s.track?.kind === 'audio');

          if (audioTransceiver && audioTransceiver.sender) {
            audioTransceiver.sender.replaceTrack(audioTrack).catch(() => {});
          } else if (audioSender) {
            audioSender.replaceTrack(audioTrack).catch(() => {});
          } else {
            try {
              pc.addTrack(audioTrack, stream);
            } catch {}
          }
        });
      }

      return () => stopLocalDetect();
    } catch (err) {
      console.warn('Microphone error:', err);
      throw err;
    }
  }, [audioSettings, isMuted]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (localMicStreamRef.current) {
      localMicStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'update-status',
          isMuted: newMuted,
        })
      );
    }
  }, [isMuted]);

  // Toggle Deafen
  const toggleDeafen = useCallback(() => {
    const newDeaf = !isDeaf;
    setIsDeaf(newDeaf);

    if (localMicStreamRef.current) {
      localMicStreamRef.current.getAudioTracks().forEach((track) => {
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
  }, [isDeaf, isMuted]);

  // Start Screen Sharing with audio & video fallback with high bitrate & resolution
  const startScreenShare = useCallback(async () => {
    try {
      const currentQ = streamQualityRef.current;
      const targetWidth =
        currentQ.resolution === '4K'
          ? 3840
          : currentQ.resolution === '1440p'
          ? 2560
          : currentQ.resolution === '720p'
          ? 1280
          : 1920;
      const targetHeight =
        currentQ.resolution === '4K'
          ? 2160
          : currentQ.resolution === '1440p'
          ? 1440
          : currentQ.resolution === '720p'
          ? 720
          : 1080;
      const targetFps = currentQ.fps || 60;

      let stream: MediaStream;
      try {
        // Attempt with audio enabled
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor',
            frameRate: { ideal: targetFps, max: targetFps },
            width: { ideal: targetWidth, max: targetWidth },
            height: { ideal: targetHeight, max: targetHeight },
            cursor: 'always',
          } as any,
          audio: true,
        });
      } catch (eWithAudio) {
        // Fallback to video-only if audio capture fails or is unsupported
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor',
            frameRate: { ideal: targetFps, max: targetFps },
            width: { ideal: targetWidth, max: targetWidth },
            height: { ideal: targetHeight, max: targetHeight },
            cursor: 'always',
          } as any,
          audio: false,
        });
      }

      // Enhance motion smoothness hint
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'contentHint' in videoTrack) {
        (videoTrack as any).contentHint = 'motion';
      }

      setLocalScreenStream(stream);
      localScreenStreamRef.current = stream;
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

      // Replace video track on all peer connections and apply high bitrate
      peerConnectionsRef.current.forEach((pc) => {
        const transceivers = pc.getTransceivers();
        const videoTransceiver = transceivers.find((t) => t.receiver.track.kind === 'video');
        const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video');

        if (videoTransceiver && videoTransceiver.sender) {
          videoTransceiver.sender.replaceTrack(videoTrack).catch(() => {});
        } else if (videoSender) {
          videoSender.replaceTrack(videoTrack).catch(() => {});
        } else {
          try {
            pc.addTrack(videoTrack, stream);
          } catch {}
        }

        applyVideoQualityToPc(pc, currentQ);
      });

      // Handle user stopping screen share from browser banner
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Screen share error or cancelled:', err);
      throw err;
    }
  }, [applyVideoQualityToPc]);

  // Stop Screen Share
  const stopScreenShare = useCallback(() => {
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((track) => track.stop());
      localScreenStreamRef.current = null;
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

    // Replace video track with null on all peer connections
    peerConnectionsRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          sender.replaceTrack(null).catch(() => {});
        }
      });
    });
  }, []);

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

  // Play YouTube Track via Command or UI
  const playYouTubeTrack = useCallback(
    (youtubeUrl: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage(`!playmusic ${youtubeUrl}`);
      }
    },
    [sendMessage]
  );

  // Stop YouTube Track
  const stopYouTubeTrack = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage('!stopmusic');
    }
  }, [sendMessage]);

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
    activeYouTubeTrack,
    playYouTubeTrack,
    stopYouTubeTrack,
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
