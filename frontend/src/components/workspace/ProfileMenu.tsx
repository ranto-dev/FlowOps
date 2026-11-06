import React, { useEffect, useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { PreferenceControls } from "../ui/PreferenceControls";
import { usePreferences } from "../../lib/usePreferences";
import { cn } from "../../lib/utils";

export interface ProfileMenuProps {
  username: string;
  avatarUrl: string | null;
  /** Demande de déconnexion (la confirmation est gérée par le parent). */
  onSignOut: () => void;
}

const Avatar: React.FC<{ username: string; avatarUrl: string | null; size: "sm" | "md" }> = ({
  username,
  avatarUrl,
  size,
}) => {
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={username}
      className={cn(box, "rounded-full object-cover", size === "md" && "border border-line-strong")}
    />
  ) : (
    <div className={cn(box, "flex shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-ink")}>
      <User className="h-4 w-4" />
    </div>
  );
};

/** Menu profil du header : avatar, état de connexion, préférences, déconnexion. */
export const ProfileMenu: React.FC<ProfileMenuProps> = ({ username, avatarUrl, onSignOut }) => {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Dropdown : fermeture au clic extérieur et sur Échap, sans piège de focus.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        type="button"
        aria-label={`${t("Profile")}: ${username}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="workspace-profile-menu"
        className={cn(
          "overflow-hidden rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-accent-ink",
          open && "opacity-80",
        )}
      >
        <Avatar username={username} avatarUrl={avatarUrl} size="sm" />
      </button>

      {open && (
        <div
          id="workspace-profile-menu"
          role="group"
          aria-label={t("Profile settings")}
          className="animate-profile-menu-in absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-lg border border-line-strong bg-surface p-2 shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-line px-2 py-2.5">
            <Avatar username={username} avatarUrl={avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{username}</p>
              <p className="flex items-center gap-1 text-xs text-success">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                {t("Connected")}
              </p>
            </div>
          </div>

          <div className="border-b border-line px-1 py-2">
            <PreferenceControls layout="menu" />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-danger"
            >
              <LogOut className="h-4 w-4" /> {t("Sign out")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
