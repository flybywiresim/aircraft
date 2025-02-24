// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscribable, Unit, UnitFamily, UnitType, VNode } from '@microsoft/msfs-sdk';
import './oans-style.scss';
import { ControlPanelMapDataSearchMode } from '@flybywiresim/oanc';

interface OansRunwayInfoBoxProps {
  rwyOrStand: Subscribable<ControlPanelMapDataSearchMode | null>;
  selectedEntity: Subscribable<string | null>;
  tora: Subscribable<string | null>;
  lda: Subscribable<string | null>;
  ldaIsReduced: Subscribable<boolean>;
  coordinate: Subscribable<string>;
  lengthUnit: Subscribable<Unit<UnitFamily.Distance>>;
}
export class OansRunwayInfoBox extends DisplayComponent<OansRunwayInfoBoxProps> {
  private rwyDivRef = FSComponent.createRef<HTMLDivElement>();

  private standDivRef = FSComponent.createRef<HTMLDivElement>();

  private setDivs() {
    this.rwyDivRef.instance.style.display = 'none';
    this.standDivRef.instance.style.display = 'none';

    if (this.props.rwyOrStand.get() === ControlPanelMapDataSearchMode.Runway && this.props.selectedEntity.get()) {
      this.rwyDivRef.instance.style.display = 'grid';
      this.standDivRef.instance.style.display = 'none';
    } else if (this.props.rwyOrStand.get() === ControlPanelMapDataSearchMode.Stand && this.props.selectedEntity.get()) {
      this.rwyDivRef.instance.style.display = 'none';
      this.standDivRef.instance.style.display = 'flex';
    } else {
      this.rwyDivRef.instance.style.display = 'none';
      this.standDivRef.instance.style.display = 'none';
    }
  }

  private distanceUnitFormatter(unit: Unit<UnitFamily.Distance>) {
    return unit === UnitType.METER ? 'M' : 'FT';
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.setDivs();

    this.props.rwyOrStand.sub(() => this.setDivs());
    this.props.selectedEntity.sub(() => this.setDivs());
  }

  render(): VNode {
    return (
      <>
        <div
          ref={this.rwyDivRef}
          class="oans-info-box"
          style="display: none; grid-template-columns: 2fr 1fr 1fr; width: 75%; margin-top: 20px; align-self: center;"
        >
          <div>
            <span class="mfd-label">RWY: </span>
            <span class="mfd-value smaller" style="text-align: left;">
              {this.props.selectedEntity}
            </span>
          </div>
          <span class="mfd-label" style="text-align: right; margin-right: 15px;">
            TORA:{' '}
          </span>
          <span class="mfd-value smaller">
            {this.props.tora
              ? Number(this.props.tora)
                ? this.props.lengthUnit.get().convertFrom(Number(this.props.tora), UnitType.METER)
                : this.props.tora
              : ''}
            <span style="color: rgb(33, 33, 255)">
              {this.props.lengthUnit.map((v) => this.distanceUnitFormatter(v))}
            </span>
          </span>
          <span
            class="mfd-label"
            style="grid-column: span 2; text-align: right; margin-right: 15px;"
          >{`${this.props.ldaIsReduced.get() ? 'REDUCED ' : ''}LDA: `}</span>
          <span class="mfd-value smaller" style={this.props.ldaIsReduced.get() ? 'color: cyan;' : ''}>
            {this.props.lda
              ? Number(this.props.lda)
                ? this.props.lengthUnit.get().convertFrom(Number(this.props.lda), UnitType.METER)
                : this.props.lda
              : ''}
            <span style="color: rgb(33, 33, 255)">
              {this.props.lengthUnit.map((v) => this.distanceUnitFormatter(v))}
            </span>
          </span>
        </div>
        <div
          ref={this.standDivRef}
          class="oans-info-box"
          style="display: none; flex-direction: column; width: 75%; margin: 10px; align-self: center; align-items: center;"
        >
          <span class="mfd-label">
            STAND:
            <span style="color: #00ff00">{this.props.selectedEntity}</span>
          </span>
          <span class="mfd-label" style="align-self: flex-end; color: #00ff00">
            {this.props.coordinate}
          </span>
        </div>
      </>
    );
  }
}
