export function Flower({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100">
      <g fill="currentColor">
        <ellipse cx="50" cy="23" rx="17" ry="24" />
        <g transform="rotate(60 50 50)">
          <ellipse cx="50" cy="23" rx="17" ry="24" />
        </g>
        <g transform="rotate(120 50 50)">
          <ellipse cx="50" cy="23" rx="17" ry="24" />
        </g>
        <g transform="rotate(180 50 50)">
          <ellipse cx="50" cy="23" rx="17" ry="24" />
        </g>
        <g transform="rotate(240 50 50)">
          <ellipse cx="50" cy="23" rx="17" ry="24" />
        </g>
        <g transform="rotate(300 50 50)">
          <ellipse cx="50" cy="23" rx="17" ry="24" />
        </g>
      </g>
      <circle cx="50" cy="50" r="16" fill="rgba(42,28,16,.08)" />
    </svg>
  );
}
