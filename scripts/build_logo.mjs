import fs from 'fs';

// Accurate Toprun corporate emblem with transparent background
// Colors:
// Navy blue: #0A257A
// Red: #D8004C

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <!-- Toprun Corporate Identity Emblem - Transparent Background -->
  <defs>
    <g id="toprun-half">
      <!-- Inner Red Chevron with rounded apex and rounded tip -->
      <path
        d="M 465 296
           L 352 198
           C 340 188 322 188 310 198
           L 225 272
           C 214 282 214 298 225 308
           C 236 318 252 318 263 308
           L 326 253
           C 334 246 346 246 354 253
           L 404 296
           Z"
        fill="#D8004C"
      />
      
      <!-- Framing Navy Blue Continuous Track Ribbon -->
      <path
        d="M 525 300
           L 362 165
           C 342 147 312 147 292 165
           L 185 258
           C 162 278 162 314 185 334
           C 207 353 241 353 263 334
           L 338 269
           C 344 264 354 264 360 269
           L 432 328
           C 442 336 456 338 468 333
           L 495 320
           L 525 300
           Z"
        fill="none"
        stroke="#0A257A"
        stroke-width="16"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </g>
  </defs>

  <!-- Upper Half -->
  <use href="#toprun-half" />

  <!-- Lower Half (Rotated 180° for exact symmetry) -->
  <use href="#toprun-half" transform="rotate(180 300 300)" />
</svg>`;

fs.writeFileSync('public/toprun-logo.svg', svg);
console.log('Generated public/toprun-logo.svg');
