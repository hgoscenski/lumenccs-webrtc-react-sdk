import { DTFMOptions, EndEvent, IncomingEvent, IncomingInfoEvent, OutgoingEvent, RTCSession } from 'jssip/lib/RTCSession';
export declare enum VoiceState {
    STOPPED = "STOPPED",
    READY = "READY",
    CALL_IN_PROGRESS = "CALL_IN_PROGRESS"
}
export declare enum Digit {
    zero = 0,
    one = 1,
    two = 2,
    three = 3,
    four = 4,
    five = 5,
    six = 6,
    seven = 7,
    eight = 8,
    nine = 9
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
};
type VoiceEvent = keyof VoiceEventMap;
/**
 * Lumen CCS Voice Client
 * The Voice Client is a wrapper around the JsSIP library that provides a simple
 * interface for making and managing calls to Lumen CCS Webrtc API.
 */
export declare class Voice {
    private authorizationJWT?;
    private proxy;
    private domain;
    private port;
    private insecure;
    private user;
    private state;
    private userAgent;
    private proxyUri;
    private currentSession;
    private emitter;
    constructor(config?: VoiceConfig);
    private setConfig;
    private setProxyURI;
    /**
     * Add a listener for the given event
     */
    on<K extends VoiceEvent>(event: K, listener: VoiceEventMap[K]): this;
    /**
     * Remove a listener for the given event
     */
    removeListener<K extends VoiceEvent>(event: K, listener: VoiceEventMap[K]): this;
    private emit;
    /**
     * Set the Authorization JWT for the Voice Client.
     * @param authorizationJWT
     */
    setAuth(newAuthorizationJWT: string | undefined): void;
    private createBearerToken;
    /**
     * Check if the Voice Client has an Authorization JWT
     * @returns boolean
     */
    hasAuth(): boolean;
    /**
     * Setup an audio element to play the call audio stream when a call is active.
     * Audio will be played as soon as the call is connected.
     * @param audioElement
     */
    attachAudioElement(audioElement: HTMLAudioElement): void;
    /**
     * Start the Voice Client
     */
    start(): Promise<void>;
    /**
     * Stop the Voice Client
     */
    stop(): void;
    /**
     * Starts a call to the given Lumen CCS phone number
     * Number should be in E.164 format
     * @param phoneNumber
     */
    call(phoneNumber: string): void;
    private getCallOptions;
    /**
     * Sends a DTMF tone to the active call
     * if no call is active, this nothing will happen
     * @param digit
     * @param options
     */
    sendDTMF(digit: Digit, options?: DTFMOptions): void;
    /**
     * End the currently active call
     */
    hangup(): void;
    /**
     * Check if there is an active call
     * @returns boolean
     */
    hasActiveCall(): boolean;
    /**
     * Returns the current state of the Voice Client
     * @returns VoiceState
     */
    getCurrentState(): VoiceState;
    /**
     * Returns the configured user of the Voice Client
     * @returns VoiceState
     */
    getUser(): string;
    /**
     * Set the user
     */
    setUser(user: string): void;
    /**
     * Toggle mute for the current session
     * @returns True if muted, False if not muted
     */
    toggleMute(): boolean;
    /**
     * Returns true if the Voice Client is ready to make a call
     * @returns boolean
     */
    isReady(): boolean;
    /**
     * Returns true if the Voice Client is stopped
     * @returns boolean
     */
    isStopped(): boolean;
    /**
     * Returns true if the Voice Client is muted
     * @returns boolean
     */
    isMuted(): boolean;
    private setState;
    private createUserAgent;
    private attachToSession;
    private attachAudioStreamListener;
}
export {};
