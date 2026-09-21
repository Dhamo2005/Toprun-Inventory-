import React from 'react';

interface ToprunLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Toprun Corporate Logo with 100% transparent background.
 * Authentic vector recreation of the official Top Run Total Solution emblem.
 */
export const ToprunLogo: React.FC<ToprunLogoProps> = ({
  className = 'h-8 w-8',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Toprun Logo"
    >
      <defs>
        <g id="toprun-wing">
          {/* Crimson Red Chevron / Boomerang */}
          <path
            d="M 480 292
               L 356 186
               C 342 174 322 174 308 186
               L 226 256
               C 216 265 216 281 226 290
               C 236 299 252 299 262 290
               L 326 235
               C 334 228 346 228 354 235
               L 416 292
               Z"
            fill="#D8004C"
          />

          {/* Navy Blue Surrounding Ribbon */}
          <path
            d="M 525 296
               L 364 158
               C 344 140 314 140 294 158
               L 186 250
               C 164 269 164 303 186 322
               C 208 341 242 341 264 322
               L 338 259
               C 344 254 354 254 360 259
               L 444 331
               L 525 296
               Z"
            fill="none"
            stroke="#0A257A"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </defs>

      {/* Upper Wing */}
      <use href="#toprun-wing" />

      {/* Lower Wing (Rotated 180° for exact symmetry around center 300,300) */}
      <use href="#toprun-wing" transform="rotate(180 300 300)" />
    </svg>
  );
};

export default ToprunLogo;
