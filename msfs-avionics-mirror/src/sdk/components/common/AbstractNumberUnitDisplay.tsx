import { NumberUnitInterface, Unit } from '../../math/NumberUnit';
import { Subject } from '../../sub/Subject';
import { Subscribable } from '../../sub/Subscribable';
import { Subscription } from '../../sub/Subscription';
import { ComponentProps, DisplayComponent } from '../FSComponent';

/**
 * Component props for AbstractNumberUnitDisplay.
 */
export interface AbstractNumberUnitDisplayProps<F extends string> extends ComponentProps {
  /** The {@link NumberUnitInterface} value to display, or a subscribable which provides it. */
  value: NumberUnitInterface<F> | Subscribable<NumberUnitInterface<F>>;

  /**
   * The unit type in which to display the value, or a subscribable which provides it. If the unit is `null`, then the
   * native type of the value is used instead.
   */
  displayUnit: Unit<F> | null | Subscribable<Unit<F> | null>;
}

/**
 * A component which displays a number with units.
 */
export abstract class AbstractNumberUnitDisplay<F extends string, P extends AbstractNumberUnitDisplayProps<F> = AbstractNumberUnitDisplayProps<F>> extends DisplayComponent<P> {
  /** A subscribable which provides the value to display. */
  protected readonly value: Subscribable<NumberUnitInterface<F>> = ('isSubscribable' in this.props.value)
    ? this.props.value
    : Subject.create(this.props.value);

  /** A subscribable which provides the unit type in which to display the value. */
  protected readonly displayUnit: Subscribable<Unit<F> | null> = this.props.displayUnit !== null && ('isSubscribable' in this.props.displayUnit)
    ? this.props.displayUnit
    : Subject.create(this.props.displayUnit);

  private valueSub?: Subscription;
  private displayUnitSub?: Subscription;

  /** @inheritdoc */
  public onAfterRender(): void {
    this.valueSub = this.value.sub(this.onValueChanged.bind(this), true);
    this.displayUnitSub = this.displayUnit.sub(this.onDisplayUnitChanged.bind(this), true);
  }

  /**
   * A callback which is called when this component's bound value changes.
   * @param value The new value.
   */
  protected abstract onValueChanged(value: NumberUnitInterface<F>): void;

  /**
   * A callback which is called when this component's bound display unit changes.
   * @param displayUnit The new display unit.
   */
  protected abstract onDisplayUnitChanged(displayUnit: Unit<F> | null): void;

  /** @inheritdoc */
  public destroy(): void {
    this.valueSub?.destroy();
    this.displayUnitSub?.destroy();
  }
}