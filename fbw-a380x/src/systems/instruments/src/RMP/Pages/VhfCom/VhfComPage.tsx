// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DebounceTimer,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';

import { VhfComIndices } from '@flybywiresim/fbw-sdk';

import { ReceptionMode, VhfComController } from './VhfComController';
import { RmpPage, RmpPageProps } from '../../Components/RmpPage';
import { PageKeys } from '../../Systems/KeypadController';
import { RmpMessageControlEvents } from 'instruments/src/RMP/Systems/RmpMessageManager';

import './VhfComPage.scss';

export interface VhfComPageProps extends RmpPageProps {
  bus: EventBus;
}

export class VhfComPage extends DisplayComponent<VhfComPageProps> implements RmpPage {
  private static readonly CLR_HELD_TIME = 1000;

  private readonly pub = this.props.bus.getPublisher<RmpMessageControlEvents>();

  private readonly clearHeldTimer = new DebounceTimer();

  private readonly isHidden = Subject.create(true);

  private readonly rows = [
    FSComponent.createRef<VhfComRow>(),
    FSComponent.createRef<VhfComRow>(),
    FSComponent.createRef<VhfComRow>(),
  ];

  private readonly selectedRow = Subject.create(0);

  public setActive(isActive: boolean): void {
    this.isHidden.set(!isActive);

    if (isActive) {
      this.pub.pub('rmp_message_set_squawk_message', true);
    }
  }

  // FIXME factor some of this common with other tuning pages
  public onKeyPressed(key: PageKeys): void {
    switch (key) {
      case PageKeys.Adk1:
        this.onAdkPressed(1);
        break;
      case PageKeys.Adk2:
        this.onAdkPressed(2);
        break;
      case PageKeys.Adk3:
        this.onAdkPressed(3);
        break;
      case PageKeys.Lsk1:
        this.onLskPressed(1);
        break;
      case PageKeys.Lsk2:
        this.onLskPressed(2);
        break;
      case PageKeys.Lsk3:
        this.onLskPressed(3);
        break;
      case PageKeys.Digit0:
        this.onDigitEntered(0);
        break;
      case PageKeys.Digit1:
        this.onDigitEntered(1);
        break;
      case PageKeys.Digit2:
        this.onDigitEntered(2);
        break;
      case PageKeys.Digit3:
        this.onDigitEntered(3);
        break;
      case PageKeys.Digit4:
        this.onDigitEntered(4);
        break;
      case PageKeys.Digit5:
        this.onDigitEntered(5);
        break;
      case PageKeys.Digit6:
        this.onDigitEntered(6);
        break;
      case PageKeys.Digit7:
        this.onDigitEntered(7);
        break;
      case PageKeys.Digit8:
        this.onDigitEntered(8);
        break;
      case PageKeys.Digit9:
        this.onDigitEntered(9);
        break;
      case PageKeys.Clear:
        this.onClear(true);
        this.clearHeldTimer.schedule(() => this.onClear(false), VhfComPage.CLR_HELD_TIME);
        break;
      case PageKeys.Up:
        this.onUpPressed();
        break;
      case PageKeys.Down:
        this.onDownPressed();
        break;
    }
  }

  public onKeyReleased(key: PageKeys): void {
    if (key === PageKeys.Clear) {
      this.clearHeldTimer.clear();
    }
  }

  private onAdkPressed(adk: 1 | 2 | 3): void {
    // TODO does this select the row, or swap even if the row isn't selected??
    const rowIndex = adk - 1;
    const selectedRow = this.selectedRow.get();
    if (selectedRow === rowIndex) {
      this.rows[selectedRow].instance.controller.onAdkPressed();
    } else {
      this.selectedRow.set(rowIndex);
    }
  }

  private onLskPressed(lsk: 1 | 2 | 3): void {
    const rowIndex = lsk - 1;
    const selectedRow = this.selectedRow.get();
    if (selectedRow === rowIndex) {
      this.rows[selectedRow].instance.controller.onLskPressed();
    } else {
      this.selectedRow.set(rowIndex);
    }
  }

  private onDigitEntered(digit: number): void {
    const selectedRow = this.selectedRow.get();
    this.rows[selectedRow].instance.controller.onDigitEntered(digit);
  }

  private onClear(singleDigit: boolean): void {
    const selectedRow = this.selectedRow.get();
    this.rows[selectedRow].instance.controller.onClear(singleDigit);
  }

  private onUpPressed(): void {
    const selectedRow = this.selectedRow.get();
    this.rows[selectedRow].instance.controller.onUpPressed();
  }

  private onDownPressed(): void {
    const selectedRow = this.selectedRow.get();
    this.rows[selectedRow].instance.controller.onDownPressed();
  }

  render(): VNode | null {
    return (
      <div
        class={{
          hidden: this.isHidden,
          'frequency-page': true,
        }}
      >
        <VhfComRow
          ref={this.rows[0]}
          bus={this.props.bus}
          vhfIndex={1}
          isSelected={this.selectedRow.map((v) => v === 0)}
        />
        <div class="divider" />
        <VhfComRow
          ref={this.rows[1]}
          bus={this.props.bus}
          vhfIndex={2}
          isSelected={this.selectedRow.map((v) => v === 1)}
        />
        <div class="divider" />
        <VhfComRow
          ref={this.rows[2]}
          bus={this.props.bus}
          vhfIndex={3}
          isSelected={this.selectedRow.map((v) => v === 2)}
        />
      </div>
    );
  }
}

interface VhfComRowProps extends ComponentProps {
  bus: EventBus;
  vhfIndex: VhfComIndices;
  isSelected: Subscribable<boolean>;
}

class VhfComRow extends DisplayComponent<VhfComRowProps> {
  public readonly controller = new VhfComController(this.props.bus, this.props.vhfIndex, this.props.isSelected);

  render(): VNode {
    return (
      <>
        <div
          class={{
            'active-frequency': true,
            'font-19': true,
            amber: this.controller.isRadioFailed,
          }}
        >
          {this.controller.activeText}
        </div>
        <div class="transceiver-ident-cell">
          <div
            class={{
              'loudspeaker-symbol': true,
              invisible: this.controller.isLoudspeakerHidden,
            }}
          >
            <svg viewBox="0 0 75 114" style="width: 58px; height: 89px;">
              <path d="M 2 37 l 36 0 l 0 -7 l 7 0 l 0 -7 l 7 0 l 0 -7 l 7 0 l 0 -7 l 7 0 l 0 -7 l 7 0 l 0 110 l -7 0 l 0 -7 l -7 0 l 0 -7 l -7 0 l 0 -7 l -7 0 l 0 -7 l -7 0 l 0 -7 l -36 0 z" />
            </svg>
            <svg
              class={{
                'no-reception': true,
                hidden: this.controller.receptionMode.map((v) => v !== ReceptionMode.TransmitOnly),
              }}
              viewBox="0 0 75 114"
              style="width: 58px; height: 89px;"
            >
              <path d="M 2 2 l 71 110 M 73 2 l -71 110" />
            </svg>
          </div>
          <div
            class={{
              'transceiver-ident': true,
              'font-13': true,
              'reverse-video': this.controller.isTransmitOn,
            }}
          >
            {this.controller.transceiverName}
          </div>
        </div>
        <div
          class={{
            'stby-frequency-cell': true,
            selected: this.props.isSelected,
            amber: this.controller.isStandbyAmber,
          }}
        >
          <div
            class={{
              'stdby-mode': true,
              'font-10': true,
              white: true,
              invisible: this.props.isSelected.map(SubscribableMapFunctions.not()),
            }}
          >
            {this.controller.standbyModeTitle}
          </div>
          <div
            class={{
              'stby-frequency': true,
              'font-13': true,
              'font-16': this.controller.standbyEntryInProgress,
            }}
          >
            {/* FIXME arrows for VHF3 standby mode, and DATA/EMER mode support */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                class={{
                  'font-19': this.controller.standbyDigits[i].isPilotEntered,
                }}
              >
                {this.controller.standbyDigits[i].digit}
              </div>
            ))}
            <div class="font-13">.</div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                class={{
                  'font-19': this.controller.standbyDigits[i + 3].isPilotEntered,
                }}
              >
                {this.controller.standbyDigits[i + 3].digit}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
}
