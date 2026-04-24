"use client";

import { Messages } from "@/types";
import { Mic } from "lucide-react";
import { useEffect, useRef } from "react";

interface TranscriptProps {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
}

const Transcript = ({
  messages,
  currentMessage,
  currentUserMessage,
}: TranscriptProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentMessage, currentUserMessage]);

  const isEmpty =
    messages.length === 0 && !currentMessage && !currentUserMessage;

  return (
    <div className="transcript-container shadow-soft">
      {isEmpty ? (
        <div className="transcript-empty">
          <Mic className="size-12 text-gray-300 mb-4" />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      ) : (
        <div className="transcript-messages" ref={scrollRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`transcript-message ${
                message.role === "user"
                  ? "transcript-message-user"
                  : "transcript-message-assistant"
              }`}
            >
              <div
                className={`transcript-bubble ${
                  message.role === "user"
                    ? "transcript-bubble-user"
                    : "transcript-bubble-assistant"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {/* Streaming User Message */}
          {currentUserMessage && (
            <div className="transcript-message transcript-message-user">
              <div className="transcript-bubble transcript-bubble-user">
                {currentUserMessage}
                <span className="transcript-cursor" />
              </div>
            </div>
          )}

          {/* Streaming Assistant Message */}
          {currentMessage && (
            <div className="transcript-message transcript-message-assistant">
              <div className="transcript-bubble transcript-bubble-assistant">
                {currentMessage}
                <span className="transcript-cursor" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Transcript;
