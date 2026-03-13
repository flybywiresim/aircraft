//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  MutableSubscribable,
  Subject,
  Subscribable,
  SubscribableUtils,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

export enum RadioButtonColor {
  Yellow,
  Green,
  Amber,
  Cyan,
  White,
}

interface RadioButtonGroupProps extends ComponentProps {
  values: string[];
  valuesDisabled?: Subscribable<boolean[]>;
  selectedIndex: Subscribable<number | null> | MutableSubscribable<number | null>;
  idPrefix: string;
  /** If this function is defined, selectedIndex is not automatically updated. This function should take care of that. */
  onModified?: (newSelectedIndex: number) => void;
  additionalVerticalSpacing?: number;
  color?: Subscribable<RadioButtonColor>;
}
export class RadioButtonGroup extends DisplayComponent<RadioButtonGroupProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private readonly labelRefs = Array.from(Array(this.props.values.length), () =>
    FSComponent.createRef<HTMLLabelElement>(),
  );
  private readonly inputRefs = Array.from(Array(this.props.values.length), () =>
    FSComponent.createRef<HTMLLabelElement>(),
  );

  private changeEventHandler(i: number) {
    if (this.props.onModified) {
      this.props.onModified(i);
    } else if (SubscribableUtils.isMutableSubscribable(this.props.selectedIndex)) {
      this.props.selectedIndex.set(i);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.color === undefined) {
      this.props.color = Subject.create<RadioButtonColor>(RadioButtonColor.Cyan);
    }
    if (this.props.valuesDisabled === undefined) {
      this.props.valuesDisabled = Subject.create<boolean[]>(this.props.values.map(() => false));
    }

    this.inputRefs.forEach((ref, index) =>
      ref.instance.addEventListener('change', this.changeEventHandler.bind(this, index)),
    );

    this.subs.push(
      this.props.selectedIndex.sub((val) => {
        this.inputRefs.forEach((ref, index) => {
          if (index === val) {
            ref.instance.setAttribute('checked', 'checked');
          } else {
            ref.instance.removeAttribute('checked');
          }
        });
      }, true),
    );

    this.subs.push(
      this.props.valuesDisabled.sub((val) => {
        this.inputRefs.forEach((ref, index) => {
          if (val[index]) {
            ref.instance.setAttribute('disabled', 'disabled');
          } else {
            ref.instance.removeAttribute('disabled');
          }
        });
      }, true),
    );

    this.subs.push(
      this.props.color.sub((v) => {
        this.labelRefs.forEach((ref) => {
          ref.instance.classList.toggle('yellow', v === RadioButtonColor.Yellow);
          ref.instance.classList.toggle('green', v === RadioButtonColor.Green);
          ref.instance.classList.toggle('amber', v === RadioButtonColor.Amber);
          ref.instance.classList.toggle('cyan', v === RadioButtonColor.Cyan);
          ref.instance.classList.toggle('white', v === RadioButtonColor.White);
        });
      }, true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    this.inputRefs.forEach((ref, index) =>
      ref.instance.removeEventListener('change', this.changeEventHandler.bind(this, index)),
    );

    super.destroy();
  }

  render(): VNode {
    return (
      <form>
        {this.props.values.map((el, idx) => (
          <label
            ref={this.labelRefs[idx]}
            class="mfd-radio-button"
            htmlFor={`${this.props.idPrefix}_${idx}`}
            style={this.props.additionalVerticalSpacing ? `margin-top: ${this.props.additionalVerticalSpacing}px;` : ''}
            id={`${this.props.idPrefix}_label_${idx}`}
          >
            <input
              ref={this.inputRefs[idx]}
              type="radio"
              name={`${this.props.idPrefix}`}
              id={`${this.props.idPrefix}_${idx}`}
            />
            <span>{el}</span>
          </label>
        ))}
      </form>
    );
  }
}
