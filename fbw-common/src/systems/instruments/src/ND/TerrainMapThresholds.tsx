import { FSComponent, ConsumerSubject, DisplayComponent, EventBus, VNode, MappedSubject } from '@microsoft/msfs-sdk';

import { GenericTawsEvents, TerrainLevelMode } from './types/GenericTawsEvents';

export interface TerrainMapThresholdsProps {
  bus: EventBus;
  paddingText: string;
}

export class TerrainMapThresholds extends DisplayComponent<TerrainMapThresholdsProps> {
  private readonly sub = this.props.bus.getSubscriber<GenericTawsEvents>();

  private readonly maxElevationSub = ConsumerSubject.create(this.sub.on('egpwc.maxElevation'), -1);

  private readonly maxElevationModeSub = ConsumerSubject.create(this.sub.on('egpwc.maxElevationMode'), 0);

  private readonly minElevationSub = ConsumerSubject.create(this.sub.on('egpwc.minElevation'), -1);

  private readonly minElevationModeSub = ConsumerSubject.create(this.sub.on('egpwc.minElevationMode'), 0);

  private readonly shown = MappedSubject.create(
    ([min, nax]) => min >= 0 && nax >= 0,
    this.minElevationSub,
    this.maxElevationSub,
  );

  private readonly upperBorder = this.maxElevationSub.map((elevation) => {
    let roundedElevation: string;
    if (elevation !== 0) {
      roundedElevation = Math.round(elevation / 100 + 0.5).toString();
    } else {
      roundedElevation = '0';
    }

    return roundedElevation.padStart(3, this.props.paddingText);
  });

  private readonly upperBorderColor = this.maxElevationModeSub.map((mode) => {
    switch (mode as TerrainLevelMode) {
      case TerrainLevelMode.Caution:
        return '#c21d1a';
      case TerrainLevelMode.Warning:
        return 'f5ca4f';
      default:
        return '#64da1d';
    }
  });

  private readonly lowerBorder = this.minElevationSub.map((elevation) => {
    if (elevation > 0) {
      return Math.floor(elevation / 100)
        .toString()
        .padStart(3, this.props.paddingText);
    }

    return '';
  });

  private readonly lowerBorderColor = this.minElevationModeSub.map((mode) => {
    switch (mode as TerrainLevelMode) {
      case TerrainLevelMode.Caution:
        return '#c21d1a';
      case TerrainLevelMode.Warning:
        return '#f5ca4f';
      default:
        return '#64da1d';
    }
  });

  render(): VNode | null {
    return (
      <g visibility={this.shown.map((v) => (v ? 'inherit' : 'hidden'))}>
        <text class="TerrTextLabel" x={688} y={612} font-size={23} fill="#44d9e1">
          TERR
        </text>

        <text x={709} y={639} font-size={22} fill={this.upperBorderColor}>
          {this.upperBorder}
        </text>

        <rect x={700} y={619} width={54} height={24} strokw-width={3} stroke="#f5ca4f" fill-opacity={0} />
        <text x={709} y={663} font-size={22} fill={this.lowerBorderColor}>
          {this.lowerBorder}
        </text>

        <rect x={700} y={643} width={54} height={24} strokw-width={3} stroke="#f5ca4f" fill-opacity={0} />
      </g>
    );
  }
}
