import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { SDSimvars } from '../../../SDSimvarPublisher';

interface FctlComputerShapeProps {
  x: number;
  y: number;
  num: 1 | 2 | 3;
  infoAvailable: Subscribable<boolean>;
  computerFailed: Subscribable<boolean>;
}

class FctlComputerShape extends DisplayComponent<FctlComputerShapeProps> {
  private readonly computerNumberGreen = MappedSubject.create(
    ([infoAvailable, computerFailed]) => !computerFailed && infoAvailable,
    this.props.infoAvailable,
    this.props.computerFailed,
  );

  private readonly indicationBorderGrey = MappedSubject.create(
    ([infoAvailable, computerFailed]) => !computerFailed || !infoAvailable,
    this.props.infoAvailable,
    this.props.computerFailed,
  );

  render() {
    let path: string;
    let textX: number;
    let textY: number;
    if (this.props.num === 1) {
      path = 'M0 0 l98,0 l0,-35 l-21,0';
      textX = 81;
      textY = -8;
    } else if (this.props.num === 2) {
      path = 'M0 0 l94,0 l0,-35 l-23,0';
      textX = 75;
      textY = -10;
    } else {
      path = 'M0 0 l93,0 l0,-35 l-23,0';
      textX = 74;
      textY = -8;
    }

    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <path
          class={{
            SW3: true,
            NoFill: true,
            LineRound: true,
            Grey: this.indicationBorderGrey,
            Amber: this.indicationBorderGrey.map(SubscribableMapFunctions.not()),
          }}
          d={path}
        />
        <text
          x={textX}
          y={textY}
          class={{
            F26: true,
            Green: this.computerNumberGreen,
            Amber: this.computerNumberGreen.map(SubscribableMapFunctions.not()),
          }}
        >
          {this.props.infoAvailable.map((infoAvailable) => (infoAvailable ? this.props.num : 'X'))}
        </text>
      </g>
    );
  }
}

interface PrimSecFlapsSlatsProps {
  x: number;
  y: number;
  bus: EventBus;
}

export class Prims extends DisplayComponent<PrimSecFlapsSlatsProps> {
  private infoAvailable = Subject.create(true);

  private readonly prim1Healthy = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('prim1Healthy'),
    false,
  );
  private readonly prim2Healthy = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('prim2Healthy'),
    false,
  );
  private readonly prim3Healthy = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('prim3Healthy'),
    false,
  );

  render() {
    return (
      <g id="prim-computers" transform={`translate(${this.props.x} ${this.props.y})`}>
        <text class="F22 White MiddleAlign LS1" x={45} y={85}>
          PRIM
        </text>
        <FctlComputerShape
          x={8}
          y={100}
          num={1}
          infoAvailable={this.infoAvailable}
          computerFailed={this.prim1Healthy.map(SubscribableMapFunctions.not())}
        />
        <FctlComputerShape
          x={36}
          y={112}
          num={2}
          infoAvailable={this.infoAvailable}
          computerFailed={this.prim2Healthy.map(SubscribableMapFunctions.not())}
        />
        <FctlComputerShape
          x={62}
          y={124}
          num={3}
          infoAvailable={this.infoAvailable}
          computerFailed={this.prim3Healthy.map(SubscribableMapFunctions.not())}
        />
      </g>
    );
  }
}

export class Secs extends DisplayComponent<PrimSecFlapsSlatsProps> {
  private infoAvailable = Subject.create(true);

  private readonly sec1Healthy = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('sec1Healthy'),
    false,
  );
  private readonly sec2Healthy = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('sec2Healthy'),
    false,
  );
  private readonly sec3Healthy = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('sec3Healthy'),
    false,
  );

  render() {
    return (
      <g id="sec-computers" transform={`translate(${this.props.x} ${this.props.y})`}>
        <text class="F22 White MiddleAlign LS1" x={48} y={84}>
          SEC
        </text>
        <FctlComputerShape
          x={8}
          y={100}
          num={1}
          infoAvailable={this.infoAvailable}
          computerFailed={this.sec1Healthy.map(SubscribableMapFunctions.not())}
        />
        <FctlComputerShape
          x={36}
          y={112}
          num={2}
          infoAvailable={this.infoAvailable}
          computerFailed={this.sec2Healthy.map(SubscribableMapFunctions.not())}
        />
        <FctlComputerShape
          x={62}
          y={124}
          num={3}
          infoAvailable={this.infoAvailable}
          computerFailed={this.sec3Healthy.map(SubscribableMapFunctions.not())}
        />
      </g>
    );
  }
}

export class Slats extends DisplayComponent<PrimSecFlapsSlatsProps> {
  private infoAvailable = Subject.create(true);
  private computerFailed = Subject.create(false);

  render() {
    return (
      <g id="slat-computers" transform={`translate(${this.props.x} ${this.props.y})`}>
        <text class="F22 White MiddleAlign LS1" x={46} y={85}>
          SLATS
        </text>
        <FctlComputerShape
          x={8}
          y={100}
          num={1}
          infoAvailable={this.infoAvailable}
          computerFailed={this.computerFailed}
        />
        <FctlComputerShape
          x={36}
          y={112}
          num={2}
          infoAvailable={this.infoAvailable}
          computerFailed={this.computerFailed}
        />
      </g>
    );
  }
}

export class Flaps extends DisplayComponent<PrimSecFlapsSlatsProps> {
  private infoAvailable = Subject.create(true);
  private computerFailed = Subject.create(false);

  render() {
    return (
      <g id="flap-computers" transform={`translate(${this.props.x} ${this.props.y})`}>
        <text class="F22 White MiddleAlign LS1" x={46} y={84}>
          FLAPS
        </text>
        <FctlComputerShape
          x={8}
          y={100}
          num={1}
          infoAvailable={this.infoAvailable}
          computerFailed={this.computerFailed}
        />
        <FctlComputerShape
          x={36}
          y={112}
          num={2}
          infoAvailable={this.infoAvailable}
          computerFailed={this.computerFailed}
        />
      </g>
    );
  }
}
