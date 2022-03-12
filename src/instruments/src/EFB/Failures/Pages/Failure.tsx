import React, { FC, MouseEventHandler } from 'react';

export interface FailureButtonProps {
    name: string,
    isActive: boolean,
    isChanging: boolean,
    onClick: MouseEventHandler<HTMLButtonElement>,
    className: string
}

export const FailureButton: FC<FailureButtonProps> = ({ name, isActive, isChanging, onClick, className }: FailureButtonProps) => {
    let color = 'white';
    if (!isChanging) {
        color = isActive ? 'red-500' : 'colors-lime-300';
    }
    return (
        <button
            onClick={onClick}
            type="button"
            disabled={isChanging}
            className={`flex rounded-md border-t-4 bg-theme-accent px-2 pt-3 pb-2 text-left border-${color} ${className}`}
        >
            <h2>{name}</h2>
        </button>
    );
};
