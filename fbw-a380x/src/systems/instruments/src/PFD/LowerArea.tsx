import { Arinc429Values } from 'instruments/src/PFD/shared/ArincValueProvider';
import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventSubscriber,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, MathUtils } from '@flybywiresim/fbw-sdk';
import { FwsPfdSimvars } from '../MsfsAvionicsCommon/providers/FwsPfdPublisher';
import { PFDSimvars } from 'instruments/src/PFD/shared/PFDSimvarPublisher';
import { EcamLimitations, EcamMemos } from '../MsfsAvionicsCommon/EcamMessages';
import { MemoFormatter } from 'instruments/src/PFD/MemoFormatter';

export class LowerArea extends DisplayComponent<{
  bus: ArincEventBus;
  pitchTrimIndicatorVisible: Subscribable<boolean>;
}> {
  render(): VNode {
    return (
      <g>
        <path class="ThickStroke White" d="M 2.1 157.7 h 154.4" />
        <path class="ThickStroke White" d="M 67 158 v 51.8" />

        <Memos bus={this.props.bus} />
        <FlapsIndicator bus={this.props.bus} />

        <Limitations bus={this.props.bus} visible={this.props.pitchTrimIndicatorVisible.map((it) => !it)} />
      </g>
    );
  }
}

const circlePath = (r: number, cx: number, cy: number) =>
  `M ${cx} ${cy} m ${r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0`;

class FlapsIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<ClockEvents & Arinc429Values & PFDSimvars>();

  private targetClass = Subject.create('');

  private targetText = Subject.create('');

  private readonly targetVisible = Subject.create('hidden');

  private readonly slatExtensionVisible = Subject.create('hidden');

  private readonly flapExtensionVisible = Subject.create('hidden');

  // FIXME don't use commanded position from just one spoiler + figure out whether it's averaged, or max-ed
  private readonly spoilersCommandedPosition = ConsumerSubject.create(
    this.sub.on('spoilersCommanded').whenChanged(),
    0,
  );

  private readonly spoilersArmed = ConsumerSubject.create(this.sub.on('spoilersArmed').whenChanged(), false);

  private readonly spoilerExtensionVisible = MappedSubject.create(
    ([pos, armed]) => (pos > 0.05 || armed ? 'visible' : 'hidden'),
    this.spoilersCommandedPosition,
    this.spoilersArmed,
  );

  private readonly speedBrakesStillExtended = Subject.create(false);

  private readonly speedBrakesPosDisagree = Subject.create(false);

  private slatIndexClass = Subject.create('');

  private flapIndexClass = Subject.create('');

  private targetBoxVisible = Subject.create('hidden');

  private slatsTargetPos = Subject.create(0);

  private flapsTargetPos = Subject.create(0);

  private slatsPath = Subject.create('');

  private slatsLinePath = Subject.create('');

  private flapsLinePath = Subject.create('');

  private flapsPath = Subject.create('');

  private readonly alphaLockEngaged = Subject.create(false);

  private readonly flapReliefEngaged = Subject.create(false);

  private readonly flapsFault = Subject.create(false);

  private readonly flapsDataValid = Subject.create(true);

  private readonly slatsFault = Subject.create(false);

  private readonly slatsDataValid = Subject.create(true);

  private configClean: boolean = false;

  private config1: boolean = false;

  private config2: boolean = false;

  private config3: boolean = false;

  private configFull: boolean = false;

  private flaps1AutoRetract: boolean = false;

  private slatsOut: boolean = false;

  private flapsOut: boolean = false;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub
      .on('slatsFlapsStatus')
      .whenChanged()
      .handle((s) => {
        this.configClean = s.bitValue(17);
        this.config1 = s.bitValue(18);
        this.config2 = s.bitValue(19);
        this.config3 = s.bitValue(20);
        this.configFull = s.bitValue(21);
        this.flaps1AutoRetract = s.bitValue(26);

        this.flapReliefEngaged.set(s.bitValue(22));
        this.alphaLockEngaged.set(s.bitValue(24));

        this.slatsFault.set(s.bitValue(11));
        this.flapsFault.set(s.bitValue(12));

        this.slatsDataValid.set(s.bitValue(28));
        this.flapsDataValid.set(s.bitValue(29));

        if (this.configClean) {
          this.targetText.set('0');
        } else if (this.config1 && this.flaps1AutoRetract) {
          this.targetText.set('1');
        } else if (this.config1) {
          this.targetText.set('1+F');
        } else if (this.config2) {
          this.targetText.set('2');
        } else if (this.config3) {
          this.targetText.set('3');
        } else if (this.configFull) {
          this.targetText.set('FULL');
        } else {
          this.targetText.set('');
        }
      });

    this.sub
      .on('slatsPosition')
      .whenChanged()
      .handle((s) => {
        const slats = s.valueOr(0);

        this.slatsOut = slats > 6.1;

        // Slats and flaps should align with future implementation; do not change
        const xFactor = -0.43;
        const yFactor = 0.09;
        const synchroFactor = 0.081;

        let synchroOffset = 0;
        let positionFactor = 0;
        let positionOffset = 0;
        if (slats >= 0 && slats < 247.1) {
          synchroOffset = 0;
          positionFactor = 0.57;
          positionOffset = 0;
        } else if (slats >= 247.1 && slats < 355) {
          synchroOffset = 20.02;
          positionFactor = 3.7;
          positionOffset = 11.5;
        }

        const value = (slats * synchroFactor - synchroOffset) * positionFactor + positionOffset;
        const x = xFactor * value + 15.2;
        const y = yFactor * value + 195.3;
        this.slatsPath.set(`M ${x},${y} a 0.2 0.2 0 0 1 -1.3 -1.9 l 1.4 -0.7 z`);
        this.slatsLinePath.set(`M 15.2 195.4 L ${x},${y}`);

        if (this.configClean && slats > 6.1) {
          this.slatsTargetPos.set(0);
        } else if ((this.config1 || this.config2) && (slats < 234.92 || slats > 259.62)) {
          this.slatsTargetPos.set(1);
        } else if ((this.config3 || this.configFull) && (slats < 272.3 || slats > 297.0)) {
          this.slatsTargetPos.set(2);
        } else {
          this.slatsTargetPos.set(null);
        }
      });

    this.sub
      .on('flapsPosition')
      .whenChanged()
      .handle((s) => {
        const flaps = s.valueOr(0);

        this.flapsOut = flaps > 54.0;

        // Slats and flaps should align with future implementation; do not change
        const xFactor = 0.87;
        const yFactor = 0.365;
        const synchroFactor = 0.22;
        const synchroConstant = 15.88;

        let synchroOffset = 0;
        let positionFactor = 0;
        let positionOffset = 0;
        if (flaps >= 0 && flaps < 108.2) {
          synchroOffset = 0;
          positionFactor = 1.1;
          positionOffset = 0;
        } else if (flaps >= 108.2 && flaps < 154.5) {
          synchroOffset = 7.92;
          positionFactor = 0.85;
          positionOffset = 8.7;
        } else if (flaps >= 154.5 && flaps < 194.0) {
          synchroOffset = 18.11;
          positionFactor = 1.0;
          positionOffset = 17.4;
        } else if (flaps >= 194.0 && flaps < 355) {
          synchroOffset = 26.8;
          positionFactor = 1.55;
          positionOffset = 26.1;
        }

        const value = Math.max(
          (flaps * synchroFactor - synchroConstant - synchroOffset) * positionFactor + positionOffset,
          0,
        );
        const x = xFactor * value + 31.8;
        const y = yFactor * value + 193.1;
        this.flapsPath.set(`M${x},${y} v 2.6 h 3.9 z`);
        this.flapsLinePath.set(`M 31.8 193.1 L ${x},${y}`);

        if ((this.configClean || this.flaps1AutoRetract) && flaps > 54.0) {
          this.flapsTargetPos.set(0);
        } else if (this.config1 && !this.flaps1AutoRetract && (flaps < 103.7 || flaps > 112.8)) {
          this.flapsTargetPos.set(1);
        } else if (this.config2 && (flaps < 150.1 || flaps > 159.2)) {
          this.flapsTargetPos.set(2);
        } else if (this.config3 && (flaps < 189.5 || flaps > 198.6)) {
          this.flapsTargetPos.set(3);
        } else if (this.configFull && (flaps < 214.3 || flaps > 223.4)) {
          this.flapsTargetPos.set(4);
        } else {
          this.flapsTargetPos.set(null);
        }
      });

    this.sub.on('realTime').handle((_t) => {
      const inMotion = this.flapsTargetPos.get() !== null || this.slatsTargetPos.get() !== null;
      this.targetVisible.set(this.slatsOut || this.flapsOut || !this.configClean ? 'visible' : 'hidden');
      this.flapExtensionVisible.set(
        (this.flapsOut || !this.configClean) && this.flapsDataValid.get() ? 'visible' : 'hidden',
      );
      this.slatExtensionVisible.set(
        (this.slatsOut || !this.configClean) && this.flapsDataValid.get() ? 'visible' : 'hidden',
      );

      if (this.slatsFault.get()) {
        this.slatIndexClass.set('NormalStroke Amber CornerRound');
      } else if (this.slatsOut || this.flapsOut || !this.configClean) {
        this.slatIndexClass.set('NormalStroke Green CornerRound');
      } else {
        this.slatIndexClass.set('NormalStroke White CornerRound');
      }

      if (this.flapsFault.get()) {
        this.flapIndexClass.set('NormalStroke Amber CornerRound');
      } else if (this.slatsOut || this.flapsOut || !this.configClean) {
        this.flapIndexClass.set('NormalStroke Green CornerRound');
      } else {
        this.flapIndexClass.set('NormalStroke White CornerRound');
      }

      this.targetClass.set(inMotion ? 'FontMedium Cyan MiddleAlign' : 'FontMedium Green MiddleAlign');
      this.targetBoxVisible.set(inMotion ? 'visible' : 'hidden');
    });
  }

  spoilersLogFn(x: number) {
    return Math.min(90, 90 / (1 + Math.exp(-x + 17) ** 0.28));
  }

  render(): VNode {
    return (
      <g>
        <g visibility={this.targetVisible}>
          <text x={23.7} y={202.3} class={this.targetClass}>
            {this.targetText}
          </text>
          <path
            visibility={this.targetBoxVisible}
            class="NormalStroke Cyan CornerRound"
            d="M 15.4 196.8 v 6.2 h 16.2 v -6.2 z"
          />
        </g>

        <g visibility={this.slatExtensionVisible}>
          <path
            d={circlePath(0.8, 14.1, 194.5)}
            class="NormalStroke Stroke Fill Cyan"
            visibility={this.slatsTargetPos.map((i) => (i === 0 ? 'inherit' : 'hidden'))}
          />
          <path
            d={circlePath(0.8, 9.6, 195.4)}
            class={this.slatsTargetPos.map((i) => (i === 1 ? 'NormalStroke Stroke Fill Cyan' : 'NormalStroke White'))}
          />
          <path
            d={circlePath(0.8, 5, 196.4)}
            class={this.slatsTargetPos.map((i) => (i === 2 ? 'NormalStroke Stroke Fill Cyan' : 'NormalStroke White'))}
          />

          <text
            x={3.8}
            y={191.1}
            class={this.slatsFault.get() ? 'FontSmall Amber' : 'FontSmall White'}
            visibility={this.alphaLockEngaged.map((v) => (v ? 'hidden' : 'inherit'))}
          >
            S
          </text>
        </g>

        <g visibility={this.flapExtensionVisible}>
          <path
            d="M 32.3 193.7 v 1.7 h 1.9 z"
            class="Fill Stroke NormalStroke Cyan CornerRound"
            visibility={this.flapsTargetPos.map((i) => (i === 0 ? 'inherit' : 'hidden'))}
          />
          <path
            d="M 39.9 196.8 v 1.7 h 1.9 z"
            class={this.flapsTargetPos.map((i) =>
              i === 1 ? 'Fill Stroke NormalStroke Cyan CornerRound' : 'Fill Stroke NormalStroke White CornerRound',
            )}
          />
          <path
            d="M 47.3 199.9 v 1.7 h 1.9 z"
            class={this.flapsTargetPos.map((i) =>
              i === 2 ? 'Fill Stroke NormalStroke Cyan CornerRound' : 'Fill Stroke NormalStroke White CornerRound',
            )}
          />
          <path
            d="M 54.7 203 v 1.7 h 1.9 z"
            class={this.flapsTargetPos.map((i) =>
              i === 3 ? 'Fill Stroke NormalStroke Cyan CornerRound' : 'Fill Stroke NormalStroke White CornerRound',
            )}
          />
          <path
            d="M 62.1 206.1 v 1.7 h 1.9 z"
            class={this.flapsTargetPos.map((i) =>
              i === 4 ? 'Fill Stroke NormalStroke Cyan CornerRound' : 'Fill Stroke NormalStroke White CornerRound',
            )}
          />

          <text
            x={47.2}
            y={210.8}
            class={this.flapsFault.get() ? 'FontSmall Amber' : 'FontSmall White'}
            visibility={this.flapReliefEngaged.map((v) => (v ? 'hidden' : 'inherit'))}
          >
            F
          </text>
        </g>
        <text
          class="GreenPulse FontSmallest"
          x={0}
          y={190}
          visibility={this.alphaLockEngaged.map((v) => (v ? 'inherit' : 'hidden'))}
        >
          A LOCK
        </text>
        <text
          class="GreenPulse FontSmallest"
          x={38}
          y={190}
          visibility={this.flapReliefEngaged.map((v) => (v ? 'inherit' : 'hidden'))}
        >
          F RELIEF
        </text>

        <text
          class="Amber FontSmallest"
          x={9}
          y={195.5}
          visibility={this.slatsDataValid.map((v) => (v ? 'hidden' : 'inherit'))}
        >
          XX
        </text>
        <text
          class="Amber FontSmallest"
          x={32.6}
          y={195.5}
          visibility={this.flapsDataValid.map((v) => (v ? 'hidden' : 'inherit'))}
        >
          XX
        </text>

        <path
          class={this.slatIndexClass}
          d={this.slatsPath}
          visibility={this.slatsDataValid.map((v) => (v ? 'visible' : 'hidden'))}
        />
        <path class={this.slatIndexClass} d={this.slatsLinePath} />

        <path
          class={this.flapIndexClass}
          d={this.flapsPath}
          visibility={this.flapsDataValid.map((v) => (v ? 'visible' : 'hidden'))}
        />
        <path class={this.flapIndexClass} d={this.flapsLinePath} />

        <path
          class="NormalStroke White CornerRound"
          d="M 15.2 195.5 h 12.4 l 4.1 0.2 l -0.1 -2.6 l -4 -0.9 l -2 -0.3 l -3 -0.1 l -3.5 0.1 l -3.8 0.8 z"
        />

        <g visibility={this.spoilerExtensionVisible}>
          <path
            d="M 25.3 187.5 l 2.1 -3"
            class={this.speedBrakesPosDisagree.map((it) =>
              it ? 'NormalStroke Amber CornerRound' : 'NormalStroke White CornerRound',
            )}
          />
          <path
            d="M 27.5 189 l 3.1 -1.8"
            class={this.speedBrakesPosDisagree.map((it) =>
              it ? 'NormalStroke Amber CornerRound' : 'NormalStroke White CornerRound',
            )}
          />
          <path
            d={this.spoilersCommandedPosition.map(
              (p) =>
                `M 23 191.6 l ${5 * Math.cos(this.spoilersLogFn(p) * MathUtils.DEGREES_TO_RADIANS)} ${-5 * Math.sin(this.spoilersLogFn(p) * MathUtils.DEGREES_TO_RADIANS)}`,
            )}
            class={this.speedBrakesStillExtended.map((it) =>
              it ? 'NormalStroke Amber CornerRound' : 'NormalStroke Green CornerRound',
            )}
            visibility={this.spoilersCommandedPosition.map((p) => (p >= 0.05 ? 'inherit' : 'hidden'))}
          />
          <path
            d="M 21.6 183.5 h 3 l -1.5 3 z"
            class="Fill Stroke NormalStroke Cyan CornerRound"
            visibility={this.spoilersArmed.map((a) => (a ? 'inherit' : 'hidden'))}
          />
        </g>
        <GearIndicator bus={this.props.bus} />
      </g>
    );
  }
}

class GearIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private landingGearDownAndLocked = Subject.create('hidden');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<Arinc429Values>();

    // TODO change to proper LGCIS input once LGCIS is implemented
    sub.on('lgciuDiscreteWord1').handle((word) => {
      const gearDownAndLocked = word.bitValue(23) && word.bitValue(24) && word.bitValue(25);
      this.landingGearDownAndLocked.set(gearDownAndLocked ? 'visible' : 'hidden');
    });
  }

  render(): VNode {
    return (
      <g visibility={this.landingGearDownAndLocked}>
        <path
          class="NormalStroke Green CornerRound"
          d="M 18.4 204.3 h 10 l -5 5.5 z M 20.9 204.3 v 2.6 M 23.4 204.3 v 5.5 M 25.9 204.3 v 2.6"
        />
      </g>
    );
  }
}

class Limitations extends DisplayComponent<{ bus: ArincEventBus; visible: Subscribable<boolean> }> {
  private readonly sub = this.props.bus.getSubscriber<FwsPfdSimvars>();

  private static lineSubject(index: number, sub: EventSubscriber<FwsPfdSimvars>) {
    return ConsumerSubject.create(sub.on(`limitations_line_${index}`).whenChanged(), 0).map(
      (it) => EcamLimitations[padMemoCode(it)] ?? '',
    );
  }

  private readonly limitationsLine = [
    Limitations.lineSubject(1, this.sub),
    Limitations.lineSubject(2, this.sub),
    Limitations.lineSubject(3, this.sub),
    Limitations.lineSubject(4, this.sub),
    Limitations.lineSubject(5, this.sub),
    Limitations.lineSubject(6, this.sub),
    Limitations.lineSubject(7, this.sub),
    Limitations.lineSubject(8, this.sub),
  ];

  render(): VNode {
    return (
      <g visibility={this.props.visible.map((it) => (it ? 'visible' : 'hidden'))}>
        {this.limitationsLine.map((line, index) => (
          <MemoFormatter x={70} y={165 + index * 7} message={line} />
        ))}
      </g>
    );
  }
}

const padMemoCode = (code: number) => code.toString().padStart(9, '0');
class Memos extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getSubscriber<FwsPfdSimvars>();

  private readonly memoLine1 = ConsumerSubject.create(this.sub.on('memo_line_1').whenChanged(), 0).map(
    (it) => EcamMemos[padMemoCode(it)] ?? '',
  );

  private readonly memoLine2 = ConsumerSubject.create(this.sub.on('memo_line_2').whenChanged(), 0).map(
    (it) => EcamMemos[padMemoCode(it)] ?? '',
  );

  private readonly memoLine3 = ConsumerSubject.create(this.sub.on('memo_line_3').whenChanged(), 0).map(
    (it) => EcamMemos[padMemoCode(it)] ?? '',
  );

  render(): VNode {
    return (
      <g>
        <MemoFormatter x={4} y={165} message={this.memoLine1} />
        <MemoFormatter x={4} y={172} message={this.memoLine2} />
        <MemoFormatter x={4} y={179} message={this.memoLine3} />
      </g>
    );
  }
}
