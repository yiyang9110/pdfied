import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

const STEPS = [
  { title: "Upload PDF", description: "Add your book file" },
  { title: "AI Processing", description: "We analyze the content" },
  { title: "Voice Chat", description: "Discuss with AI" },
] as const;

function BooksIllustration() {
  return (
    <svg
      width="380"
      height="270"
      viewBox="0 0 380 270"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="globe-clip">
          <circle cx="228" cy="150" r="42" />
        </clipPath>
      </defs>

      {/* Open book — foreground center */}
      <path
        d="M 178 254 Q 132 242 82 250 L 82 178 Q 130 166 178 180 Z"
        fill="#f5f0de"
        stroke="#c4a882"
        strokeWidth="1"
      />
      <path
        d="M 178 254 Q 222 242 278 250 L 278 178 Q 226 166 178 180 Z"
        fill="#f5f0de"
        stroke="#c4a882"
        strokeWidth="1"
      />
      <line
        x1="178"
        y1="180"
        x2="178"
        y2="254"
        stroke="#8B7355"
        strokeWidth="2"
      />
      {/* Lines — left page */}
      <line
        x1="94"
        y1="196"
        x2="168"
        y2="193"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      <line
        x1="94"
        y1="206"
        x2="168"
        y2="203"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      <line
        x1="94"
        y1="216"
        x2="168"
        y2="213"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      <line
        x1="94"
        y1="226"
        x2="168"
        y2="223"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      <line
        x1="94"
        y1="236"
        x2="168"
        y2="233"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      {/* Lines — right page */}
      <line
        x1="188"
        y1="193"
        x2="266"
        y2="196"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      <line
        x1="188"
        y1="203"
        x2="266"
        y2="206"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      <line
        x1="188"
        y1="213"
        x2="266"
        y2="216"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      <line
        x1="188"
        y1="223"
        x2="266"
        y2="226"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      <line
        x1="188"
        y1="233"
        x2="266"
        y2="236"
        stroke="#c4a882"
        strokeWidth="0.7"
      />
      {/* Cover strip */}
      <path
        d="M 80 252 Q 130 242 178 246 Q 224 242 280 252 L 280 258 Q 224 248 178 252 Q 130 248 80 258 Z"
        fill="#7B6245"
      />

      {/* Stacked books — left */}
      <rect x="20" y="200" width="102" height="19" rx="2" fill="#5C4033" />
      <rect x="20" y="196" width="102" height="6" rx="1" fill="#6d4c41" />
      <rect x="20" y="196" width="5" height="23" rx="1" fill="#4a3328" />

      <rect x="24" y="183" width="98" height="17" rx="2" fill="#6b7c4a" />
      <rect x="24" y="179" width="98" height="6" rx="1" fill="#7c8e5a" />
      <rect x="24" y="179" width="5" height="21" rx="1" fill="#576340" />

      <rect x="28" y="167" width="92" height="16" rx="2" fill="#8B4513" />
      <rect x="28" y="163" width="92" height="6" rx="1" fill="#a0522d" />
      <rect x="28" y="163" width="5" height="20" rx="1" fill="#6b3410" />

      {/* Globe stand */}
      <ellipse cx="228" cy="228" rx="20" ry="6" fill="#8B7355" />
      <rect x="225" y="190" width="6" height="39" rx="2" fill="#8B7355" />

      {/* Globe sphere */}
      <circle
        cx="228"
        cy="150"
        r="42"
        fill="#c5d5c5"
        stroke="#8B7355"
        strokeWidth="1.5"
      />
      <g clipPath="url(#globe-clip)">
        {/* Continents */}
        <path
          d="M 208 136 Q 216 126 227 129 Q 237 124 243 134 Q 241 145 227 141 Q 214 145 208 136 Z"
          fill="#7a9e6e"
          opacity="0.8"
        />
        <path
          d="M 218 160 Q 225 152 234 156 Q 238 164 233 170 Q 225 172 218 167 Z"
          fill="#7a9e6e"
          opacity="0.8"
        />
        {/* Latitude ellipses */}
        <ellipse
          cx="228"
          cy="150"
          rx="42"
          ry="14"
          fill="none"
          stroke="#8B7355"
          strokeWidth="0.9"
          opacity="0.6"
        />
        <ellipse
          cx="228"
          cy="135"
          rx="35"
          ry="11"
          fill="none"
          stroke="#8B7355"
          strokeWidth="0.8"
          opacity="0.5"
        />
        <ellipse
          cx="228"
          cy="165"
          rx="35"
          ry="11"
          fill="none"
          stroke="#8B7355"
          strokeWidth="0.8"
          opacity="0.5"
        />
        {/* Longitude ellipses */}
        <ellipse
          cx="228"
          cy="150"
          rx="18"
          ry="42"
          fill="none"
          stroke="#8B7355"
          strokeWidth="0.8"
          opacity="0.5"
        />
        <ellipse
          cx="228"
          cy="150"
          rx="32"
          ry="42"
          fill="none"
          stroke="#8B7355"
          strokeWidth="0.8"
          opacity="0.45"
          transform="rotate(50 228 150)"
        />
      </g>
      {/* Globe outer ring */}
      <circle
        cx="228"
        cy="150"
        r="42"
        fill="none"
        stroke="#8B7355"
        strokeWidth="1.5"
      />

      {/* Desk lamp */}
      <ellipse cx="325" cy="224" rx="17" ry="5" fill="#8B7355" />
      <line
        x1="325"
        y1="219"
        x2="325"
        y2="115"
        stroke="#8B7355"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 325 115 Q 332 100 347 88"
        stroke="#8B7355"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 334 86 Q 347 76 362 80 L 357 108 Q 345 115 333 109 Z"
        fill="#c9a227"
        stroke="#8B7355"
        strokeWidth="1.5"
      />
      <ellipse cx="345" cy="109" rx="12" ry="4" fill="#f5e060" opacity="0.35" />
    </svg>
  );
}

export async function LibraryHero() {
  const { userId } = await auth();

  return (
    <section className="library-hero-card mb-18">
      <div className="library-hero-content">
        {/* Left: text + CTA */}
        <div className="library-hero-text">
          <h1 className="library-hero-title">Your Library</h1>
          <p className="library-hero-description">
            Convert your books into interactive AI conversations.
            <br />
            Listen, learn, and discuss your favorite reads.
          </p>
          <div className="library-hero-illustration">
            <BooksIllustration />
          </div>
          {userId ? (
            <Link href="/books/new" className="library-cta-primary">
              <span>+</span>
              Add new book
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button type="button" className="library-cta-primary">
                <span>+</span>
                Add new book
              </button>
            </SignInButton>
          )}
        </div>

        {/* Center: illustration (desktop only) */}
        <div className="library-hero-illustration-desktop">
          <BooksIllustration />
        </div>

        {/* Right: steps card */}
        <div className="library-steps-card flex flex-col gap-4 shrink-0">
          {STEPS.map((step, i) => (
            <div key={step.title} className="library-step-item">
              <div className="library-step-number">{i + 1}</div>
              <div>
                <p className="library-step-title">{step.title}</p>
                <p className="library-step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
