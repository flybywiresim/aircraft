import { NumberUnitInterface, Unit } from '../../utils/math/NumberUnit';
import { Subscribable } from '../../utils/Subscribable';
import { ComponentProps, DisplayComponent } from '../FSComponent';

/**
 * Component props for NumberUnitDisplay.
 */
export interface AbstractNumberUnitDisplayProps<F extends string> extends ComponentProps {
  /** A subscribable which provides a NumberUnit value to bind. */
  value: Subscribable<NumberUnitInterface<F>>;

  /**
   * A subscribable which provides a display unit type to bind. If the unit is null, then the native type of the bound
   * NumberUnit is used instead.
   */
  displayUnit: Subscribable<Unit<F> | null>;
}

/**
 * A component which displays a number with units.
 */
export abstract class AbstractNumberUnitDisplay<F extends string, P extends AbstractNumberUnitDisplayProps<F> = AbstractNumberUnitDisplayProps<F>> extends DisplayComponent<P> {
  private readonly valueChangedHandler = this.onValueChanged.bind(this);
  private readonly displayUnitChangedHandler = this.onDisplayUnitChanged.bind(this);

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.value.sub(this.valueChangedHandler, true);
    this.props.displayUnit.sub(this.displayUnitChangedHandler, true);
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

  // eslint-disable-next-line jsdoc/require-jsdoc
  public destroy(): void {
    this.props.value.unsub(this.valueChangedHandler);
    this.props.displayUnit.unsub(this.displayUnitChangedHandler);
  }
}