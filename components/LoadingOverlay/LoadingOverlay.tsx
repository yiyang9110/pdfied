import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  title?: string;
  steps?: string[];
}

const LoadingOverlay = ({
  title = "Synthesizing your book",
  steps = [
    "Parsing PDF",
    "Generating cover",
    "Preparing your assistant",
  ],
}: LoadingOverlayProps) => {
  return (
    <div className="loading-wrapper">
      <div className="loading-shadow-wrapper bg-white">
        <div className="loading-shadow">
          <Loader2 className="loading-animation size-12 text-[var(--color-brand)]" />
          <h2 className="loading-title">{title}</h2>
          <ul className="loading-progress">
            {steps.map((step) => (
              <li key={step} className="loading-progress-item">
                <span className="loading-progress-status" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
