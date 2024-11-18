import { VoiceState } from "./Voice";
export declare class InvalidAudioElementError extends Error {
    constructor();
}
export declare class InvalidAuthTokenError extends Error {
    constructor();
}
export declare class InvalidStateError extends Error {
    constructor(method: string, state: VoiceState);
}
export declare class InvalidUserError extends Error {
    constructor(user: string | undefined);
}
export declare class ProxyUriSetError extends Error {
    constructor();
}
export declare class InvalidDomainError extends Error {
    constructor();
}
