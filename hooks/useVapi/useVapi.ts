import { startVoiceSession } from "@/lib/actions/session.actions";
import { ASSISTANT_ID, DEFAULT_VOICE, VAPI_API_KEY, VOICE_SETTINGS } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import Vapi from '@vapi-ai/web';
import { getVoice } from "@/lib/utils";

export type CallStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'speaking' | 'thinking';


const useLatestRef = <T>(value: T) => {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value])
    return ref;
}

let vapi: InstanceType<typeof Vapi> | null = null;

const getVapi = () => {
    if (!vapi) {
        if (!VAPI_API_KEY) {
            throw new Error('VAPI key not found')
        }

        vapi = new Vapi(VAPI_API_KEY);
    }

    return vapi;
}


const useVapi = (book: IBook) => {
    const { userId } = useAuth();

    const [status, setStatus] = useState<CallStatus>('idle');
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [limitError, setLimitError] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<NodeJS.Timeout | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const isStoppingRef = useRef<boolean>(false);


    const bookRef = useLatestRef(book);
    const durationRef = useLatestRef(duration);
    const voice = book.persona || DEFAULT_VOICE;

    const isActive = status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'starting';

    const messagesRef = useLatestRef(messages);

    // ── VAPI event listeners ──────────────────────────────────────────
    useEffect(() => {
        const vapiInstance = getVapi();

        const onCallStart = () => {
            setStatus('speaking');
        };

        const onCallEnd = () => {
            setStatus('idle');
            setMessages([]);
            setCurrentMessage('');
            setCurrentUserMessage('');
            isStoppingRef.current = false;
        };

        const onSpeechStart = () => {
            setStatus('speaking');
        };

        const onSpeechEnd = () => {
            setStatus('listening');
        };

        const onMessage = (msg: any) => {
            if (msg.type !== 'transcript') return;

            const { role, transcriptType, transcript } = msg as {
                role: 'user' | 'assistant';
                transcriptType: 'partial' | 'final';
                transcript: string;
            };

            if (role === 'user') {
                if (transcriptType === 'partial') {
                    setCurrentUserMessage(transcript);
                } else if (transcriptType === 'final') {
                    setCurrentUserMessage('');
                    setStatus('thinking');

                    setMessages((prev) => {
                        const isDuplicate = prev.length > 0
                            && prev[prev.length - 1].role === 'user'
                            && prev[prev.length - 1].content === transcript;
                        if (isDuplicate) return prev;
                        return [...prev, { role: 'user', content: transcript }];
                    });
                }
            } else if (role === 'assistant') {
                if (transcriptType === 'partial') {
                    setCurrentMessage(transcript);
                } else if (transcriptType === 'final') {
                    setCurrentMessage('');
                    setStatus('listening');

                    setMessages((prev) => {
                        const isDuplicate = prev.length > 0
                            && prev[prev.length - 1].role === 'assistant'
                            && prev[prev.length - 1].content === transcript;
                        if (isDuplicate) return prev;
                        return [...prev, { role: 'assistant', content: transcript }];
                    });
                }
            }
        };

        vapiInstance.on('call-start', onCallStart);
        vapiInstance.on('call-end', onCallEnd);
        vapiInstance.on('speech-start', onSpeechStart);
        vapiInstance.on('speech-end', onSpeechEnd);
        vapiInstance.on('message', onMessage);

        return () => {
            vapiInstance.removeListener('call-start', onCallStart);
            vapiInstance.removeListener('call-end', onCallEnd);
            vapiInstance.removeListener('speech-start', onSpeechStart);
            vapiInstance.removeListener('speech-end', onSpeechEnd);
            vapiInstance.removeListener('message', onMessage);
        };
    }, []);


    const start = async () => {
        if (!userId) {
            return setLimitError("You must be logged in to start the book");
        }

        setLimitError(null);
        setStatus('connecting');

        try {
            const result = await startVoiceSession(book._id);
            if (!result.success) {
                setLimitError(result.error || 'Failed to start session');
                setStatus('idle');
                return;
            }

            sessionIdRef.current = result.sessionId || null;

            const firstMessage = `Hey, good to meet you. I'm going to read ${book.title} by ${book.author}. Ready?`;

            await getVapi().start(ASSISTANT_ID, {
                firstMessage,
                variableValues: {
                    title: book.title,
                    author: book.author,
                    bookId: book._id,
                }
            });

            setStatus('speaking');

        } catch (error) {
            console.error("Error starting call", error);
            setStatus('idle');
            setLimitError("Failed to start call. Please try again.");
        }
    }

    const stop = async () => {
        isStoppingRef.current = true;
        await getVapi().stop();
    }

    const clearErrors = async () => { }


    return {
        status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        limitError,
        start,
        stop,
        clearErrors,
    };
};

export default useVapi;