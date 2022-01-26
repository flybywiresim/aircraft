import React from 'react';

interface LogoProps {
    width: number;
    height: number;
    className?: string;
}

export const FbwLogo = ({ width, height, className }: LogoProps) => (
    <svg width={width} height={height} viewBox="0 0 214 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M213.333 0H162.497C152.738 0 143.759 5.33034 139.086 13.8973L66.6667 146.667C44.8001 186.667 19.1275 200 0 200H173.334L213.333 0Z" fill="url(#paint0_linear_1679_669)" />
        <defs>
            <linearGradient id="paint0_linear_1679_669" x1="170" y1="93.3333" x2="107" y2="75.4898" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E0FE" />
                <stop offset="1" stopColor="#02CCFF" />
            </linearGradient>
        </defs>
    </svg>
);
