/* eslint-disable react/no-unknown-property */
/* eslint-disable max-len */
import React from 'react';

interface SeatProps {
    fill: string;
    stroke: string;
    opacity: string;
}

export const Seat = ({ fill, stroke, opacity }: SeatProps) => (
    <svg width="12.8" height="9.7" viewBox="0 0 12.8 9.7" fillOpacity={opacity} fill={fill} xmlns="http://www.w3.org/2000/svg">
        <path d="M0.3,8.2V1.6c0-0.7,0.6-1.3,1.3-1.3h11v9.2h-11C0.9,9.5,0.3,8.9,0.3,8.2L0.3,8.2z" stroke={stroke} strokeWidth="0.5" />
    </svg>
);
