/**
 * SanadBadge — reusable Sanad identity branding block.
 * Used wherever National ID entry appears to signal the future
 * Sanad Digital Identity integration point.
 *
 * Future: replace this block with the Sanad OAuth/OIDC redirect trigger.
 */

import { ShieldCheck } from "lucide-react";

interface SanadLogoProps {
  /** Size of the logo container in px — keeps aspect ratio */
  size?: number;
  className?: string;
}

export function SanadLogo({ size = 56, className = "" }: SanadLogoProps) {
  return (
    <img
      src="/sanad-logo.png"
      alt="Sanad Digital Identity"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      className={className}
    />
  );
}

/** Compact badge shown above the National ID field on Login */
export function SanadLoginBadge() {
  return (
    <div className="flex flex-col items-center gap-1.5 py-3">
      <SanadLogo size={52} />
      <p className="text-xs text-muted-foreground font-medium">
        Future integration with Sanad Digital Identity
      </p>
    </div>
  );
}

/** Larger header shown above the National ID field on Sign Up */
export function SanadSignupHeader() {
  return (
    <div className="flex flex-col items-center gap-2 py-2 text-center">
      <SanadLogo size={60} />
      <p className="font-semibold text-sm">Identity Verification</p>
      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
        This account will be linked to your Jordanian Digital Identity
        through Sanad in future releases.
      </p>
    </div>
  );
}

/** Info card shown below the National ID field */
export function SanadFutureCard() {
  return (
    /*
     * Future integration point:
     * Replace this card with a "Continue with Sanad" button that initiates
     * the Sanad Digital Identity OAuth flow (OIDC / PKCE).
     */
    <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
      <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-emerald-700 mb-0.5">
          Future Sanad Integration
        </p>
        <p className="text-xs text-emerald-700/80 leading-relaxed">
          In future versions, FinTwin will securely verify your identity
          through the Sanad Digital Identity platform, eliminating the need
          for manual identity verification.
        </p>
      </div>
    </div>
  );
}
