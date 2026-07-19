import { DisplayComponent, FSComponent, Subscribable, SubscribableMapFunctions } from '@microsoft/msfs-sdk';

export enum ActuatorType {
  Conventional,
  EHA,
}

export enum HydraulicPowerSource {
  Green = 'green',
  Yellow = 'yellow',
}

export enum ElecPowerSource {
  AcEss = 'acEss',
  AcEha = 'ac1',
  Ac1 = 'acEha',
}

/**
 *
 * @param v The power source to check
 * @returns If the power source is hydraulic or not
 */
export function powerSourceIsHydraulic(v: HydraulicPowerSource | ElecPowerSource): v is HydraulicPowerSource {
  return v === HydraulicPowerSource.Green || v === HydraulicPowerSource.Yellow;
}

interface ActuatorIndicationProps {
  x: number;
  y: number;
  type: ActuatorType;
  powerSource: HydraulicPowerSource | ElecPowerSource;
  powerSourceAvailable: Subscribable<boolean>;
}

export class ActuatorIndication extends DisplayComponent<ActuatorIndicationProps> {
  private powerSourceInfoAvail = true;
  private actuatorFailed = false;

  render() {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <path class="Grey Fill" d="m0,0 h 25 v 25 h-25 z" />
        <path class={`Amber SW3 ${this.actuatorFailed ? '' : 'Hide'}`} d="m0,0 h 25 v 25 h-25 z" />

        {this.props.type === ActuatorType.Conventional && (
          <text
            class={{
              F26: true,
              Hide: !this.powerSourceInfoAvail,
              Amber: this.props.powerSourceAvailable.map(SubscribableMapFunctions.not()),
              Green: this.props.powerSourceAvailable,
            }}
            x="6"
            y="23"
          >
            {this.props.powerSource === HydraulicPowerSource.Green ? 'G' : 'Y'}
          </text>
        )}
        {this.props.type === ActuatorType.EHA && (
          <path
            class={{
              SW4: true,
              LineRound: true,
              LineJoinRound: true,
              Amber: this.props.powerSourceAvailable.map(SubscribableMapFunctions.not()),
              Green: this.props.powerSourceAvailable,
            }}
            d="m17,6 l -7,7 h 7 l-7,7"
          />
        )}
      </g>
    );
  }
}

interface EbhaActuatorIndicationProps {
  x: number;
  y: number;
  hydraulicPowerSource: HydraulicPowerSource;
  elecPowerSource: ElecPowerSource;
  hydPowerAvailable: Subscribable<boolean>;
  elecPowerAvailable: Subscribable<boolean>;
}

export class EbhaActuatorIndication extends DisplayComponent<EbhaActuatorIndicationProps> {
  powerSourceInfoAvail = true;
  actuatorHydPartFailed = false;
  actuatorElecPartFailed = false;

  render() {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <path class="Grey Fill" d="m0,0 h 40 v 25 h-40 z" />
        <path class={`Amber SW3 LineRound ${this.actuatorHydPartFailed ? '' : 'Hide'}`} d="m20,0 h -20 v 25 h20" />
        <path class={`Amber SW3 LineRound ${this.actuatorElecPartFailed ? '' : 'Hide'}`} d="m20,0 h 20 v 25 h-20" />

        <text
          class={{
            F26: true,
            Hide: !this.powerSourceInfoAvail,
            Amber: this.props.hydPowerAvailable.map(SubscribableMapFunctions.not()),
            Green: this.props.hydPowerAvailable,
          }}
          x="3"
          y="23"
        >
          {this.props.hydraulicPowerSource === HydraulicPowerSource.Green ? 'G' : 'Y'}
        </text>

        <path
          class={{
            SW4: true,
            LineRound: true,
            LineJoinRound: true,
            Amber: this.props.elecPowerAvailable.map(SubscribableMapFunctions.not()),
            Green: this.props.elecPowerAvailable,
          }}
          d="m34,6 l -7,7 h 7 l-7,7"
        />
      </g>
    );
  }
}
