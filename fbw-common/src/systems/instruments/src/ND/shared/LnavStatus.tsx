// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class LnavStatus extends DisplayComponent<{}> {
  private readonly textRef = FSComponent.createRef<SVGTextElement>();

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    Coherent.on('A32NX_FM_DEBUG_LNAV_STATUS', (message: string) => {
      this.textRef.instance.innerHTML = message
        .split('\n')
        .map((line) => `<tspan x="50" dy="1.2em">${line}</tspan>`)
        .join('\r');
    });
  }

  render(): VNode | null {
    return <text x={50} y={400} ref={this.textRef} class="Magenta FontTiny StartAlign shadow" />;
  }
}
