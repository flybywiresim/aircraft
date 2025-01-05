// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './RadioButtonGroup.scss';

interface RadioButtonGroupProps extends ComponentProps {
  values: string[];
  valuesDisabled?: Subscribable<boolean[]>;
  selectedIndex: Subject<number>;
  idPrefix: string;
  onModified?: (newSelectedIndex: number) => void;
  additionalVerticalSpacing?: number;
  tmpyActive?: Subscribable<boolean>;
}

export class RadioButtonGroup extends DisplayComponent<RadioButtonGroupProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.tmpyActive === undefined) {
      this.props.tmpyActive = Subject.create<boolean>(false);
    }
    if (this.props.valuesDisabled === undefined) {
      this.props.valuesDisabled = Subject.create<boolean[]>(this.props.values.map(() => false));
    }

    for (let i = 0; i < this.props.values.length; i++) {
      document.getElementById(`${this.props.idPrefix}_${i}`).addEventListener('change', () => {
        if (this.props.onModified) {
          this.props.onModified(i);
        } else {
          this.props.selectedIndex.set(i);
        }
      });
    }

    this.subs.push(
      this.props.selectedIndex.sub((val) => {
        for (let i = 0; i < this.props.values.length; i++) {
          if (i === val) {
            document.getElementById(`${this.props.idPrefix}_${i}`).setAttribute('checked', 'checked');
          } else {
            document.getElementById(`${this.props.idPrefix}_${i}`).removeAttribute('checked');
          }
        }
      }, true),
    );

    this.subs.push(
      this.props.valuesDisabled.sub((val) => {
        for (let i = 0; i < this.props.values.length; i++) {
          if (val[i] === true) {
            document.getElementById(`${this.props.idPrefix}_${i}`).setAttribute('disabled', 'disabled');
          } else {
            document.getElementById(`${this.props.idPrefix}_${i}`).removeAttribute('disabled');
          }
        }
      }, true),
    );

    this.subs.push(
      this.props.tmpyActive.sub((v) => {
        this.props.values.forEach((val, idx) => {
          if (v === true) {
            document.getElementById(`${this.props.idPrefix}_label_${idx}`).classList.add('tmpy');
          } else {
            document.getElementById(`${this.props.idPrefix}_label_${idx}`).classList.remove('tmpy');
          }
        });
      }, true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

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
            <input type="radio" name="entityType" id={`${this.props.idPrefix}_${idx}`} />
            <span>{el}</span>
          </label>
        ))}
      </form>
    );
  }
}
