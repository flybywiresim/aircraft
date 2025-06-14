import { EventBus, Instrument, Subject, ClockEvents, FSComponent } from '@microsoft/msfs-sdk';
import { getDisplayIndex } from 'instruments/src/HUD/HUD';
import { HUDSimvars } from './HUDSimvarPublisher';
import { getBitMask, HudElemsValues, HudElemsValuesStr } from '../HUDUtils';
import { AutoThrustMode } from '@shared/autopilot';
export class HudValueProvider implements Instrument {
  elemVis: HudElemsValuesStr;

  private declutterMode = 0;
  private crosswindMode = false;
  private athMode = 0;
  private onToPower = false;

  private onGround = Subject.create(true);

  private leftMainGearCompressed: boolean;

  private rightMainGearCompressed: boolean;
  private elems2: HudElemsValues;
  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<HudElemsValues>();
    const subscriber = this.bus.getSubscriber<HUDSimvars & ClockEvents>();

    const isCaptainSide = getDisplayIndex() === 1;

    subscriber.on('realTime').handle((_t) => {
      this.elems2 = setElems(this.onToPower, this.onGround.get(), this.crosswindMode, this.declutterMode);
      publisher.pub('spdTapeOrForcedOnLand', this.elems2.spdTapeOrForcedOnLand);
      publisher.pub('xWindSpdTape', this.elems2.xWindSpdTape);
      publisher.pub('altTape', this.elems2.altTape);
      publisher.pub('xWindAltTape', this.elems2.xWindAltTape);
      publisher.pub('altTapeMaskFill', this.elems2.altTapeMaskFill);
      publisher.pub('windIndicator', this.elems2.windIndicator);
      publisher.pub('FMA', this.elems2.FMA);
      publisher.pub('VS', this.elems2.VS);
      publisher.pub('QFE', this.elems2.QFE);
      publisher.pub('pitchScale', this.elems2.pitchScale);
    });

    subscriber
      .on('AThrMode')
      .whenChanged()
      .handle((value) => {
        this.athMode = value;
        this.athMode == AutoThrustMode.MAN_FLEX ||
        this.athMode == AutoThrustMode.MAN_TOGA ||
        this.athMode == AutoThrustMode.TOGA_LK
          ? (this.onToPower = true)
          : (this.onToPower = false);
        setElems(this.onToPower, this.onGround.get(), this.crosswindMode, this.declutterMode);
      });

    subscriber
      .on(isCaptainSide ? 'declutterModeL' : 'declutterModeR')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        setElems(this.onToPower, this.onGround.get(), this.crosswindMode, this.declutterMode);
      });
    subscriber
      .on(isCaptainSide ? 'crosswindModeL' : 'crosswindModeR')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
        setElems(this.onToPower, this.onGround.get(), this.crosswindMode, this.declutterMode);
      });
    subscriber
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.leftMainGearCompressed = g;
        this.onGround.set(this.rightMainGearCompressed || g);
        setElems(this.onToPower, this.onGround.get(), this.crosswindMode, this.declutterMode);
      });

    subscriber
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.rightMainGearCompressed = g;
        this.onGround.set(this.leftMainGearCompressed || g);
      });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
export function setElems(
  onToPower: boolean,
  onGround: boolean,
  crosswindMode: boolean,
  declutterMode: number,
): HudElemsValues {
  const elems: HudElemsValues = {
    xWindAltTape: Subject.create<String>(''),
    altTape: Subject.create<String>(''),
    xWindSpdTape: Subject.create<String>(''),
    spdTapeOrForcedOnLand: Subject.create<String>(''),
    altTapeMaskFill: Subject.create<String>(''),
    windIndicator: Subject.create<String>(''),
    FMA: Subject.create<String>(''),
    VS: Subject.create<String>(''),
    QFE: Subject.create<String>(''),
    pitchScale: Subject.create<String>(''),
  };

  elems.altTape.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).altTape);
  elems.altTapeMaskFill.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).altTapeMaskFill);
  elems.spdTapeOrForcedOnLand.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).spdTapeOrForcedOnLand);
  elems.windIndicator.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).windIndicator);
  elems.xWindAltTape.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).xWindAltTape);
  elems.xWindSpdTape.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).xWindSpdTape);
  elems.FMA.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).FMA);
  elems.VS.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).VS);
  elems.QFE.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).QFE);
  elems.pitchScale.set(getBitMask(onToPower, onGround, crosswindMode, declutterMode).pitchScale);
  return elems;
}

///// Backup

// private spdTapeOrForcedOnLand = '';
// private xWindSpdTape = '';
// private altTape = '';
// private xWindAltTape = '';
// private altTapeMaskFill = '';
// private windIndicator = '';
// private FMA = '';
// private VS = '';
// private QFE = '';
// private pitchScale = 0;

// private spdTapeOrForcedOnLandRef = FSComponent.createRef<SVGGElement>();
// private xWindSpdTapeRef = FSComponent.createRef<SVGGElement>();
// private altTapeRef = FSComponent.createRef<SVGGElement>();
// private xWindAltTapeRef = FSComponent.createRef<SVGGElement>();
// private altTapeMaskFillRef = FSComponent.createRef<SVGGElement>();
// private windIndicatorRef = FSComponent.createRef<SVGGElement>();
// private FMARef = FSComponent.createRef<SVGGElement>();
// private VSRef = FSComponent.createRef<SVGGElement>();
// private QFERef = FSComponent.createRef<SVGGElement>();
// private pitchScaleRef = FSComponent.createRef<SVGGElement>();

// sub.on('spdTapeOrForcedOnLand').handle((v) => {
//   this.spdTapeOrForcedOnLand = v.get().toString();
//   this.spdTapeOrForcedOnLandRef.instance.style.display = `${this.spdTapeOrForcedOnLand}`;
//   //console.log('qsdqsd   ' + this.spdTapeOrForcedOnLand);
// });
// sub.on('xWindSpdTape').handle((v) => {
//   this.xWindSpdTape = v.get().toString();
//   this.xWindSpdTapeRef.instance.style.display = `${this.xWindSpdTape}`;
// });
// sub.on('altTape').handle((v) => {
//   this.altTape = v.get().toString();
//   this.altTapeRef.instance.style.display = `${this.altTape}`;
// });
// sub.on('xWindAltTape').handle((v) => {
//   this.xWindAltTape = v.get().toString();
//   this.xWindAltTapeRef.instance.style.display = `${this.xWindAltTape}`;
// });
// sub.on('altTapeMaskFill').handle((v) => {
//   this.altTapeMaskFill = v.get().toString();
//   this.altTapeMaskFillRef.instance.style.display = `${this.altTapeMaskFill}`;
// });
// sub.on('windIndicator').handle((v) => {
//   this.windIndicator = v.get().toString();
//   this.windIndicatorRef.instance.style.display = `${this.windIndicator}`;
// });
// sub.on('FMA').handle((v) => {
//   this.FMA = v.get().toString();
//   this.FMARef.instance.style.display = `${this.FMA}`;
// });
// sub.on('VS').handle((v) => {
//   this.VS = v.get().toString();
//   this.VSRef.instance.style.display = `${this.VS}`;
// });
// sub.on('QFE').handle((v) => {
//   this.QFE = v.get().toString();
//   this.QFERef.instance.style.display = `${this.QFE}`;
// });
