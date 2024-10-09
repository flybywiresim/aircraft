import React from 'react';

export const A380XCruise = () => (
  <g id="A380X-cruise" className="White Line NoFill" transform="translate(0, -4)">
    {/* Body */}
    <path
      className="White SW4 NoFill LineRound"
      d="M325.04,565.99l0.98,42.94h64.27c3.35,0,6.05-2.74,6-6.09l-1.81-123.07c-0.05-3.28-2.72-5.91-6-5.91H123.91 v133.75"
    />
    <polyline className="White SW4 NoFill LineRound" points="65.11,608.93 191.61,608.93 191.61,568.14" />
    <line className="White SW4 NoFill LineRound" x1="123.91" y1="522.06" x2="394.39" y2="522.06" />
    <line className="White SW4 NoFill LineRound" x1="123.91" y1="566.65" x2="394.39" y2="566.65" />

    {/* Cockpit */}
    <path className="White SW4 NoFill LineRound" d="M123.91,473.85c-21.31-1-38.87,7.37-51.53,18.82" />
    <path
      className="White SW4 NoFill LineRound"
      d="M65.11,608.93c-15.76-2.46-30.88-10.29-45.08-25.76c-7.68-8.03-10.07-15.85-2.34-26.13 c1.62-2.15,3.41-4.16,5.45-5.93c6.8-5.92,16.95-14.76,27.28-23.76"
    />

    {/* Triangles */}
    <path className="White Fill" d="M76.81,488.95v9.88h-9.22C70.17,493.52,73.22,490.12,76.81,488.95z" />
    <polygon className="White Fill" points="53.58,520.52 53.58,531.26 46.61,531.26" />

    {/* Window */}
    <path className="White SW2 NoFill LineRound" d="M71.89,492.21 c-8.54,10.04 -16.3,22.2 -23.45,35.98" />
  </g>
);

export default A380XCruise;
