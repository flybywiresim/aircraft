// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscribable, SubscribableUtils, VNode } from '@microsoft/msfs-sdk';

interface FormattedFwcTextProps {
  message: Subscribable<string> | string;
  x: number;
  y: number;
  /** Whether this line will be rendered in the PFD. Has impact on font-size */
  pfd?: boolean;
}
export class FormattedFwcText extends DisplayComponent<FormattedFwcTextProps> {
  private readonly linesRef = FSComponent.createRef<SVGGElement>();
  private readonly decorationRef = FSComponent.createRef<SVGGElement>();

  private readonly messageSub = SubscribableUtils.toSubscribable(this.props.message, true);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.messageSub.sub((message) => {
      const LINE_SPACING = 30;
      const LETTER_WIDTH = 16;

      this.linesRef.instance.innerHTML = '';
      this.decorationRef.instance.innerHTML = '';

      let spans: VNode[] = [];
      let yOffset = 0;

      let color = 'White';
      let underlined = false;
      let flashing = false;
      let framed = false;
      let pulsing = false;
      let buffer = '';
      let startCol = 0;
      let col = 0;
      let textSize = 0;
      let backGroundFlashingColor: null | string = null;
      for (let i = 0; i < message.length; i++) {
        const char = message[i];
        if (char === '\x1b' || char === '\r') {
          if (buffer !== '') {
            // close current part
            spans.push(
              <tspan
                key={buffer}
                class={{ [color]: true, EWDWarn: true, MemoFlashing: flashing, MemoPulsing: pulsing }}
              >
                {buffer}
              </tspan>,
            );
            buffer = '';

            if (flashing) {
              backGroundFlashingColor = color;
            }

            if (underlined) {
              const d = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              d.setAttribute('class', `Underline ${color}Line`);
              d.setAttribute('strokeLinecap', 'round');
              d.setAttribute(
                'd',
                `M ${this.props.x + startCol * LETTER_WIDTH} ${this.props.y + (yOffset + 4)} h ${(col - startCol) * LETTER_WIDTH + 5}`,
              );
              this.decorationRef.instance.appendChild(d);
            }

            if (framed) {
              const d = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              d.setAttribute('class', `Underline ${color}Line`);
              d.setAttribute('strokeLinecap', 'round');
              d.setAttribute(
                'd',
                `M ${this.props.x + startCol * LETTER_WIDTH}
                                ${this.props.y + yOffset - 22} h ${(col - startCol) * LETTER_WIDTH + 12} v 27 h ${-((col - startCol) * LETTER_WIDTH + 12)} v -27`,
              );
              this.decorationRef.instance.appendChild(d);
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
                  flashing = false;
                  pulsing = false;
                  framed = false;
                  break;
                case '4m':
                  // Underlined attribute
                  underlined = true;
                  break;
                case ')m':
                  // pulsing attribute
                  pulsing = true;
                  break;
                case ')f':
                  flashing = true;
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
            textSize += 1;
            continue;
          }

          if (char === '\r') {
            const e = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const x = this.props.x.toString();
            const ynumber = this.props.y + yOffset;
            const y = (this.props.y + yOffset).toString();
            e.setAttribute('x', x);
            e.setAttribute('y', y);
            spans.forEach((s) => {
              FSComponent.render(s, e);
            });

            if (backGroundFlashingColor !== null) {
              const ret = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

              ret.setAttribute('x', x);
              ret.setAttribute('y', (ynumber - 19).toString());
              ret.setAttribute('height', '21');
              ret.setAttribute('width', (15 * textSize).toString());
              ret.setAttribute('class', `BackGroundFlashing${backGroundFlashingColor}`);
              this.linesRef.instance.appendChild(ret);
            }

            this.linesRef.instance.appendChild(e);
            yOffset += LINE_SPACING;

            spans = [];
            col = 0;
            startCol = 0;
            textSize = 0;
            backGroundFlashingColor = null;
            continue;
          }
        }

        buffer += char;
        textSize += 1;
        col++;
      }

      if (buffer !== '') {
        spans.push(
          <tspan
            key={buffer}
            class={{ [color]: true, EWDWarn: !this.props.pfd, FontMediumSmaller: this.props.pfd ?? false }}
          >
            {buffer}
          </tspan>,
        );
      }

      if (spans.length) {
        const e = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const x = this.props.x.toString();
        const ynumber = this.props.y + yOffset;
        const y = (this.props.y + yOffset).toString();
        e.setAttribute('x', x);
        e.setAttribute('y', y);
        spans.forEach((s) => {
          FSComponent.render(s, e);
        });
        if (backGroundFlashingColor !== null) {
          const ret = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          ret.setAttribute('x', x);
          ret.setAttribute('y', (ynumber - 19).toString());
          ret.setAttribute('height', '21');
          ret.setAttribute('width', (15 * textSize).toString());
          ret.setAttribute('class', `BackGroundFlashing${backGroundFlashingColor}`);
          this.linesRef.instance.appendChild(ret);
        }
        this.linesRef.instance.appendChild(e);
        yOffset += LINE_SPACING;
        textSize = 0;
        backGroundFlashingColor = null;
      }
    }, true);
  }

  render(): VNode {
    return (
      <g>
        <g ref={this.linesRef} />
        <g ref={this.decorationRef} />
      </g>
    );
  }
}
