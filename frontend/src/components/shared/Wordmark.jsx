/**
 * The mark: an open ring with a bindu at its centre.
 *
 * The ring is left open because the thing this product models is a chain of
 * hand-offs — ASHA to doctor to mother — not a closed loop that runs itself.
 * The mark is monochrome on purpose. Warm chroma in this product means a
 * patient's state, so the identity is carried by the form, not by a colour.
 */
export function Mark({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M16 4.2a11.8 11.8 0 1 1-8.34 3.46"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="4" fill="currentColor" />
    </svg>
  );
}

export default function Wordmark({ size = 28, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-ink ${className}`}>
      <Mark size={size} />
      <span className="text-[1.0625rem] font-semibold tracking-tight">मातृत्व AI</span>
    </span>
  );
}
