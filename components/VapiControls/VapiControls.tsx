"use client";

import useVapi from "@/hooks/useVapi";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import { getVoice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Transcript from "../Transcript";

const renderLimitError = (message: string) => {
    const upgradeIndex = message.indexOf("Upgrade");

    if (upgradeIndex === -1) {
        return <p>{message}</p>;
    }

    const beforeUpgrade = message.slice(0, upgradeIndex);
    const afterUpgrade = message.slice(upgradeIndex + "Upgrade".length);

    return (
        <p>
            {beforeUpgrade}
            <Link
                href="/pricing"
                className="font-semibold underline underline-offset-4 transition hover:text-red-900"
            >
                Upgrade
            </Link>
            {afterUpgrade}
        </p>
    );
};

const VapiControls = ({ book }: { book: IBook }) => {
    const {
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
    } = useVapi(book);

    const showPulse = isActive && (status === 'speaking' || status === 'thinking');
    const statusLabel = {
        idle: "Ready",
        connecting: "Connecting",
        starting: "Starting",
        listening: "Listening",
        speaking: "Speaking",
        thinking: "Thinking",
    }[status];
    const statusDotClass = {
        idle: "vapi-status-dot-ready",
        connecting: "vapi-status-dot-connecting",
        starting: "vapi-status-dot-connecting",
        listening: "vapi-status-dot-listening",
        speaking: "vapi-status-dot-speaking",
        thinking: "vapi-status-dot-thinking",
    }[status];

    const formatDuration = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

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
                        <button
                            onClick={() => void (isActive ? stop() : start())}
                            disabled={status === 'connecting'}
                            className={`vapi-mic-btn shadow-soft-md ${isActive ? 'vapi-mic-btn-active' : 'vapi-mic-btn-inactive'}`}
                        >
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
                            <span className={`vapi-status-dot ${statusDotClass}`} />
                            <span className="vapi-status-text">{statusLabel}</span>
                        </div>

                        <div className="vapi-status-indicator shadow-soft-sm">
                            <span className="vapi-status-text">
                                Voice: {getVoice(book.persona).name}
                            </span>
                        </div>

                        <div className="vapi-status-indicator shadow-soft-sm">
                            <span className="vapi-status-text">
                                {formatDuration(duration)}/{formatDuration(maxDurationSeconds)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {limitError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            {renderLimitError(limitError)}
                        </div>
                        <button
                            type="button"
                            onClick={clearErrors}
                            className="shrink-0 text-red-500 transition hover:text-red-700"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

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
