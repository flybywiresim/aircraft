import { DisplayComponent, EventBus, FSComponent, Subject, Subscribable } from '@microsoft/msfs-sdk';
import {
  ActuatorIndication,
  ActuatorType,
  ElecPowerSource,
  getFcdcBitForPowerSource,
  getFcdcBitForPowerSourceInfoAvail,
  HydraulicPowerSource,
} from './ActuatorIndication';
import { VerticalDeflectionIndication } from './VerticalDeflectionIndication';
import { FcdcBusBaseEvents } from '@shared/publishers/FcdcPublisher';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';

export enum AileronSide {
  Left = 'left',
  Right = 'right',
}

export enum AileronPosition {
  Inboard = 'inner',
  Mid = 'middle',
  Outboard = 'outer',
}

interface AileronProps {
  x: number;
  y: number;
  side: AileronSide;
  position: AileronPosition;
  onGround: Subscribable<boolean>;
  bus: EventBus;
}

export class Aileron extends DisplayComponent<AileronProps> {
  private readonly sub = this.props.bus.getSubscriber<FcdcBusBaseEvents>();

  private readonly fcdcDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_2'));

  private readonly fcdcDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_3'));

  private readonly fcdcDiscreteWord12 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_12'));

  private readonly fcdcAileronPosition = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_${this.props.side}_${this.props.position}_aileron_position_deg`),
  );

  private readonly showAileronDroopSymbol = Subject.create(true);

  private readonly deflectionInfoValid = this.fcdcAileronPosition.map((word) => !word.isInvalid());

  private readonly actuator1PowerSource: HydraulicPowerSource;

  private readonly actuator2PowerSource: HydraulicPowerSource | ElecPowerSource;

  private readonly powerSource1Avail = this.fcdcDiscreteWord12.map((word) =>
    word.bitValue(getFcdcBitForPowerSource(this.actuator1PowerSource)),
  );

  private readonly powerSource1InfoAvail = this.fcdcDiscreteWord12.map((word) =>
    word.bitValueOr(getFcdcBitForPowerSourceInfoAvail(this.actuator1PowerSource), false),
  );

  private readonly powerSource2Avail = this.fcdcDiscreteWord12.map((word) =>
    word.bitValue(getFcdcBitForPowerSource(this.actuator2PowerSource)),
  );

  private readonly powerSource2InfoAvail = this.fcdcDiscreteWord12.map((word) =>
    word.bitValueOr(getFcdcBitForPowerSourceInfoAvail(this.actuator2PowerSource), false),
  );

  private readonly failAvailBit1: number;

  private readonly failAvailBit2: number;

  private readonly powerAvail = this.fcdcDiscreteWord3.map(
    (word) => word.bitValue(this.failAvailBit1) || word.bitValue(this.failAvailBit2),
  );

  private readonly actuator1Failed = this.fcdcDiscreteWord2.map((word) => word.bitValueOr(this.failAvailBit1, false));

  private readonly actuator2Failed = this.fcdcDiscreteWord2.map((word) => word.bitValueOr(this.failAvailBit2, false));

  constructor(props: AileronProps) {
    super(props);

    if (props.position === AileronPosition.Outboard) {
      this.actuator1PowerSource = HydraulicPowerSource.Green;
      this.actuator2PowerSource = HydraulicPowerSource.Yellow;
    } else if (props.position === AileronPosition.Mid) {
      this.actuator1PowerSource = HydraulicPowerSource.Yellow;
      this.actuator2PowerSource = ElecPowerSource.AcEss;
    } else {
      this.actuator1PowerSource = HydraulicPowerSource.Green;
      this.actuator2PowerSource = ElecPowerSource.AcEha;
    }

    let failAvailBit = this.props.side === AileronSide.Left ? 11 : 19;
    if (this.props.position == AileronPosition.Mid) {
      failAvailBit += 2;
    } else if (this.props.position == AileronPosition.Outboard) {
      failAvailBit += 4;
    }

    this.failAvailBit1 = failAvailBit;
    this.failAvailBit2 = failAvailBit + 1;
  }

  render() {
    let actuatorIndicationX: number;
    if (this.props.position === AileronPosition.Mid) {
      actuatorIndicationX = -5;
    } else if (
      (this.props.side === AileronSide.Left && this.props.position === AileronPosition.Outboard) ||
      (this.props.side === AileronSide.Right && this.props.position === AileronPosition.Inboard)
    ) {
      actuatorIndicationX = -13;
    } else {
      actuatorIndicationX = 2;
    }

    return (
      <g
        id={`aileron-${this.props.side}-${this.props.position}`}
        transform={`translate(${this.props.x} ${this.props.y})`}
      >
        <VerticalDeflectionIndication
          powerAvail={this.powerAvail}
          deflectionInfoValid={this.deflectionInfoValid}
          deflection={this.fcdcAileronPosition.map((aileronDeflection) => aileronDeflection.value)}
          showAileronDroopSymbol={this.showAileronDroopSymbol}
          onGround={this.props.onGround}
        />

        <ActuatorIndication
          x={actuatorIndicationX}
          y={128}
          type={ActuatorType.Conventional}
          powerSource={this.actuator1PowerSource}
          powerSourceAvailable={this.powerSource1Avail}
          powerSourceInfoAvailable={this.powerSource1InfoAvail}
          actuatorFailed={this.actuator1Failed}
        />
        <ActuatorIndication
          x={actuatorIndicationX}
          y={159}
          type={this.props.position === AileronPosition.Outboard ? ActuatorType.Conventional : ActuatorType.EHA}
          powerSource={this.actuator2PowerSource}
          powerSourceAvailable={this.powerSource2Avail}
          powerSourceInfoAvailable={this.powerSource2InfoAvail}
          actuatorFailed={this.actuator2Failed}
        />
      </g>
    );
  }
}
