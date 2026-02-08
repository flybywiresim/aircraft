// Copyright (c) 2025-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';

interface AutoUpdateIconProps extends ComponentProps {
  visible: Subscribable<boolean>;
}

export class AutoUpdateIcon extends DisplayComponent<AutoUpdateIconProps> {
  private readonly visibility = this.props.visible.map((v) => (v ? 'inherit' : 'hidden'));

  destroy(): void {
    this.visibility.destroy();
    super.destroy();
  }

  render(): VNode {
    return (
      <div
        class="d-atis-icon auto-update-symbol"
        style={{
          visibility: this.visibility,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 40 37" fill="none">
          <path d="M 36.8 25.84 A 18.24 18.24 0 1 1 37.24 12.54" fill="none" stroke="#0f0" stroke-width="3" />
          <polygon points="30.5,13.68 39,13.68 39,3.8" fill="#0f0" />
        </svg>
      </div>
    );
  }
}
