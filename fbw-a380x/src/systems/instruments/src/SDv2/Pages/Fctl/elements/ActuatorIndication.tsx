import { DisplayComponent, FSComponent, Subscribable, SubscribableMapFunctions } from '@microsoft/msfs-sdk';

export enum ActuatorType {
  Conventional,
  EHA,
}

export enum HydraulicPowerSource {
  Green = 0,
  Yellow = 1,
}

// Needs to have different values, otherwise it can't be distinguished at runtime
export enum ElecPowerSource {
  AcEss = 2,
  Ac1 = 3,
  AcEha = 4,
}

/**
 *
 * @param v The power source to check
 * @returns If the power source is hydraulic or not
 */
export function powerSourceIsHydraulic(v: HydraulicPowerSource | ElecPowerSource): v is HydraulicPowerSource {
  return v === HydraulicPowerSource.Green || v === HydraulicPowerSource.Yellow;
}

/**
 *
 * @param v The power source to check
 * @returns The bit of the FCDC Discrete Word 12 to check for power source availability
 */
export function getFcdcBitForPowerSource(v: HydraulicPowerSource | ElecPowerSource) {
  if (powerSourceIsHydraulic(v)) {
    return 28 + v;
  } else {
    return 24 + v - ElecPowerSource.AcEss;
  }
}

/**
 *
 * @param v The power source to check
 * @returns The bit of the FCDC Discrete Word 12 to check for power source info availability
 */
export function getFcdcBitForPowerSourceInfoAvail(v: HydraulicPowerSource | ElecPowerSource) {
  if (powerSourceIsHydraulic(v)) {
    return 27;
  } else {
    return 23;
  }
}

interface ActuatorIndicationProps {
  x: number;
  y: number;
  type: ActuatorType;
  powerSource: HydraulicPowerSource | ElecPowerSource;
  powerSourceAvailable: Subscribable<boolean>;
  powerSourceInfoAvailable: Subscribable<boolean>;
  actuatorFailed: Subscribable<boolean>;
}

export class ActuatorIndication extends DisplayComponent<ActuatorIndicationProps> {
  render() {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <path class="Grey Fill" d="m0,0 h 25 v 25 h-25 z" />
        <path
          class={this.props.actuatorFailed.map((actuatorFailed) => (actuatorFailed ? 'Amber SW3 NoFill' : 'Hide'))}
          d="m0,0 h 25 v 25 h-25 z"
        />

        {this.props.type === ActuatorType.Conventional && (
          <text
            class={{
              F26: true,
              Hide: this.props.powerSourceInfoAvailable.map(SubscribableMapFunctions.not()),
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
              Hide: this.props.powerSourceInfoAvailable.map(SubscribableMapFunctions.not()),
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
  hydPowerInfoAvailable: Subscribable<boolean>;
  elecPowerAvailable: Subscribable<boolean>;
  elecPowerInfoAvailable: Subscribable<boolean>;
  hydActuatorFailed: Subscribable<boolean>;
  elecActuatorFailed: Subscribable<boolean>;
}

export class EbhaActuatorIndication extends DisplayComponent<EbhaActuatorIndicationProps> {
  render() {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <path class="Grey Fill" d="m0,0 h 40 v 25 h-40 z" />
        <path
          class={this.props.hydActuatorFailed.map((hydActuatorFailed) =>
            hydActuatorFailed ? 'Amber SW3 LineRound NoFill' : 'Hide',
          )}
          d="m20,0 h -20 v 25 h20"
        />
        <path
          class={this.props.elecActuatorFailed.map((hydActuatorFailed) =>
            hydActuatorFailed ? 'Amber SW3 LineRound NoFill' : 'Hide',
          )}
          d="m20,0 h 20 v 25 h-20"
        />

        <text
          class={{
            F26: true,
            Hide: this.props.hydPowerInfoAvailable.map(SubscribableMapFunctions.not()),
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
            Hide: this.props.elecPowerInfoAvailable.map(SubscribableMapFunctions.not()),
            Amber: this.props.elecPowerAvailable.map(SubscribableMapFunctions.not()),
            Green: this.props.elecPowerAvailable,
          }}
          d="m34,6 l -7,7 h 7 l-7,7"
        />
      </g>
    );
  }
}
