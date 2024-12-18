// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC, MouseEventHandler } from 'react';

export interface FailureButtonProps {
  name: string;
  isActive: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className: string;
  highlightedTerm?: string;
}

export const FailureButton: FC<FailureButtonProps> = ({
  name,
  isActive,
  onClick,
  className,
  highlightedTerm,
}: FailureButtonProps) => {
  const color = isActive ? 'border-utility-red' : 'border-utility-green';

  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex rounded-md border-t-4 bg-theme-accent px-2 pb-2 pt-3 text-left ${color} ${className}`}
    >
      {highlightedTerm ? (
        <h2>
          {name.substring(0, name.indexOf(highlightedTerm))}
          <span className="text-2xl underline">{highlightedTerm}</span>
          {name.substring(name.indexOf(highlightedTerm) + highlightedTerm.length)}
        </h2>
      ) : (
        <h2>{name}</h2>
      )}
    </button>
  );
};
