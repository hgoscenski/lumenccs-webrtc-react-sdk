import { UA, WebSocketInterface, debug } from 'jssip'
import {
  CallOptions,
  IncomingRTCSessionEvent,
  OutgoingRTCSessionEvent,
  UAConfiguration,
} from 'jssip/lib/UA';
import { DTFMOptions, EndEvent, IncomingEvent, IncomingInfoEvent, OutgoingEvent, OutgoingInfoEvent, RTCSession, RTCSessionEventMap } from 'jssip/lib/RTCSession';
import { InvalidAudioElementError, InvalidAuthTokenError, InvalidDomainError, InvalidStateError, InvalidUserError, ProxyUriSetError } from './Errors';
import { EventEmitter } from 'events';

export enum VoiceState {
  // User agent is inactive
  STOPPED = "STOPPED",
  // User agent is active and ready to make a call
  READY = "READY",
  // User agent is active and a call is currently connected
  CALL_IN_PROGRESS = "CALL_IN_PROGRESS",
};

export enum Digit {
  zero,
  one,
  two,
  three,
  four,
  five,
  six,
  seven,
  eight,
  nine,
}

export type VoiceConfig = {
  user?: string;
  authorizationJWT?: string;
  proxy?: string;
  domain?: string;
  port?: number;
  insecure?: boolean;
  debug?: boolean;
};

const CALL_FAILURE_EVENTS: (keyof RTCSessionEventMap)[] = [
  'peerconnection:setremotedescriptionfailed',
  'peerconnection:createofferfailed',
  'peerconnection:createanswerfailed',
  'peerconnection:setlocaldescriptionfailed',
  'getusermediafailed'
];

const SIP_DEBUG_FLAG = 'JsSIP:*';

// Voice Listeners
export type VoiceStateListener = (newState: VoiceState) => void;
export type AudioStreamListener = (stream: MediaStream) => void;
export type SendDTMFListener = (digit: Digit) => void;
export type SessionListener = (session: RTCSession) => void;
export type OutGoingCallListener = (event: OutgoingEvent) => void;
export type CallEventListener = (event: CallEvent) => void;
export type CallEndListener = (event: EndEvent) => void;
export type NewInfoListener = (event: IncomingInfoEvent) => void;
export type ErrorListener = (error: Error) => void;

type CallEvent = IncomingEvent | OutgoingEvent;
type NewInfoEvent = IncomingInfoEvent | OutgoingInfoEvent;

const isIncomingInfoEvent = (event: IncomingInfoEvent | OutgoingInfoEvent): event is IncomingInfoEvent => {
  return event.originator === 'remote';
}
const isOutgoingEvent = (event: CallEvent): event is OutgoingEvent => {
  return event.originator === 'remote';
}

type VoiceEventMap = {
  session: SessionListener;
  audioStream: AudioStreamListener;
  sendDtmf: SendDTMFListener;
  stateChange: VoiceStateListener;
  callRinging: OutGoingCallListener;
  callconnected: CallEventListener;
  hangup: CallEndListener;
  info: NewInfoListener;
  callFailed: CallEndListener;
  error: ErrorListener;
}

type VoiceEvent = keyof VoiceEventMap;


/**
 * Lumen CCS Voice Client
 * The Voice Client is a wrapper around the JsSIP library that provides a simple
 * interface for making and managing calls to Lumen CCS Webrtc API.
 */
export class Voice {
  private authorizationJWT?: string
  private proxy: string;
  private domain: string;
  private port: number;
  // Require SSL
  private insecure: boolean = false;
  // SIP user
  private user: string;

  private state: VoiceState = VoiceState.STOPPED;
  private userAgent: UA;
  private proxyUri: string;
  private currentSession: RTCSession | null = null;
  private emitter = new EventEmitter()

  constructor(config?: VoiceConfig) {
    this.setConfig(config);
  }

  private setConfig(config?: Partial<VoiceConfig>): void {
    if (config.user !== undefined) {
      this.user = config.user;
    }

    if (config.debug !== undefined && config.debug) {
      debug.enable(SIP_DEBUG_FLAG);
    }

    if (config.insecure !== undefined) {
      this.insecure = config.insecure;
    }

    if (config.port !== undefined) {
      this.port = config.port;
    }

    if (config.proxy !== undefined) {
      this.proxy = config.proxy;
    }

    if (config.domain !== undefined) {
      this.domain = config.domain;
    }

    if (config.authorizationJWT !== undefined) {
      this.authorizationJWT = this.createBearerToken(config.authorizationJWT)
    }

    this.setProxyURI();
  }

  private setProxyURI() {
    if(this.proxy === undefined || this.port === undefined) {
      throw new ProxyUriSetError();
    }
    this.proxyUri = `ws${this.insecure ? "" : "s"}://${this.proxy}:${this.port}`
  }

  /**
   * Add a listener for the given event
   */
  on<K extends VoiceEvent>(event: K, listener: VoiceEventMap[K]): this {
    this.emitter.on(event, listener);
    return this
  }

  /**
   * Remove a listener for the given event
   */
  removeListener<K extends VoiceEvent>(event:K, listener: VoiceEventMap[K]): this {
    this.emitter.removeListener(event, listener);
    return this
  }

  private emit<K extends VoiceEvent>(event: K, ...args: Parameters<VoiceEventMap[K]>): boolean {
    return this.emitter.emit(event, ...args);
  }

  /**
   * Set the Authorization JWT for the Voice Client.
   * @param authorizationJWT
   */
  setAuth(newAuthorizationJWT: string | undefined): void {
    this.authorizationJWT = this.createBearerToken(newAuthorizationJWT);
    if(this.userAgent) {
      this.userAgent.set('authorization_jwt', this.authorizationJWT)
    }
  }

  private createBearerToken(jwt: string): string{
    return `Bearer ${jwt}`
  }

  /**
   * Check if the Voice Client has an Authorization JWT
   * @returns boolean
   */
  hasAuth(): boolean {
    return this.authorizationJWT !== undefined;
  }

  /**
   * Setup an audio element to play the call audio stream when a call is active.
   * Audio will be played as soon as the call is connected.
   * @param audioElement
   */
  attachAudioElement(audioElement: HTMLAudioElement): void {
    if (!(audioElement instanceof HTMLAudioElement && audioElement instanceof HTMLMediaElement)) {
      throw new InvalidAudioElementError();
    }
    this.on('audioStream', (stream) => {
      audioElement.srcObject = stream;
      audioElement.play();
    })
  }

  /**
   * Start the Voice Client
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.userAgent = this.createUserAgent();

      this.userAgent.on('newRTCSession', (rtcEvent: IncomingRTCSessionEvent | OutgoingRTCSessionEvent) => {
        this.attachToSession(rtcEvent.session);
      })

      this.userAgent.start();

      this.userAgent.on('connected', () => {
        this.setState(VoiceState.READY);
        resolve();
      });
    });
  }

  /**
   * Stop the Voice Client
   */
  stop(): void {
    this.userAgent.stop();
    this.userAgent = null;
    this.setState(VoiceState.STOPPED);
  }

  /**
   * Starts a call to the given Lumen CCS phone number
   * Number should be in E.164 format
   * @param phoneNumber
   */
  call(phoneNumber: string): void {
    if(this.state !== VoiceState.READY) {
      throw new InvalidStateError("call", this.state)
    }

    if(this.domain === undefined) {
      throw new InvalidDomainError()
    }

    this.userAgent.call(`sip:${phoneNumber}@${this.domain}`, this.getCallOptions());
    this.setState(VoiceState.CALL_IN_PROGRESS);
  }

  private getCallOptions(): CallOptions {
    return {
      // Register Hanlders for Call Events
      eventHandlers: {
        progress: (e: CallEvent) => {
          if (isOutgoingEvent(e) && e.response.status_code === 180) {
            this.emit('callRinging', e);
          }
        },

        confirmed: (e: CallEvent) => {
          this.emit('callconnected', e);
        },

        ended: (e: EndEvent) => {
          this.emit('hangup', e);
        },

        newInfo: (e: NewInfoEvent) => {
          if (isIncomingInfoEvent(e)) {
            this.emit('info', e);
          }
        },

        failed: (e: EndEvent) => {
          this.emit('callFailed', e);
        }
      },
      mediaConstraints: { audio: true, video: false },
    }
  }

  /**
   * Sends a DTMF tone to the active call
   * if no call is active, this nothing will happen
   * @param digit
   * @param options
   */
  sendDTMF(digit: Digit, options: DTFMOptions = {}): void {
    if (!this.hasActiveCall()) { return; }
    try {
      this.currentSession.sendDTMF(digit, options);
    }
    catch (e) {
      this.emit('error', e);
    }
    this.emit('sendDtmf', digit);
  }

  /**
   * End the currently active call
   */
  hangup(): void {
    if (!this.hasActiveCall()) {
      return;
    }
    this.currentSession.terminate();
    this.setState(VoiceState.READY);
    return;
  }

  /**
   * Check if there is an active call
   * @returns boolean
   */
  hasActiveCall(): boolean {
    return this.state === VoiceState.CALL_IN_PROGRESS;
  }

  /**
   * Returns the current state of the Voice Client
   * @returns VoiceState
   */
  getCurrentState(): VoiceState {
    return this.state;
  }

  /**
   * Returns the configured user of the Voice Client
   * @returns VoiceState
   */
  getUser(): string {
    return this.user;
  }

  /**
   * Set the user
   */
  setUser(user: string): void {
    if(this.state === VoiceState.STOPPED) {
      this.user = user;
    } else {
      throw new InvalidStateError("setUser", this.state);
    }
  }

  /**
   * Toggle mute for the current session
   * @returns True if muted, False if not muted
   */
  toggleMute(): boolean {
    if(this.state !== VoiceState.CALL_IN_PROGRESS) {
      throw new InvalidStateError("toggleMute", this.state);
    }
    if(this.isMuted()) {
      this.currentSession.unmute();
      return false;
    }
    else {
      this.currentSession.mute();
      return true;
    }
  }

  /**
   * Returns true if the Voice Client is ready to make a call
   * @returns boolean
   */
  isReady(): boolean {
    return this.state !== VoiceState.STOPPED;
  }

  /**
   * Returns true if the Voice Client is stopped
   * @returns boolean
   */
  isStopped(): boolean {
    return this.state === VoiceState.STOPPED;
  }

  /**
   * Returns true if the Voice Client is muted
   * @returns boolean
   */
  isMuted(): boolean {
    if(this.state === VoiceState.CALL_IN_PROGRESS) {
      return this.currentSession.isMuted().audio;
    }
    return false;
  }

  private setState(newState: VoiceState) {
    this.state = newState;
    this.emit('stateChange', newState);
  }

  private createUserAgent(): UA {
    const socket = new WebSocketInterface(this.proxyUri);

    if (this.authorizationJWT === undefined) {
      throw new InvalidAuthTokenError();
    }

    if(this.user === undefined || this.user === "") {
      throw new InvalidUserError(this.user);
    }

    if(this.domain === undefined) {
      throw new InvalidDomainError()
    }

    const userAgentConfig: UAConfiguration = {
      sockets: [socket],
      uri: `sip:${this.user}@${this.domain}`,
      authorization_jwt: this.authorizationJWT,
      register: true,
    };

    return new UA(userAgentConfig);
  }

  private attachToSession(session: RTCSession) {
    // caputre the session
    this.currentSession = session;

    // call all the session handlers
    this.emit('session', session);

    // set up failure events
    CALL_FAILURE_EVENTS.forEach((event) => {
      session.on(event, (err: any) => {
        if (err instanceof Error) {
          this.emit('error', err);
        } else {
          this.emit('error', new Error(`An unknown error occurred during the call: ${err}`));
        }
        this.setState(VoiceState.READY);
      })
    });

    session.on('ended', () => {
      this.setState(VoiceState.READY)
      // reset the current session
      this.currentSession = null;
    })
    // Set up the audio stream listener
    this.attachAudioStreamListener()
  }

  private attachAudioStreamListener() {
    if (this.currentSession.connection) {
      this.currentSession.connection.addEventListener('track', (e: RTCTrackEvent) => {
        const audioStream = e.streams[0];
        // Call all the audio stream handlers
        this.emit('audioStream', audioStream);
      })
    }
  }
}
