import { MathUtils } from '../../math/MathUtils';
import { ObjectSubject } from '../../sub/ObjectSubject';
import { SetSubject } from '../../sub/SetSubject';
import { Subject } from '../../sub/Subject';
import { Subscribable } from '../../sub/Subscribable';
import { SubscribableSet } from '../../sub/SubscribableSet';
import { Subscription } from '../../sub/Subscription';
import { ComponentProps, DisplayComponent, FSComponent, VNode } from '../FSComponent';

/**
 * Component props for DigitScroller.
 */
export interface DigitScrollerProps extends ComponentProps {
  /** The value to which the scroller is bound. */
  value: Subscribable<number>;

  /** The number base used by the scroller. Must be an integer greater than or equal to `3`. */
  base: number;

  /**
   * The factor represented by the scroller's digit. The factor relates the digit to its nominal value as
   * `value = digit * factor`. Cannot be `0`.
   */
  factor: number;

  /**
   * The amount the scroller's value must deviate from the current displayed digit's nominal value before the digit
   * begins to scroll. Defaults to `0`.
   */
  scrollThreshold?: number;

  /**
   * A function which renders each digit of the scroller to a text string. If not defined, each digit will be rendered
   * using the `Number.toString()` method.
   */
  renderDigit?: (digit: number) => string;

  /** The string to render when the scroller's value is `NaN`. Defaults to `–`. */
  nanString?: string;

  /** CSS class(es) to apply to the root of the digit scroller. */
  class?: string | SubscribableSet<string>;
}

/**
 * A scrolling digit display.
 */
export class DigitScroller extends DisplayComponent<DigitScrollerProps> {
  private readonly digitCount = (this.props.base + 2) * 2 + 1;
  private readonly translationPerDigit = 100 / this.digitCount;

  private readonly tapeStyle = ObjectSubject.create({
    display: '',
    position: 'absolute',
    left: '0',
    top: `calc(50% - var(--digit-scroller-line-height, 1em) * ${this.digitCount / 2})`,
    width: '100%',
    height: `calc(var(--digit-scroller-line-height, 1em) * ${this.digitCount})`,
    transform: 'translate3d(0, 0, 0)'
  });

  private readonly nanTextStyle = ObjectSubject.create({
    display: 'none',
    position: 'absolute',
    left: '0%',
    top: '50%',
    width: '100%',
    transform: 'translateY(-50%)'
  });

  private readonly digitPlaceFactor = this.props.factor;
  private readonly scrollThreshold = this.props.scrollThreshold ?? 0;

  private readonly translateY = Subject.create(0);

  private valueSub?: Subscription;
  private cssClassSub?: Subscription;

  /** @inheritdoc */
  constructor(props: DigitScrollerProps) {
    super(props);

    if (props.base < 3 || Math.floor(props.base) !== props.base) {
      throw new Error(`DigitScroller: invalid number base (${this.props.base})`);
    }
    if (props.factor === 0) {
      throw new Error(`DigitScroller: invalid factor (${props.factor})`);
    }
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    this.translateY.sub(translateY => {
      this.tapeStyle.set('transform', `translate3d(0, ${translateY}%, 0)`);
    });

    this.valueSub = this.props.value.sub(this.update.bind(this), true);
  }

  /**
   * Updates this display.
   * @param value This display's value.
   */
  private update(value: number): void {
    if (isNaN(value)) {
      this.nanTextStyle.set('display', '');
      this.tapeStyle.set('display', 'none');
      return;
    }

    this.nanTextStyle.set('display', 'none');
    this.tapeStyle.set('display', '');

    const base = this.props.base;

    const valueSign = value < 0 ? -1 : 1;
    const valueAbs = Math.abs(value);

    let pivot = Math.floor(valueAbs / this.digitPlaceFactor) * this.digitPlaceFactor;
    let digit = Math.floor(pivot / this.digitPlaceFactor) % base;

    let digitTranslate = (valueAbs - pivot) / this.digitPlaceFactor;
    const threshold = this.scrollThreshold / this.digitPlaceFactor;
    digitTranslate = (digitTranslate > threshold) ? (digitTranslate - threshold) / (1 - threshold) : 0;

    if (digitTranslate >= 0.5) {
      pivot += this.digitPlaceFactor;
      digit = (digit + 1) % base;
      digitTranslate -= 1;
    }

    let tapeTranslate = 0;

    if (pivot <= this.digitPlaceFactor) {
      tapeTranslate = (digit + digitTranslate) * valueSign * this.translationPerDigit;
    } else {
      tapeTranslate = (((digit + base - 2) % base + 2) + digitTranslate) * valueSign * this.translationPerDigit;
    }

    this.translateY.set(MathUtils.round(tapeTranslate, 0.1));
  }

  /** @inheritdoc */
  public render(): VNode {
    let cssClass: string | SetSubject<string>;

    if (this.props.class !== undefined && typeof this.props.class === 'object') {
      cssClass = SetSubject.create(['digit-scroller']);
      this.cssClassSub = FSComponent.bindCssClassSet(cssClass, this.props.class, ['digit-scroller']);
    } else {
      cssClass = `digit-scroller ${this.props.class ?? ''}`;
    }

    return (
      <div class={cssClass} style='overflow: hidden'>
        <div class='digit-scroller-digit-tape' style={this.tapeStyle}>
          {this.renderDigits()}
        </div>
        <div class='digit-scroller-nan' style={this.nanTextStyle}>{this.props.nanString ?? '–'}</div>
      </div>
    );
  }

  /**
   * Renders text for each of this display's individual digits.
   * @returns This display's individual digit text, as an array of VNodes.
   */
  private renderDigits(): VNode[] {
    const base = this.props.base;

    const renderFunc = this.props.renderDigit ?? ((digit: number): string => (Math.abs(digit) % base).toString());

    // Digits to render: -(base + 2), -(base + 1), -(base), -(base - 1), ... -1, 0, 1, ... , base - 1, base, base + 1, base + 2
    const zeroIndexOffset = base + 2;
    return Array.from({ length: this.digitCount }, (v, index): VNode => {
      const digit = zeroIndexOffset - index;

      return (
        <div style={`position: absolute; left: 0; top: ${50 + (index - zeroIndexOffset - 0.5) * this.translationPerDigit}%; width: 100%; height: ${this.translationPerDigit}%;`}>
          <span class='digit-scroller-digit' style='vertical-align: baseline;'>{renderFunc(digit)}</span>
        </div>
      );
    });
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.valueSub?.destroy();
    this.cssClassSub?.destroy();
  }
}