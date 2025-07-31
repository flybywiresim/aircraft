// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  DebounceTimer,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { RmpPage, RmpPageProps } from 'instruments/src/RMP/Components/RmpPage';
import { TransponderController } from 'instruments/src/RMP/Pages/Transponder/TransponderController';
import { PageKeys } from 'instruments/src/RMP/Systems/KeypadController';
import { RmpMessageControlEvents } from 'instruments/src/RMP/Systems/RmpMessageManager';

import './TransponderPage.scss';

export interface TransponderPageProps extends RmpPageProps {
  bus: EventBus;
}

export class TransponderPage extends DisplayComponent<TransponderPageProps> implements RmpPage {
  private static readonly CLR_HELD_TIME = 1000;

  private readonly clearHeldTimer = new DebounceTimer();

  private readonly isHidden = Subject.create(true);

  private readonly pub = this.props.bus.getPublisher<RmpMessageControlEvents>();

  private readonly controller = new TransponderController(this.props.bus);

  private readonly squawkMessageSub: Subscription;

  constructor(props: TransponderPageProps) {
    super(props);

    this.squawkMessageSub = this.controller.isAuto.sub(
      (v) => this.pub.pub('rmp_message_set_squawk_message', !v),
      false,
      true,
    );
  }

  public setActive(isActive: boolean): void {
    this.isHidden.set(!isActive);

    if (isActive) {
      this.controller.resume();
      this.squawkMessageSub.resume(true);
    } else {
      this.controller.pause();
      this.squawkMessageSub.pause();
    }
  }

  public onKeyPressed(key: PageKeys): void {
    switch (key) {
      case PageKeys.Adk3:
        this.controller.onIdentPressed();
        break;
      case PageKeys.Lsk1:
      case PageKeys.Lsk2:
      case PageKeys.Lsk3:
        this.controller.onValidate();
        break;
      case PageKeys.Digit0:
        this.controller.onDigitEntered(0);
        break;
      case PageKeys.Digit1:
        this.controller.onDigitEntered(1);
        break;
      case PageKeys.Digit2:
        this.controller.onDigitEntered(2);
        break;
      case PageKeys.Digit3:
        this.controller.onDigitEntered(3);
        break;
      case PageKeys.Digit4:
        this.controller.onDigitEntered(4);
        break;
      case PageKeys.Digit5:
        this.controller.onDigitEntered(5);
        break;
      case PageKeys.Digit6:
        this.controller.onDigitEntered(6);
        break;
      case PageKeys.Digit7:
        this.controller.onDigitEntered(7);
        break;
      case PageKeys.Digit8:
        this.controller.onDigitEntered(8);
        break;
      case PageKeys.Digit9:
        this.controller.onDigitEntered(9);
        break;
      case PageKeys.Clear:
        this.controller.onClear(true);
        this.clearHeldTimer.schedule(() => this.controller.onClear(false), TransponderPage.CLR_HELD_TIME);
        break;
    }
  }

  onKeyReleased(key: PageKeys): void {
    if (key === PageKeys.Clear) {
      this.clearHeldTimer.clear();
    }
  }

  // FIXME _ missing in size 19 font

  render(): VNode | null {
    return (
      <div
        class={{
          hidden: this.isHidden,
          'transponder-page': true,
        }}
      >
        <div class="centred-row">
          <div
            class={{
              'transponder-mode': true,
              'font-11': true,
              green: this.controller.isAuto,
            }}
          >
            {this.controller.isAuto.map((v) => (v ? 'AUTO' : 'STBY'))}
          </div>
        </div>
        <div class="centred-row">
          <div class="transponder-code">
            <div class="font-10">SQWK</div>
            <div
              class={{
                cyan: true,
                'font-19': this.controller.entryInProgress.map((v) => !v),
                'font-16': this.controller.entryInProgress,
                amber: this.controller.entryInvalid,
              }}
            >
              {this.controller.displayedCode}
            </div>
          </div>
        </div>
        <div>
          <div class="transponder-ident font-11 cyan">
            {this.controller.isIdentActive.map((v) => (v ? '\xa0IDENT' : '*IDENT'))}
          </div>
        </div>
      </div>
    );
  }
}
