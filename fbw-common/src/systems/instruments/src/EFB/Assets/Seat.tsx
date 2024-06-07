// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unknown-property */
/* eslint-disable max-len */
import React from 'react';

interface SeatProps {
  fill: string;
  stroke: string;
  opacity: string;
}

export const Seat = ({ fill, stroke, opacity }: SeatProps) => (
  <svg
    width="12.8"
    height="9.7"
    viewBox="0 0 12.8 9.7"
    fillOpacity={opacity}
    fill={fill}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.3,8.2V1.6c0-0.7,0.6-1.3,1.3-1.3h11v9.2h-11C0.9,9.5,0.3,8.9,0.3,8.2L0.3,8.2z"
      stroke={stroke}
      strokeWidth="0.5"
    />
  </svg>
);

export const BusinessSeatRight = ({ fill, stroke, opacity }: SeatProps) => (
  <svg width="65" height="65" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
    <path id="Shelf" fill="none" stroke={stroke} strokeWidth="1" d="m6.11,36h45.31s-22.65.54-22.65,29.35" />
    <path
      id="Seat"
      d="M51.42 36 51.42 65.35 6.11 65.35 6.11 6.65 65.89 6.65 65.89 36 51.42 36z"
      fillOpacity="none"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
    />
    <path
      id="SeatHighlight"
      d="M 6.11 36 L 6.11 6.65 L 65.89 6.65 L 65.89 36 z"
      fillOpacity={opacity}
      fill={fill}
      stroke="none"
      strokeWidth="2"
    />
  </svg>
);

export const BusinessSeatLeft = ({ fill, stroke, opacity }: SeatProps) => (
  <svg width="65" height="65" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
    <path id="Shelf" fill="none" stroke={stroke} strokeWidth="1" d="m6.11,36h45.31s-22.65-.54-22.65-29.35" />
    <path
      id="Seat"
      d="M51.42 36 51.42 6.65 6.11 6.65 6.11 65.35 65.89 65.35 65.89 36 51.42 36z"
      fillOpacity="none"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
    />
    <path
      id="SeatHighlight"
      d="M 6.11 36 L 6.11 65.35 L 65.89 65.35 L 65.89 36 z"
      fillOpacity={opacity}
      fill={fill}
      stroke="none"
      strokeWidth="2"
    />
  </svg>
);

export const SuiteRight = ({ fill, stroke, opacity }: SeatProps) => (
  <svg width="60" height="60" viewBox="12 12 72 72" xmlns="http://www.w3.org/2000/svg">
    <path
      id="Seat_1"
      d="m12.26,49.48h13.09v-8.72c0-8.9-5.38-13.72-13.09-18.28v27Z"
      fillOpacity="none"
      fill="none"
      stroke={stroke}
      strokeWidth="1"
    />
    <path
      id="Seat_1-2"
      d="M37.49 33.36 37.49 49.48 59.74 49.48 59.74 22.48 12.26 22.48 12.26 33.36 37.49 33.36z"
      fill="none"
      stroke={stroke}
      strokeWidth="1"
    />
    <path
      id="SeatHighlight"
      d="M 37.49 33.36 L 37.49 49.48 L 59.74 49.48 L 59.74 33.36 z"
      fillOpacity={opacity}
      fill={fill}
      stroke="none"
      strokeWidth="1"
    />
    <line
      x1="37.49"
      y1="33.36"
      x2="59.74"
      y2="33.36"
      fillOpacity="none"
      fill="none"
      stroke={stroke}
      strokeWidth="0.5"
    />
  </svg>
);

export const SuiteLeft = ({ fill, stroke, opacity }: SeatProps) => (
  <svg width="60" height="60" viewBox="12 12 72 72" xmlns="http://www.w3.org/2000/svg">
    <path
      id="Seat_1"
      d="m12.26,22.52h13.09v8.72c0,8.9-5.38,13.72-13.09,18.28v-27Z"
      fillOpacity="none"
      fill="none"
      stroke={stroke}
      strokeWidth="1"
    />
    <path
      id="Seat_1-2"
      d="M37.49 38.64 37.49 22.52 59.74 22.52 59.74 49.52 12.26 49.52 12.26 38.64 37.49 38.64 z"
      fill="none"
      stroke={stroke}
      strokeWidth="1"
    />
    <path
      id="SeatHighlight"
      d="M 37.49 38.64 L 37.49 22.52 L 59.74 22.52 L 59.74 38.64 z"
      fillOpacity={opacity}
      fill={fill}
      stroke="none"
      strokeWidth="1"
    />
    <line
      x1="37.49"
      y1="38.64"
      x2="59.74"
      y2="38.64"
      fillOpacity="none"
      fill="none"
      stroke={stroke}
      strokeWidth="0.5"
    />
  </svg>
);
