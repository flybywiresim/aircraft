import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import './style.scss';

type RADIO_BUTTON_COLOR = 'yellow' | 'green' | 'cyan' | 'white';

interface RadioButtonGroupProps extends ComponentProps {
  values: string[];
  valuesDisabled?: Subscribable<boolean[]>;
  selectedIndex: Subject<number | null>;
  idPrefix: string;
  /** If this function is defined, selectedIndex is not automatically updated. This function should take care of that. */
  onModified?: (newSelectedIndex: number) => void;
  additionalVerticalSpacing?: number;
  color?: Subscribable<RADIO_BUTTON_COLOR>;
}
export class RadioButtonGroup extends DisplayComponent<RadioButtonGroupProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private changeEventHandler(i: number) {
    if (this.props.onModified) {
      this.props.onModified(i);
    } else {
      this.props.selectedIndex.set(i);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.color === undefined) {
      this.props.color = Subject.create<RADIO_BUTTON_COLOR>('cyan');
    }
    if (this.props.valuesDisabled === undefined) {
      this.props.valuesDisabled = Subject.create<boolean[]>(this.props.values.map(() => false));
    }

    for (let i = 0; i < this.props.values.length; i++) {
      document
        .getElementById(`${this.props.idPrefix}_${i}`)
        ?.addEventListener('change', this.changeEventHandler.bind(this, i));
    }

    this.subs.push(
      this.props.selectedIndex.sub((val) => {
        for (let i = 0; i < this.props.values.length; i++) {
          if (i === val) {
            document.getElementById(`${this.props.idPrefix}_${i}`)?.setAttribute('checked', 'checked');
          } else {
            document.getElementById(`${this.props.idPrefix}_${i}`)?.removeAttribute('checked');
          }
        }
      }, true),
    );

    this.subs.push(
      this.props.valuesDisabled.sub((val) => {
        for (let i = 0; i < this.props.values.length; i++) {
          if (val[i]) {
            document.getElementById(`${this.props.idPrefix}_${i}`)?.setAttribute('disabled', 'disabled');
          } else {
            document.getElementById(`${this.props.idPrefix}_${i}`)?.removeAttribute('disabled');
          }
        }
      }, true),
    );

    this.subs.push(
      this.props.color.sub((v) => {
        this.props.values.forEach((val, idx) => {
          document.getElementById(`${this.props.idPrefix}_label_${idx}`)?.classList.remove('yellow');
          document.getElementById(`${this.props.idPrefix}_label_${idx}`)?.classList.remove('green');
          document.getElementById(`${this.props.idPrefix}_label_${idx}`)?.classList.remove('cyan');
          document.getElementById(`${this.props.idPrefix}_label_${idx}`)?.classList.remove('white');

          document.getElementById(`${this.props.idPrefix}_label_${idx}`)?.classList.add(v);
        });
      }, true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    for (let i = 0; i < this.props.values.length; i++) {
      document
        .getElementById(`${this.props.idPrefix}_${i}`)
        ?.removeEventListener('change', this.changeEventHandler.bind(this, i));
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <form>
        {this.props.values.map((el, idx) => (
          <label
            class="mfd-radio-button"
            htmlFor={`${this.props.idPrefix}_${idx}`}
            style={this.props.additionalVerticalSpacing ? `margin-top: ${this.props.additionalVerticalSpacing}px;` : ''}
            id={`${this.props.idPrefix}_label_${idx}`}
          >
            <input type="radio" name={`${this.props.idPrefix}`} id={`${this.props.idPrefix}_${idx}`} />
            <span>{el}</span>
          </label>
        ))}
      </form>
    );
  }
}
