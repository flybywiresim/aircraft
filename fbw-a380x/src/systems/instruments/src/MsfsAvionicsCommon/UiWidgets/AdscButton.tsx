//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

export interface AdscButtonProps extends ComponentProps {
  /** True = Upper state; False = Lower state */
  state: Subscribable<boolean>;
  /** Upper label */
  labelTrue: string;
  /** Lower label */
  labelFalse: string;
  disabled?: Subscribable<boolean>;
  buttonStyle?: string;
  onChanged(val: boolean): void;
}

/*
 * Button for MFD pages. If menuItems is set, a dropdown menu will be displayed when button is clicked
 */
export class AdscButton extends DisplayComponent<AdscButtonProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly upperLabelGreen = MappedSubject.create(
    ([state, disabled]) => state && !disabled,
    this.props.state,
    this.props.disabled ?? Subject.create(false),
  );

  private readonly upperLabelHidden = MappedSubject.create(
    ([state, disabled]) => !state && disabled,
    this.props.state,
    this.props.disabled ?? Subject.create(false),
  );

  private readonly lowerLabelGreen = MappedSubject.create(
    ([state, disabled]) => !state && !disabled,
    this.props.state,
    this.props.disabled ?? Subject.create(false),
  );

  private readonly lowerLabelHidden = MappedSubject.create(
    ([state, disabled]) => state && disabled,
    this.props.state,
    this.props.disabled ?? Subject.create(false),
  );

  private onClick() {
    if (!this.props.disabled?.get()) {
      this.props.onChanged(!this.props.state.get());
    }
  }

  private onClickHandler = this.onClick.bind(this);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.disabled === undefined) {
      this.props.disabled = Subject.create(false);
    }
    this.topRef.instance.addEventListener('click', this.onClickHandler);

    this.subs.push(
      this.props.disabled.sub((val) => {
        if (val) {
          this.topRef.getOrDefault()?.classList.add('disabled');
        } else {
          this.topRef.getOrDefault()?.classList.remove('disabled');
        }
      }, true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    this.topRef.getOrDefault()?.removeEventListener('click', this.onClickHandler);

    super.destroy();
  }

  public render(): VNode {
    return (
      <div class={{ 'mfd-adsc-button': true, disabled: this.props.disabled ?? false }} ref={this.topRef}>
        <div
          class={{
            'mfd-adsc-label-off': this.upperLabelGreen.map((it) => !it),
            'mfd-value': this.upperLabelGreen,
            bigger: this.upperLabelGreen,
          }}
          style={{ visibility: this.upperLabelHidden.map((it) => (it ? 'hidden' : 'visible')) }}
        >
          {this.props.labelTrue}
        </div>
        <div
          class={{
            'mfd-adsc-label-off': this.lowerLabelGreen.map((it) => !it),
            'mfd-label': this.lowerLabelGreen,
            bigger: this.lowerLabelGreen,
          }}
          style={{ visibility: this.lowerLabelHidden.map((it) => (it ? 'hidden' : 'visible')) }}
        >
          {this.props.labelFalse}
        </div>
      </div>
    );
  }
}
