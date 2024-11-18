import {
    useCallback,
    useEffect,
    createContext,
    useContext,
    useRef,
    useState,
    ReactNode,
    FC
} from 'react';
import { CallEndListener, Digit, Voice } from "@lumenccs/webrtc-sdk"

export const VoiceContext = createContext<Voice | null>(null);

export type VoiceProviderProps = {
    value: Voice;
    children: ReactNode;
}

export const VoiceProvider: FC<VoiceProviderProps> = ({ value, children }) => {
    useEffect(() => {
        return () => {
            if(!value.isStopped()){
                value.stop();
            }
        };
    }, [value]);

   return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export const useVoiceClient = () => {
    const context = useContext(VoiceContext);
    if (context === null) {
        throw new Error("useVoiceClient must be used within a VoiceProvider");
    }
    return context;
}

export type CallState  =
    |'PENDING'
    |'RINGING'
    |'IN_PROGRESS'
    |'ENDED'

export type UseVoiceState = {
    callState: CallState;
    error?: CallFailedError;
}

export const useCallAudioRef = () => {
    const ref = useRef<HTMLAudioElement>(null);
    const voiceClient = useVoiceClient();
    useEffect(() => {
        if(ref.current !== null) {
            voiceClient.attachAudioElement(ref.current);
        } else {
            throw new AudioElementNotProvidedError()
        }
    }, []);

    return ref;
}

export class AudioElementNotProvidedError extends Error {
    constructor() {
        super("Audio Element not found")
    }
}

export class CallFailedError extends Error {
    constructor(message: string, public details: string) {
        super(`Call Failed: ${message}`)
    }
}

export const useCall = () => {
    const voiceClient = useVoiceClient()
    const [state, setState] = useState<UseVoiceState>({
        callState: "PENDING",
    })

    useEffect(() => {
        const handleCallRinging = () =>
            setState({callState: "RINGING"})
        const handleCallConnected = () =>
            setState({callState: "IN_PROGRESS"})
        const handleCallEnded = () =>
            setState({ callState: "ENDED"})
        const handleVoiceError: CallEndListener = (event) =>{
            const errorMessage = event.cause
            const details = (event.message as any)?.data
            const error = new CallFailedError(errorMessage, details)
            setState({ error, callState: "ENDED"})
        }

        voiceClient.on('callRinging', handleCallRinging)
        voiceClient.on('callconnected', handleCallConnected)
        voiceClient.on('hangup', handleCallEnded)
        voiceClient.on('callFailed', handleVoiceError)

       return () => {
            voiceClient.removeListener('callRinging', handleCallRinging)
            voiceClient.removeListener('callconnected', handleCallConnected)
            voiceClient.removeListener('hangup', handleCallEnded)
            voiceClient.removeListener('callFailed', handleVoiceError)
         }
    }, [voiceClient, setState])

    const call = useCallback(async (to: string, jwt: string) => {
        voiceClient.setAuth(jwt)
        if(voiceClient.isStopped()) {
            await voiceClient.start()
        }
        voiceClient.call(to)
    }, [voiceClient])

    const hangup = useCallback(() => {
        voiceClient.hangup()
    }, [voiceClient])

    const sendDTMF = useCallback((digit: Digit) => {
        voiceClient.sendDTMF(digit)
    }, [voiceClient])

    return {
        voiceClient,
        call,
        hangup,
        sendDTMF,
        callState: state.callState,
        error: state.error
    }
}
