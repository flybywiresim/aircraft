import React from 'react';

export const Error = ({ className }: { className?: string }) => (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M70 35C70 54.33 54.33 70 35 70C15.67 70 0 54.33 0 35C0 15.67 15.67 0 35 0C54.33 0 70 15.67 70 35Z" fill="#DC2626" />
        <path d="M38.5 14H31.5V45.5H38.5V14ZM38.5 56V49.5542H31.5V56H38.5Z" fill="white" />
        <circle cx="35" cy="35" r="33" stroke="white" strokeWidth="4" />
    </svg>
);
