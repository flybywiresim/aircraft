import React from 'react';

interface LogoProps {
    width: number;
    height: number;
    className?: string;
}

export const FbwLogo = ({ width, height, className }: LogoProps) => (
    <svg width={width} height={height} className={className} viewBox="0 0 32 30" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 0H23.1872C22.4553 0 21.7819 0.399775 21.4314 1.0423L10 22C6.5 28 2.86913 30 0 30H26L32 0Z" fill="currentColor" />
    </svg>
);
