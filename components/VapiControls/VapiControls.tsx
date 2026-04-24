"use client";

import useVapi from "@/hooks/useVapi";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import { getVoice } from "@/lib/utils";
import Image from "next/image";
import Transcript from "../Transcript";

const VapiControls = ({ book }: { book: IBook }) => {
    const {
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
    } = useVapi(book);

    const showPulse = isActive && (status === 'speaking' || status === 'thinking');

    return (
        <div className="vapi-main-container space-y-6">
            {/* Header Card */}
            <div className="vapi-header-card w-full">
                <div className="vapi-cover-wrapper">
                    <Image
                        src={book.coverURL}
                        alt={book.title}
                        width={162}
                        height={240}
                        className="vapi-cover-image"
                    />
                    <div className="vapi-mic-wrapper">
                        {showPulse && <span className="vapi-pulse-ring" />}
                        <button onClick={() => { isActive ? stop() : start() }} disabled={status === 'connecting'} className={`vapi-mic-btn shadow-soft-md ${isActive ? 'vapi-mic-btn-active' : 'vapi-mic-btn-inactive'}`}>
                            {isActive ? (
                                <Mic className="size-7 text-[var(--color-brand)]" />
                            ) : (
                                <MicOff className="size-7 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] font-serif">
                            {book.title}
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] font-medium">
                            by {book.author}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="vapi-status-indicator shadow-soft-sm">
                            <span className="vapi-status-dot vapi-status-dot-ready" />
                            <span className="vapi-status-text">Ready</span>
                        </div>

                        <div className="vapi-status-indicator shadow-soft-sm">
                            <span className="vapi-status-text">
                                Voice: {getVoice(book.persona).name}
                            </span>
                        </div>

                        <div className="vapi-status-indicator shadow-soft-sm">
                            <span className="vapi-status-text">0:00/15:00</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transcript Area */}
            <div className="vapi-transcript-wrapper">
                <Transcript
                    messages={messages}
                    currentMessage={currentMessage}
                    currentUserMessage={currentUserMessage}
                />
            </div>
        </div>
    );
};

export default VapiControls;