import React from 'react';

type CabinWindowProps = {
    windowLeft: boolean,
    windowRight: boolean,
}

export const A380XDoors: React.FC<CabinWindowProps> = ({ windowLeft, windowRight }) => (
    <g id="A380X-door" className="White Line StrokeRound Mitre10 NoFill" transform="translate(0, -10)">
        <g id="Outline">
            <path
                className="st0"
                d="M221,109.9c-19.05,22.41-31.65,46.39-38.72,72.97c-3.58,13.46-5.21,27.35-5.17,41.28l0.29,412.19c0.72,8.75,3.11,16.15,5.29,19.83"
            />
            <line className="st0" x1="61.81" y1="401.19" x2="177.11" y2="376.74" />
            <path
                className="st0"
                d="M340.93,109.9c19.05,22.41,31.65,46.39,38.72,72.97c3.58,13.46,5.21,27.35,5.17,41.28l-0.29,412.19c-0.72,8.75-3.11,16.15-5.29,19.83"
            />
            <line className="st0" x1="500.13" y1="401.19" x2="384.83" y2="376.74" />
        </g>
        <g id="Upstairs">
            <path
                className="GreyFill"
                d="M259.64,184.44c-10.42,11.57-18.29,26.34-24.68,42.99l-0.66,394.48
                c0.42,4.99,1.96,9.48,4.43,13.56h83.67c2.59-3.41,3.94-8.25,4.47-14l0.15-389.51c-5.35-19.56-15.86-34.84-29.5-47.53H259.64z"
            />
            <path
                d="M259.64,184.44c-9.46,10.47-16.84,21.73-22.26,34.96c-2.18,5.31-3.28,11-3.28,16.74v382.21
            c0,1.68,0.12,3.36,0.4,5.01c0.92,5.5,2.26,9.74,4.23,12.11"
            />
            <path
                d="M298.48,184.44c9.3,11.25,16.13,16.9,24.26,33.96c2.47,5.18,4.28,12,4.28,17.74v382.21c0,1.68-0.12,3.36-0.4,5.01c-0.92,5.5-2.26,9.74-4.23,12.11"
            />
            <polygon className="BackgroundFill Background" points="258.47,261.45 253.37,282.75 303.42,282.5 300.54,261.45" />
            <rect x="269.28" y="263.17" className="Background GreyFill" width="18.83" height="2.61" />
            <polygon className="Background GreyFill" points="259.64,272.27 258.64,276.67 298.73,276.67 297.73,272.27" />
            <polygon className="Background GreyFill" points="265.98,265.78 265.09,268.35 292.04,268.39 290.95,265.78" />
            <polygon className="Background GreyFill" points="262.94,268.3 261.94,272.27 294.65,272.27 293.55,268.3" />
            <polygon className="Background GreyFill" points="255.9,277 253.92,282.5 302.9,282.5 301.7,277" />
        </g>
        <g id="Cockpit" className="GreyFill Grey">
            <polygon points="279.03,75.31 279.03,100.85 247.86,121.66 245.86,97.23" />
            <polygon points="281.39,75.31 281.39,100.85 312.56,121.66 314.56,97.23" />
            <path d="M223.75,138.39h14.75c-1.77,2.78-3.93,5.39-6.49,7.83l-14.76,11.55L223.75,138.39z" />
            <path d="M336.43,138.39h-14.75c1.77,2.78,3.93,5.39,6.49,7.83l14.76,11.55L336.43,138.39z" />
            <polygon points="240.71,101.84 226.39,132.78 240.71,132.78 242.68,127.5" />
            <polygon points="319.42,102.12 333.73,133.06 319.42,133.06 317.44,127.77" />
        </g>
        <g id="Cockpit windows">
            {/* Captain's window */}
            <path className={windowLeft ? 'Green NoFill' : 'Amber AmberFill'} d="M241.6,100.3l-16.63,33.47h16.4l1.68-4.79c0.42-1.2,0.59-2.47,0.49-3.74L241.6,100.3z" />
            {/* FO's window */}
            <path className={windowRight ? 'Green NoFill' : 'Amber AmberFill'} d="M318.79,100.3l16.63,33.47h-16.4l-1.68-4.79c-0.42-1.2-0.59-2.47-0.49-3.74L318.79,100.3z" />
        </g>
    </g>
);

export default A380XDoors;
