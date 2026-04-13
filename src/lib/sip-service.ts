/**
 * SIP 自動撥號服務 - 中華電信 SIP 整合
 *
 * 使用 SIP.js (WebRTC) 透過瀏覽器進行 SIP 通話
 * 支援中華電信 HiNet SIP trunk 服務
 */

export interface SipConfig {
  sipServer: string;
  sipPort: number;
  sipUsername: string;
  sipPassword: string;
  sipDomain: string;
  displayName: string;
  callerId: string;
  transport: 'ws' | 'wss' | 'udp' | 'tcp';
  stunServer: string;
}

export interface CallState {
  id: string;
  phoneNumber: string;
  status: 'idle' | 'connecting' | 'ringing' | 'answered' | 'ended' | 'failed';
  duration: number;
  startTime: Date | null;
  endTime: Date | null;
  error?: string;
}

export type SipEventHandler = {
  onRegistered?: () => void;
  onUnregistered?: () => void;
  onRegistrationFailed?: (error: string) => void;
  onCallStateChanged?: (state: CallState) => void;
  onIncomingCall?: (phoneNumber: string) => void;
};

// 預設中華電信 SIP 設定
export const DEFAULT_CHT_CONFIG: Partial<SipConfig> = {
  sipServer: 'sip.hinet.net',
  sipPort: 5060,
  transport: 'wss',
  stunServer: 'stun:stun.l.google.com:19302',
  sipDomain: 'hinet.net',
};

/**
 * SIP 服務管理器
 *
 * 注意：此服務依賴 SIP.js 函式庫進行 WebRTC SIP 通訊
 * 在生產環境中需要：
 * 1. WebSocket-to-SIP 代理伺服器（如 Obeycent, Obeycant, Kamailio）
 *    因為瀏覽器 WebRTC 無法直接連接傳統 SIP trunk
 * 2. 或使用支援 WebSocket 的 SIP 伺服器（Asterisk + WebSocket module）
 */
export class SipService {
  private config: SipConfig | null = null;
  private userAgent: any = null;
  private registerer: any = null;
  private currentSession: any = null;
  private callTimer: NodeJS.Timeout | null = null;
  private currentCallState: CallState = this.getIdleState();
  private eventHandlers: SipEventHandler = {};
  private isRegistered = false;

  private getIdleState(): CallState {
    return {
      id: '',
      phoneNumber: '',
      status: 'idle',
      duration: 0,
      startTime: null,
      endTime: null,
    };
  }

  setEventHandlers(handlers: SipEventHandler) {
    this.eventHandlers = handlers;
  }

  getRegistrationStatus(): boolean {
    return this.isRegistered;
  }

  getCurrentCallState(): CallState {
    return { ...this.currentCallState };
  }

  /**
   * 初始化 SIP 連線
   */
  async initialize(config: SipConfig): Promise<void> {
    this.config = config;

    try {
      // 動態載入 SIP.js
      const SIP = await import('sip.js');

      const wsServer = `${config.transport}://${config.sipServer}:${config.sipPort}/ws`;
      const uri = SIP.UserAgent.makeURI(`sip:${config.sipUsername}@${config.sipDomain || config.sipServer}`);

      if (!uri) {
        throw new Error('無效的 SIP URI');
      }

      const transportOptions = {
        server: wsServer,
        traceSip: false,
      };

      this.userAgent = new SIP.UserAgent({
        uri,
        transportOptions,
        authorizationUsername: config.sipUsername,
        authorizationPassword: config.sipPassword,
        displayName: config.displayName || config.callerId,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers: [
              { urls: config.stunServer },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        },
      });

      // 啟動 UserAgent
      await this.userAgent.start();

      // 註冊到 SIP 伺服器
      this.registerer = new SIP.Registerer(this.userAgent);

      this.registerer.stateChange.addListener((state: any) => {
        switch (state) {
          case SIP.RegistererState.Registered:
            this.isRegistered = true;
            this.eventHandlers.onRegistered?.();
            break;
          case SIP.RegistererState.Unregistered:
            this.isRegistered = false;
            this.eventHandlers.onUnregistered?.();
            break;
        }
      });

      await this.registerer.register();

      // 監聽來電
      this.userAgent.delegate = {
        onInvite: (invitation: any) => {
          const caller = invitation.remoteIdentity?.uri?.user || '未知號碼';
          this.eventHandlers.onIncomingCall?.(caller);
        },
      };

    } catch (error: any) {
      const errorMsg = error.message || 'SIP 連線失敗';
      this.eventHandlers.onRegistrationFailed?.(errorMsg);
      throw new Error(`SIP 初始化失敗: ${errorMsg}`);
    }
  }

  /**
   * 撥打電話
   */
  async makeCall(phoneNumber: string): Promise<string> {
    if (!this.userAgent || !this.isRegistered) {
      throw new Error('SIP 尚未連線，請先完成註冊');
    }

    if (this.currentSession) {
      throw new Error('目前有通話進行中');
    }

    const SIP = await import('sip.js');
    const callId = `call_${Date.now()}`;
    const target = SIP.UserAgent.makeURI(
      `sip:${phoneNumber.replace(/[^\d+]/g, '')}@${this.config!.sipDomain || this.config!.sipServer}`
    );

    if (!target) {
      throw new Error(`無效的電話號碼: ${phoneNumber}`);
    }

    this.currentCallState = {
      id: callId,
      phoneNumber,
      status: 'connecting',
      duration: 0,
      startTime: new Date(),
      endTime: null,
    };
    this.emitCallState();

    try {
      const inviter = new SIP.Inviter(this.userAgent, target, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      });

      this.currentSession = inviter;

      // 監聽通話狀態
      inviter.stateChange.addListener((state: any) => {
        switch (state) {
          case SIP.SessionState.Establishing:
            this.currentCallState.status = 'ringing';
            this.emitCallState();
            break;
          case SIP.SessionState.Established:
            this.currentCallState.status = 'answered';
            this.startCallTimer();
            this.emitCallState();
            break;
          case SIP.SessionState.Terminated:
            this.currentCallState.status = 'ended';
            this.currentCallState.endTime = new Date();
            this.stopCallTimer();
            this.emitCallState();
            this.currentSession = null;
            break;
        }
      });

      // 發起通話
      await inviter.invite();
      return callId;

    } catch (error: any) {
      this.currentCallState.status = 'failed';
      this.currentCallState.error = error.message;
      this.currentCallState.endTime = new Date();
      this.emitCallState();
      this.currentSession = null;
      throw error;
    }
  }

  /**
   * 掛斷通話
   */
  async hangup(): Promise<void> {
    if (!this.currentSession) return;

    const SIP = await import('sip.js');
    const state = this.currentSession.state;

    try {
      if (state === SIP.SessionState.Established) {
        this.currentSession.bye();
      } else if (state === SIP.SessionState.Establishing || state === SIP.SessionState.Initial) {
        this.currentSession.cancel();
      }
    } catch (error) {
      console.error('掛斷失敗:', error);
    }

    this.currentCallState.status = 'ended';
    this.currentCallState.endTime = new Date();
    this.stopCallTimer();
    this.emitCallState();
    this.currentSession = null;
  }

  /**
   * 斷開 SIP 連線
   */
  async disconnect(): Promise<void> {
    await this.hangup();

    if (this.registerer) {
      try {
        await this.registerer.unregister();
      } catch (e) {
        // ignore
      }
    }

    if (this.userAgent) {
      try {
        await this.userAgent.stop();
      } catch (e) {
        // ignore
      }
    }

    this.isRegistered = false;
    this.userAgent = null;
    this.registerer = null;
    this.currentCallState = this.getIdleState();
  }

  private startCallTimer() {
    this.stopCallTimer();
    this.callTimer = setInterval(() => {
      if (this.currentCallState.startTime) {
        this.currentCallState.duration = Math.floor(
          (Date.now() - this.currentCallState.startTime.getTime()) / 1000
        );
        this.emitCallState();
      }
    }, 1000);
  }

  private stopCallTimer() {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }

  private emitCallState() {
    this.eventHandlers.onCallStateChanged?.({ ...this.currentCallState });
  }
}

// 格式化通話時長
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 格式化台灣電話號碼
export function formatTWPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('886')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+886${cleaned.slice(1)}`;
  }
  return phone;
}

// 單例
let sipServiceInstance: SipService | null = null;

export function getSipService(): SipService {
  if (!sipServiceInstance) {
    sipServiceInstance = new SipService();
  }
  return sipServiceInstance;
}
