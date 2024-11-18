"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Voice = exports.Digit = exports.VoiceState = void 0;
const jssip_1 = require("jssip");
const Errors_1 = require("./Errors");
const events_1 = require("events");
var VoiceState;
(function (VoiceState) {
    // User agent is inactive
    VoiceState["STOPPED"] = "STOPPED";
    // User agent is active and ready to make a call
    VoiceState["READY"] = "READY";
    // User agent is active and a call is currently connected
    VoiceState["CALL_IN_PROGRESS"] = "CALL_IN_PROGRESS";
})(VoiceState || (exports.VoiceState = VoiceState = {}));
;
var Digit;
(function (Digit) {
    Digit[Digit["zero"] = 0] = "zero";
    Digit[Digit["one"] = 1] = "one";
    Digit[Digit["two"] = 2] = "two";
    Digit[Digit["three"] = 3] = "three";
    Digit[Digit["four"] = 4] = "four";
    Digit[Digit["five"] = 5] = "five";
    Digit[Digit["six"] = 6] = "six";
    Digit[Digit["seven"] = 7] = "seven";
    Digit[Digit["eight"] = 8] = "eight";
    Digit[Digit["nine"] = 9] = "nine";
})(Digit || (exports.Digit = Digit = {}));
const CALL_FAILURE_EVENTS = [
    'peerconnection:setremotedescriptionfailed',
    'peerconnection:createofferfailed',
    'peerconnection:createanswerfailed',
    'peerconnection:setlocaldescriptionfailed',
    'getusermediafailed'
];
const SIP_DEBUG_FLAG = 'JsSIP:*';
const isIncomingInfoEvent = (event) => {
    return event.originator === 'remote';
};
const isOutgoingEvent = (event) => {
    return event.originator === 'remote';
};
/**
 * Lumen CCS Voice Client
 * The Voice Client is a wrapper around the JsSIP library that provides a simple
 * interface for making and managing calls to Lumen CCS Webrtc API.
 */
class Voice {
    constructor(config) {
        // Require SSL
        this.insecure = false;
        this.state = VoiceState.STOPPED;
        this.currentSession = null;
        this.emitter = new events_1.EventEmitter();
        this.setConfig(config);
    }
    setConfig(config) {
        if (config.user !== undefined) {
            this.user = config.user;
        }
        if (config.debug !== undefined && config.debug) {
            jssip_1.debug.enable(SIP_DEBUG_FLAG);
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
            this.authorizationJWT = this.createBearerToken(config.authorizationJWT);
        }
        this.setProxyURI();
    }
    setProxyURI() {
        if (this.proxy === undefined || this.port === undefined) {
            throw new Errors_1.ProxyUriSetError();
        }
        this.proxyUri = `ws${this.insecure ? "" : "s"}://${this.proxy}:${this.port}`;
    }
    /**
     * Add a listener for the given event
     */
    on(event, listener) {
        this.emitter.on(event, listener);
        return this;
    }
    /**
     * Remove a listener for the given event
     */
    removeListener(event, listener) {
        this.emitter.removeListener(event, listener);
        return this;
    }
    emit(event, ...args) {
        return this.emitter.emit(event, ...args);
    }
    /**
     * Set the Authorization JWT for the Voice Client.
     * @param authorizationJWT
     */
    setAuth(newAuthorizationJWT) {
        this.authorizationJWT = this.createBearerToken(newAuthorizationJWT);
        if (this.userAgent) {
            this.userAgent.set('authorization_jwt', this.authorizationJWT);
        }
    }
    createBearerToken(jwt) {
        return `Bearer ${jwt}`;
    }
    /**
     * Check if the Voice Client has an Authorization JWT
     * @returns boolean
     */
    hasAuth() {
        return this.authorizationJWT !== undefined;
    }
    /**
     * Setup an audio element to play the call audio stream when a call is active.
     * Audio will be played as soon as the call is connected.
     * @param audioElement
     */
    attachAudioElement(audioElement) {
        if (!(audioElement instanceof HTMLAudioElement && audioElement instanceof HTMLMediaElement)) {
            throw new Errors_1.InvalidAudioElementError();
        }
        this.on('audioStream', (stream) => {
            audioElement.srcObject = stream;
            audioElement.play();
        });
    }
    /**
     * Start the Voice Client
     */
    start() {
        return new Promise((resolve) => {
            this.userAgent = this.createUserAgent();
            this.userAgent.on('newRTCSession', (rtcEvent) => {
                this.attachToSession(rtcEvent.session);
            });
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
    stop() {
        this.userAgent.stop();
        this.userAgent = null;
        this.setState(VoiceState.STOPPED);
    }
    /**
     * Starts a call to the given Lumen CCS phone number
     * Number should be in E.164 format
     * @param phoneNumber
     */
    call(phoneNumber) {
        if (this.state !== VoiceState.READY) {
            throw new Errors_1.InvalidStateError("call", this.state);
        }
        if (this.domain === undefined) {
            throw new Errors_1.InvalidDomainError();
        }
        this.userAgent.call(`sip:${phoneNumber}@${this.domain}`, this.getCallOptions());
        this.setState(VoiceState.CALL_IN_PROGRESS);
    }
    getCallOptions() {
        return {
            // Register Hanlders for Call Events
            eventHandlers: {
                progress: (e) => {
                    if (isOutgoingEvent(e) && e.response.status_code === 180) {
                        this.emit('callRinging', e);
                    }
                },
                confirmed: (e) => {
                    this.emit('callconnected', e);
                },
                ended: (e) => {
                    this.emit('hangup', e);
                },
                newInfo: (e) => {
                    if (isIncomingInfoEvent(e)) {
                        this.emit('info', e);
                    }
                },
                failed: (e) => {
                    this.emit('callFailed', e);
                }
            },
            mediaConstraints: { audio: true, video: false },
        };
    }
    /**
     * Sends a DTMF tone to the active call
     * if no call is active, this nothing will happen
     * @param digit
     * @param options
     */
    sendDTMF(digit, options = {}) {
        if (!this.hasActiveCall()) {
            return;
        }
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
    hangup() {
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
    hasActiveCall() {
        return this.state === VoiceState.CALL_IN_PROGRESS;
    }
    /**
     * Returns the current state of the Voice Client
     * @returns VoiceState
     */
    getCurrentState() {
        return this.state;
    }
    /**
     * Returns the configured user of the Voice Client
     * @returns VoiceState
     */
    getUser() {
        return this.user;
    }
    /**
     * Set the user
     */
    setUser(user) {
        if (this.state === VoiceState.STOPPED) {
            this.user = user;
        }
        else {
            throw new Errors_1.InvalidStateError("setUser", this.state);
        }
    }
    /**
     * Toggle mute for the current session
     * @returns True if muted, False if not muted
     */
    toggleMute() {
        if (this.state !== VoiceState.CALL_IN_PROGRESS) {
            throw new Errors_1.InvalidStateError("toggleMute", this.state);
        }
        if (this.isMuted()) {
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
    isReady() {
        return this.state !== VoiceState.STOPPED;
    }
    /**
     * Returns true if the Voice Client is stopped
     * @returns boolean
     */
    isStopped() {
        return this.state === VoiceState.STOPPED;
    }
    /**
     * Returns true if the Voice Client is muted
     * @returns boolean
     */
    isMuted() {
        if (this.state === VoiceState.CALL_IN_PROGRESS) {
            return this.currentSession.isMuted().audio;
        }
        return false;
    }
    setState(newState) {
        this.state = newState;
        this.emit('stateChange', newState);
    }
    createUserAgent() {
        const socket = new jssip_1.WebSocketInterface(this.proxyUri);
        if (this.authorizationJWT === undefined) {
            throw new Errors_1.InvalidAuthTokenError();
        }
        if (this.user === undefined || this.user === "") {
            throw new Errors_1.InvalidUserError(this.user);
        }
        if (this.domain === undefined) {
            throw new Errors_1.InvalidDomainError();
        }
        const userAgentConfig = {
            sockets: [socket],
            uri: `sip:${this.user}@${this.domain}`,
            authorization_jwt: this.authorizationJWT,
            register: true,
        };
        return new jssip_1.UA(userAgentConfig);
    }
    attachToSession(session) {
        // caputre the session
        this.currentSession = session;
        // call all the session handlers
        this.emit('session', session);
        // set up failure events
        CALL_FAILURE_EVENTS.forEach((event) => {
            session.on(event, (err) => {
                if (err instanceof Error) {
                    this.emit('error', err);
                }
                else {
                    this.emit('error', new Error(`An unknown error occurred during the call: ${err}`));
                }
                this.setState(VoiceState.READY);
            });
        });
        session.on('ended', () => {
            this.setState(VoiceState.READY);
            // reset the current session
            this.currentSession = null;
        });
        // Set up the audio stream listener
        this.attachAudioStreamListener();
    }
    attachAudioStreamListener() {
        if (this.currentSession.connection) {
            this.currentSession.connection.addEventListener('track', (e) => {
                const audioStream = e.streams[0];
                // Call all the audio stream handlers
                this.emit('audioStream', audioStream);
            });
        }
    }
}
exports.Voice = Voice;
