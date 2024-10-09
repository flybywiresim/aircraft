import React from 'react';

type CabinWindowProps = {
  windowLeft: boolean;
  windowRight: boolean;
};

export const Outline: React.FC<CabinWindowProps> = ({ windowLeft, windowRight }) => (
  <>
    <g id="Outline" className="White SW3 StrokeRound NoFill">
      <path d="m224,110 c-19,22,-31,46,-39,73 c-3,13,-5,27,-5,41 l0,408 c0,9,3,16,5,24" />
      <path d="m65,400 l116, -24" />
      <path d="m344,110 c19,22,31,46,39,73 c3,13,5,27,5,41 l0,408 c0,9,-3,16,-5,24" />
      <path d="m503,400 l-116, -24" />
    </g>
    <g id="Upstairs">
      <path
        className="Grey Fill"
        d="M263,184 c-11,10,-26,34,-26,49 v380 c0,5,0,14,5,22 h82 c0,-5,0,14,6,-22 v-380 c0,-9,0,-20,-29,-49 z"
      />
      <path className="SW2 White NoFill StrokeRound" d="M263,184 c-11,10,-26,34,-26,49 v380 c0,5,0,14,5,22" />
      <path className="SW2 White NoFill StrokeRound" d="M301,184 c12,9,29,34,29,49 v380 c0,5,0,14,-6,22" />
      <path className="BackgroundFill Background" d="m261,261 h43 l3,21 h-50 z" />
      <path className="Background GreyFill" d="m257,282 h50 l-2,-6 h-46 z" />
      <path className="Background GreyFill" d="m262,276 h40 l-1,-4 h-38 z" />
      <path className="Background GreyFill" d="m265,272 h34 l-2,-4 h-30 z" />
      <path className="Background GreyFill" d="m269,268 h26 l-1,-2 h-24 z" />
      <path className="Background GreyFill" d="m272,266 h20 l-1,-2 h-18 z" />
    </g>
    <g id="Cockpit" className="Grey Fill">
      <path d="M282,75 l-33,21 l2,26 l31,-22 z" />
      <path d="M285,75 l33,21 l-2,26 l-31,-22 z" />
      <path d="M243,138 h-15 l -7,19 h1 l16,-12 z" />
      <path d="M325,138 h15 l 7,19 h-1 l-16,-12 z" />
      <path d="M244,102 l-14,30 h14 l2,-5 z" />
      <path d="M323,102 l14,30 h-14 l-2,-5 z" />
    </g>
    <g id="Cockpit windows">
      {/* Captain's window */}
      <path className={windowLeft ? 'Green NoFill SW3 LineJoinRound' : 'Amber Fill'} d="M244,102 l-14,30 h14 l2,-5 z" />
      {/* FO's window */}
      <path
        className={windowRight ? 'Green NoFill SW3 LineJoinRound' : 'Amber Fill'}
        d="M323,102 l14,30 h-14 l-2,-5 z"
      />
    </g>
  </>
);

export default Outline;
