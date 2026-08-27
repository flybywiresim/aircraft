import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429ConsumerSubject, Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';

import { calculateHorizonOffsetFromPitch, HudElems } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { ONE_DEG, FIVE_DEG, OutlinedPath } from './HUDUtils';
import { SelectedFdEvents } from './shared/FdSelectionProvider';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { FlashOneHertz } from '../MsfsAvionicsCommon/FlashingElementUtils';
const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

export class FlightPathDirector extends DisplayComponent<{ bus: EventBus; isAttExcessive: Subscribable<boolean> }> {
  private readonly sub = this.props.bus.getSubscriber<
    Arinc429Values & SelectedFdEvents & PrimFgBusBaseEvents & HUDSimvars & HudElems
  >();

  private readonly fdRollCommand = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_roll_fd_command'));

  private readonly fdPitchCommand = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_pitch_fd_command'));

  private readonly fdYawCommand = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_yaw_fd_command'));

  private readonly fdActive = ConsumerSubject.create(this.sub.on('fd_engaged'), false);

  private readonly leftMainGearCompressed = ConsumerSubject.create(this.sub.on('leftMainGearCompressed'), false);

  private readonly rightMainGearCompressed = ConsumerSubject.create(this.sub.on('leftMainGearCompressed'), false);
  private readonly fwcFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);
  private readonly crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode'), false);

  private readonly roll = Arinc429ConsumerSubject.create(this.sub.on('rollAr'));
  private readonly pitch = Arinc429ConsumerSubject.create(this.sub.on('pitchAr'));
  private readonly fpa = Arinc429ConsumerSubject.create(this.sub.on('fpa'));
  private readonly da = Arinc429ConsumerSubject.create(this.sub.on('da'));

  private flightPhase = 0;

  private needsUpdate = false;

  private birdPath = FSComponent.createRef<SVGGElement>();

  private birdPathCircle = FSComponent.createRef<SVGPathElement>();
  private birdPathCircleBg = FSComponent.createRef<SVGPathElement>();

  private readonly onGround = MappedSubject.create(
    ([leftMainGearCompressed, rightMainGearCompressed]) => leftMainGearCompressed || rightMainGearCompressed,
    this.leftMainGearCompressed,
    this.rightMainGearCompressed,
  );

  private readonly fdVisible = MappedSubject.create(
    ([fdRollCommand, fdPitchCommand, fwcFlightPhase]) => {
      if (fwcFlightPhase < 4 || fwcFlightPhase >= 10) {
        return 'none';
      } else {
        if (
          !(fdRollCommand.isNoComputedData() || fdRollCommand.isFailureWarning()) &&
          !(fdPitchCommand.isNoComputedData() || fdPitchCommand.isFailureWarning())
        ) {
          return 'block';
        } else {
          return 'none';
        }
      }
    },
    this.fdRollCommand,
    this.fdPitchCommand,
    this.fwcFlightPhase,
  );

  private readonly fdFlagVisible = MappedSubject.create(
    ([fdActive, fdPitchCommand, fdRollCommand, fdYawCommand, onGround]) =>
      fdActive &&
      (fdRollCommand.isFailureWarning() ||
        fdPitchCommand.isFailureWarning() ||
        (fdYawCommand.isFailureWarning() && onGround)),
    this.fdActive,
    this.fdPitchCommand,
    this.fdRollCommand,
    this.fdYawCommand,
    this.onGround,
  );

  private readonly fdTransform = MappedSubject.create(
    ([roll, pitch, fpa, da, fdRollCommand, fdPitchCommand, crosswindMode]) => {
      let xOffsetLim;

      const daLimConv = (da.value * DistanceSpacing) / ValueSpacing;
      const pitchSubFpaConv = calculateHorizonOffsetFromPitch(pitch.value) - calculateHorizonOffsetFromPitch(fpa.value);
      const rollCos = Math.cos((roll.value * Math.PI) / 180);
      const rollSin = Math.sin((-roll.value * Math.PI) / 180);

      const FDRollOrder = fdRollCommand.value;
      const FDRollOrderLim = Math.max(Math.min(FDRollOrder, 45), -45);
      const FDPitchOrder = fdPitchCommand.value; //in degrees on pitch scale
      const FDPitchOrderLim = Math.max(Math.min(FDPitchOrder, 45), -45);

      const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;
      const yOffsetFpv = pitchSubFpaConv * rollCos + daLimConv * rollSin;

      const xOffset = xOffsetFpv + FDRollOrderLim * 13;
      const yOffset = yOffsetFpv + FDPitchOrderLim * 13 + rollSin * (xOffset - xOffsetFpv); // * rollCos;

      //set lateral limit for fdCue
      if (crosswindMode == false) {
        xOffsetLim = Math.max(Math.min(xOffset, 350), -378);
      } else {
        xOffsetLim = Math.max(Math.min(xOffset, 540), -540);
      }

      return `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;
    },
    this.roll,
    this.pitch,
    this.fpa,
    this.da,
    this.fdRollCommand,
    this.fdPitchCommand,
    this.crosswindMode,
  );

  private readonly fdCueOffRange = MappedSubject.create(
    ([roll, pitch, fpa, da, fdRollCommand, crosswindMode]) => {
      let fdCueOffRange;
      const daLimConv = (da.value * DistanceSpacing) / ValueSpacing;
      const pitchSubFpaConv = calculateHorizonOffsetFromPitch(pitch.value) - calculateHorizonOffsetFromPitch(fpa.value);

      const FDRollOrder = fdRollCommand.value;
      const FDRollOrderLim = Math.max(Math.min(FDRollOrder, 45), -45);
      const rollCos = Math.cos((roll.value * Math.PI) / 180);
      const rollSin = Math.sin((-roll.value * Math.PI) / 180);
      const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;

      const xOffset = xOffsetFpv + FDRollOrderLim * 13;
      //set lateral limit for fdCue
      if (crosswindMode == false) {
        if (xOffset < -378 || xOffset > 350) {
          fdCueOffRange = true;
        } else {
          fdCueOffRange = false;
        }
      } else {
        if (xOffset < -540 || xOffset > 540) {
          fdCueOffRange = true;
        } else {
          fdCueOffRange = false;
        }
      }
      return fdCueOffRange ? '3 6' : '';
    },
    this.roll,
    this.pitch,
    this.fpa,
    this.da,
    this.fdRollCommand,
    this.crosswindMode,
  );

  render(): VNode {
    return (
      <>
        <g ref={this.birdPath}>
          <svg>
            <g id="FlightPathDirector" display={this.fdVisible}>
              <g style={{ transform: this.fdTransform }}>
                {OutlinedPath(
                  'M 640 512 m 7 0 a 7 7 0 1 0 -14 0 a 7 7 0 1 0 14 0 Z M 640 512 m 7 0 a 7 7 0 1 0 -14 0 a 7 7 0 1 0 14 0 Z',
                  'NormalStroke InverseGreen',
                  'NormalStroke Green',
                  this.birdPathCircleBg,
                  this.birdPathCircle,
                  this.fdCueOffRange.get(),
                )}
              </g>
            </g>
          </svg>
        </g>

        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.fdFlagVisible}>
          <text id="FDFlag" x="265" y="280" class="FontLargest EndAlign Green">
            FD
          </text>
        </FlashOneHertz>
      </>
    );
  }
}
