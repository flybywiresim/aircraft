//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitAvncsPageProps } from '../../../OIT';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { OisDebugDataEvents } from 'instruments/src/MsfsAvionicsCommon/providers/OisDebugDataPublisher';

interface OitAvncsFbwSystemsAppLdgCapProps extends AbstractOitAvncsPageProps {
  /** Title which should be displayed at the top of the page */
  title: string;
}

export class OitAvncsFbwSystemsAppLdgCap extends DestroyableComponent<OitAvncsFbwSystemsAppLdgCapProps> {
  protected readonly sci = this.props.container.ansu.sci;

  protected readonly sub = this.props.bus.getSubscriber<OisDebugDataEvents>();

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  destroy(): void {
    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <div class="oit-ccom-headline">{this.props.title}</div>
        <div class="fr ass">
          <div class="fc aic">
            <div class="oit-a380x-systems-app-ldg-cap">
              <span style="text-align: center; font-size: 22px;">Capability from FCDC:</span>
              <span style="text-align: center; font-size: 36px; font-weight: bold; margin-top: 5px;">LAND3 DUAL</span>
            </div>
          </div>
          <div class="fc aic" style="flex-grow: 1; ">
            Required Equipment monitored by PRIM FG (partial)
            <div class="oit-a380x-systems-app-ldg-cap-table">
              <div class="oit-a380x-systems-app-ldg-cap-td" style="font-weight: bold; width: 200px; height: 75px;">
                Equipment
              </div>
              <div
                class="oit-a380x-systems-app-ldg-cap-td"
                style="font-weight: bold; height: 75px; text-align: center;"
              >
                LAND2
              </div>
              <div
                class="oit-a380x-systems-app-ldg-cap-td"
                style="font-weight: bold; height: 75px; text-align: center;"
              >
                LAND3
                <br />
                SGL
              </div>
              <div
                class="oit-a380x-systems-app-ldg-cap-td"
                style="font-weight: bold; height: 75px; text-align: center;"
              >
                LAND3
                <br />
                DUAL
              </div>
              <div class="oit-a380x-systems-app-ldg-cap-td">AP engaged</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">A/THR</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Not reqrd</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>Active</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>Active</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">PRIM</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">SEC</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>1</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">Slats/Flaps Ctl</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">Rud. Trim</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Avail.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Avail.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Avail.</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">Hydraulics</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>G/Y</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>G/Y</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>G+Y</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">FWS w/ audio</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">FCDC</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">Antiskid</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Avail.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Avail.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Avail.</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">NWS</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Avail.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Avail.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Avail.</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">ADR</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>2</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>2</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>3</div>
              <div class="oit-a380x-systems-app-ldg-cap-td">Engines</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>3</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>3</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, red: true }}>4</div>
            </div>
          </div>
        </div>
        <div style="flex-grow: 1" />
      </>
    );
  }
}
