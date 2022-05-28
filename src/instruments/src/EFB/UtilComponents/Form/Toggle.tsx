import React from 'react';

interface ToggleProps {
    value: boolean;
    onToggle: (value: boolean) => void;
}

export const Toggle = ({ value, onToggle }: ToggleProps) => (
    <div className="flex items-center w-14 h-8 rounded-full cursor-pointer bg-theme-accent" onClick={() => onToggle(!value)}>
        <div className={`w-6 h-6 bg-white rounded-full transition mx-1.5 duration-200 transform ${value && 'translate-x-5 !bg-theme-highlight'}`} />
    </div>
);
