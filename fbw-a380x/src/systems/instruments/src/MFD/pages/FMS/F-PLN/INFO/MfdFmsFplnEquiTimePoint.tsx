// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import { FmsPage } from '../../../common/FmsPage';
import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import './MfdFmsFplnEquiTimePoint.scss';

export class MfdFmsFplnEquiTimePoint extends FmsPage {
  public render(): VNode {
    return (
      <>
        {super.render()}
        <div class="mfd-fpln-etp-ppos-rect">
          <span class="mfd-label bigger mfd-fpln-etp-ppos-etp-text">P.POS</span>
        </div>
      </>
    );
  }
}
