import React from 'react';

interface CrtOverlayProps {
  enabled?: boolean;
}

export const CrtOverlay: React.FC<CrtOverlayProps> = ({ enabled = true }) => {
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Scanline pattern */}
      <div className="absolute inset-0 crt-overlay opacity-80" />
      {/* Curved vignette */}
      <div className="absolute inset-0 crt-vignette" />
      {/* Subtle chromatic aberration border line */}
      <div className="absolute inset-0 border-2 border-white/5 pointer-events-none" />
    </div>
  );
};
