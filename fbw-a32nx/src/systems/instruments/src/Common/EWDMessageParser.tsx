// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

const LINE_SPACING = 30;
const LETTER_WIDTH = 16;

type FormattedFwcTextProps = {
  x: number;
  y: number;
  message: string;
};

const FormattedFwcText: React.FC<FormattedFwcTextProps> = ({ x, y, message }) => {
  const lines: any[] = [];
  let spans: any[] = [];

  let color = 'White';
  let underlined = false;
  // const flashing = false; TODO
  let framed = false;

  const decorations: any[] = [];

  let buffer = '';
  let startCol = 0;
  let col = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message[i];
    if (char === '\x1b' || char === '\r') {
      if (buffer !== '') {
        // close current part
        spans.push(
          <tspan key={buffer} className={`${color} EWDWarn`}>
            {buffer}
          </tspan>,
        );
        buffer = '';

        if (underlined) {
          decorations.push(
            <path
              className={`Underline ${color}Line`}
              d={`M ${x + startCol * LETTER_WIDTH} ${y + (lines.length * LINE_SPACING + 4)} h ${(col - startCol) * LETTER_WIDTH + 5}`}
              strokeLinecap="round"
            />,
          );
        }

        if (framed) {
          decorations.push(
            <path
              className={`Underline ${color}Line`}
              d={`M ${x + startCol * LETTER_WIDTH}
                            ${y + lines.length * LINE_SPACING - 22} h ${(col - startCol) * LETTER_WIDTH + 12} v 27 h ${-((col - startCol) * LETTER_WIDTH + 12)} v -27`}
              strokeLinecap="round"
            />,
          );
        }

        startCol = col;
      }

      if (char === '\x1B') {
        let ctrlBuffer = '';
        i++;
        for (; i < message.length; i++) {
          ctrlBuffer += message[i];

          let match = true;
          switch (ctrlBuffer) {
            case 'm':
              // Reset attribute
              underlined = false;
              // flashing = false;
              framed = false;
              break;
            case '4m':
              // Underlined attribute
              underlined = true;
              break;
            case ')m':
              // Flashing attribute
              // flashing = true;
              break;
            case "'m":
              // Characters which follow must be framed
              framed = true;
              break;
            case '<1m':
              // Select YELLOW
              color = 'Yellow';
              break;
            case '<2m':
              // Select RED
              color = 'Red';
              break;
            case '<3m':
              // Select GREEN
              color = 'Green';
              break;
            case '<4m':
              // Select AMBER
              color = 'Amber';
              break;
            case '<5m':
              // Select CYAN (blue-green)
              color = 'Cyan';
              break;
            case '<6m':
              // Select MAGENTA
              color = 'Magenta';
              break;
            case '<7m':
              // Select WHITE
              color = 'White';
              break;
            default:
              match = false;
              break;
          }

          if (match) {
            break;
          }
        }

        continue;
      }

      if (char === '\r') {
        lines.push(
          <text x={x} y={y + lines.length * LINE_SPACING}>
            {spans}
          </text>,
        );

        spans = [];
        col = 0;
        startCol = 0;
        continue;
      }
    }

    buffer += char;
    col++;
  }

  if (buffer !== '') {
    spans.push(
      <tspan key={buffer} className={`${color} EWDWarn`}>
        {buffer}
      </tspan>,
    );
  }

  if (spans.length) {
    lines.push(
      <text x={x} y={y + lines.length * LINE_SPACING}>
        {spans}
      </text>,
    );
  }

  return (
    <g>
      {lines}
      {decorations}
    </g>
  );
};

export default FormattedFwcText;
