import { ReactNode, FC } from 'react';
import { Digit, Voice } from "@lumenccs/webrtc-sdk";
export declare const VoiceContext: import("react").Context<Voice | null>;
export type VoiceProviderProps = {
    value: Voice;
    children: ReactNode;
};
export declare const VoiceProvider: FC<VoiceProviderProps>;
export declare const useVoiceClient: () => Voice;
export type CallState = 'PENDING' | 'RINGING' | 'IN_PROGRESS' | 'ENDED';
export type UseVoiceState = {
    callState: CallState;
    error?: CallFailedError;
};
export declare const useCallAudioRef: () => import("react").RefObject<HTMLAudioElement>;
export declare class AudioElementNotProvidedError extends Error {
    constructor();
}
export declare class CallFailedError extends Error {
    details: string;
    constructor(message: string, details: string);
}
export declare const useCall: () => {
    voiceClient: Voice;
    call: (to: string, jwt: string) => Promise<void>;
    hangup: () => void;
    sendDTMF: (digit: Digit) => void;
    callState: CallState;
    error: CallFailedError | undefined;
};
