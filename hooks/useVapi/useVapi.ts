import { endVoiceSession, startVoiceSession } from "@/lib/actions/session.actions";
import { ASSISTANT_ID, VAPI_API_KEY } from "@/lib/constants";
import { useUserPlan } from "@/lib/plan.client";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

export type CallStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'speaking' | 'thinking';

type TranscriptMessage = {
    type: 'transcript';
    role: 'user' | 'assistant';
    transcriptType: 'partial' | 'final';
    transcript: string;
};

const getVapiErrorMessage = (error: unknown): string => {
    if (typeof error === "string") {
        return error;
    }

    if (typeof error !== "object" || error === null) {
        return "";
    }

    if ("error" in error && typeof error.error === "object" && error.error !== null) {
        const nestedError = error.error as Record<string, unknown>;

        if (typeof nestedError.message === "string") {
            return nestedError.message;
        }

        if (typeof nestedError.errorMsg === "string") {
            return nestedError.errorMsg;
        }
    }

    if ("message" in error && typeof error.message === "string") {
        return error.message;
    }

    return "";
};

const isExpectedTransportFailure = (error: unknown): boolean => {
    const message = getVapiErrorMessage(error).toLowerCase();
    return message.includes("send transport changed to failed");
};

const isTranscriptMessage = (message: unknown): message is TranscriptMessage => {
    if (typeof message !== "object" || message === null) {
        return false;
    }

    return (
        "type" in message
        && "role" in message
        && "transcriptType" in message
        && "transcript" in message
        && message.type === "transcript"
    );
};

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
    const router = useRouter();
    const { limits } = useUserPlan();

    const [status, setStatus] = useState<CallStatus>('idle');
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [sessionMaxDurationSeconds, setSessionMaxDurationSeconds] = useState<number | null>(null);
    const [limitError, setLimitError] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const isStoppingRef = useRef<boolean>(false);
    const timeoutTriggeredRef = useRef(false);

    const isActive = status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'starting';
    const maxDurationSeconds = sessionMaxDurationSeconds ?? limits.maxSessionMinutes * 60;

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback((startTime: number) => {
        clearTimer();
        setDuration(0);

        timerRef.current = setInterval(() => {
            setDuration(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
        }, 1000);
    }, [clearTimer]);

    const finalizeVoiceSession = useCallback(async () => {
        const sessionId = sessionIdRef.current;
        const startTime = startTimeRef.current;

        clearTimer();
        sessionIdRef.current = null;
        startTimeRef.current = null;
        setSessionMaxDurationSeconds(null);

        if (!sessionId) {
            return;
        }

        const endTime = Date.now();
        const durationSeconds = startTime
            ? Math.max(0, Math.round((endTime - startTime) / 1000))
            : 0;

        setDuration(durationSeconds);
        await endVoiceSession(sessionId, durationSeconds);
    }, [clearTimer]);

    const stop = useCallback(async () => {
        clearTimer();
        isStoppingRef.current = true;

        try {
            await getVapi().stop();
        } finally {
            await finalizeVoiceSession();
        }
    }, [clearTimer, finalizeVoiceSession]);

    const recoverFromCallError = useCallback(async (error: unknown) => {
        if (!isExpectedTransportFailure(error)) {
            console.error("Vapi error", error);
        }

        clearTimer();
        setStatus('idle');
        setCurrentMessage('');
        setCurrentUserMessage('');
        isStoppingRef.current = false;

        try {
            await getVapi().stop();
        } catch (stopError) {
            if (!isExpectedTransportFailure(stopError)) {
                console.error("Error stopping Vapi after failure", stopError);
            }
        }

        if (sessionIdRef.current) {
            await finalizeVoiceSession();
        }

        if (isExpectedTransportFailure(error)) {
            setLimitError("The call connection dropped. Please try again.");
        }
    }, [clearTimer, finalizeVoiceSession]);

    // ── VAPI event listeners ──────────────────────────────────────────
    useEffect(() => {
        const vapiInstance = getVapi();

        const onCallStart = () => {
            setStatus('listening');
        };

        const onCallEnd = () => {
            clearTimer();
            setStatus('idle');
            setMessages([]);
            setCurrentMessage('');
            setCurrentUserMessage('');
            setSessionMaxDurationSeconds(null);
            isStoppingRef.current = false;
        };

        const onSpeechStart = () => {
            setStatus('speaking');
        };

        const onSpeechEnd = () => {
            setStatus('listening');
        };

        const onMessage = (message: unknown) => {
            if (!isTranscriptMessage(message)) return;

            const { role, transcriptType, transcript } = message;

            if (role === 'user') {
                if (transcriptType === 'partial') {
                    setStatus('listening');
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
                    setStatus('speaking');
                    setCurrentMessage(transcript);
                } else if (transcriptType === 'final') {
                    setCurrentMessage('');

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

        const onError = (error: unknown) => {
            void recoverFromCallError(error);
        };

        vapiInstance.on('call-start', onCallStart);
        vapiInstance.on('call-end', onCallEnd);
        vapiInstance.on('speech-start', onSpeechStart);
        vapiInstance.on('speech-end', onSpeechEnd);
        vapiInstance.on('message', onMessage);
        vapiInstance.on('error', onError);

        return () => {
            vapiInstance.removeListener('call-start', onCallStart);
            vapiInstance.removeListener('call-end', onCallEnd);
            vapiInstance.removeListener('speech-start', onSpeechStart);
            vapiInstance.removeListener('speech-end', onSpeechEnd);
            vapiInstance.removeListener('message', onMessage);
            vapiInstance.removeListener('error', onError);
        };
    }, [clearTimer, recoverFromCallError]);

    useEffect(() => {
        if (!isActive || maxDurationSeconds <= 0 || duration < maxDurationSeconds || timeoutTriggeredRef.current) {
            return;
        }

        timeoutTriggeredRef.current = true;
        setLimitError(`Your ${limits.name} plan allows up to ${limits.maxSessionMinutes} minutes per voice session.`);

        void (async () => {
            try {
                await stop();
            } finally {
                router.replace("/");
            }
        })();
    }, [duration, isActive, limits.maxSessionMinutes, limits.name, maxDurationSeconds, router, stop]);

    useEffect(() => {
        return () => {
            clearTimer();
        };
    }, [clearTimer]);


    const start = async () => {
        if (!userId) {
            return setLimitError("You must be logged in to start the book");
        }

        timeoutTriggeredRef.current = false;
        setLimitError(null);
        setStatus('connecting');
        setDuration(0);

        try {
            const result = await startVoiceSession(book._id);
            if (!result.success) {
                setLimitError(result.error || 'Failed to start session');
                setStatus('idle');
                return;
            }

            sessionIdRef.current = result.sessionId || null;
            const startTime = Date.now();
            startTimeRef.current = startTime;
            setSessionMaxDurationSeconds((result.maxDurationMinutes ?? limits.maxSessionMinutes) * 60);
            setStatus('starting');
            startTimer(startTime);

            const firstMessage = `Hey, good to meet you. I'm going to read ${book.title} by ${book.author}. Ready?`;

            await getVapi().start(ASSISTANT_ID, {
                firstMessage,
                variableValues: {
                    title: book.title,
                    author: book.author,
                    bookId: book._id,
                }
            });

        } catch (error) {
            console.error("Error starting call", error);
            await finalizeVoiceSession();
            setStatus('idle');
            setLimitError("Failed to start call. Please try again.");
        }
    }

    const clearErrors = () => {
        setLimitError(null);
    }


    return {
        status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        maxDurationSeconds,
        limitError,
        start,
        stop,
        clearErrors,
    };
};

export default useVapi;
