/**
 * Minimal illustration component for the auth/login page.
 * Features subtle floating geometric shapes with blur effects
 * matching a clean Mistral-inspired design language.
 */
export function Illustration({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* Floating left shape */}
      <div
        style={{
          position: "absolute",
          width: "min(20vw, 18rem)",
          height: "min(20vw, 18rem)",
          borderRadius: "60% 40% 30% 70% / 50% 60% 40% 50%",
          background: "var(--bg-purple, #a855f7)",
          opacity: "0.1",
          filter: "blur(80px)",
          top: "10%",
          left: "-10%",
          animation: "drift 20s ease-in-out infinite",
        }}
      />

      {/* Floating right shape */}
      <div
        style={{
          position: "absolute",
          width: "min(15vw, 12rem)",
          height: "min(15vw, 12rem)",
          borderRadius: "50%",
          background: "var(--bg-purple-20, #a855f7)/30",
          opacity: "0.15",
          filter: "blur(60px)",
          bottom: "10%",
          right: "-5%",
          animation: "drift 25s ease-in-out infinite reverse",
        }}
      />

      {/* Central subtle glow */}
      <div
        style={{
          position: "absolute",
          width: "min(10vw, 8rem)",
          height: "min(10vw, 8rem)",
          borderRadius: "full",
          background: "var(--bg-purple, #a855f7)/20",
          opacity: "0.2",
          filter: "blur(40px)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "pulse 15s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* Keyframes are applied via global CSS or inline styles */