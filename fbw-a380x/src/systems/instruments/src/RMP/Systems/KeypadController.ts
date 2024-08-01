import { ConsumerValue, EventBus, HEvent } from '@microsoft/msfs-sdk';
import {
  RmpState,
  RmpStateControllerEvents,
} from '../../../../../../../fbw-common/src/systems/instruments/src/RMP/Systems';

export enum SystemKeys {
  VhfPage = 'VHF',
  HfPage = 'HF',
  TelPage = 'TEL',
  SquawkPage = 'SQWK',
  MenuPage = 'MENU',
  NavPage = 'NAV',
  MessageClear = 'MSG_CLR',
  Reset = 'RST',
  Vhf1Call = 'VHF_CALL_1',
  Vhf2Call = 'VHF_CALL_2',
  Vhf3Call = 'VHF_CALL_3',
  Hf1Call = 'HF_CALL_1',
  Hf2Call = 'HF_CALL_2',
  Tel1Call = 'TEL_CALL_1',
  Tel2Call = 'TEL_CALL_2',
  MechCall = 'MECH_CALL',
  CabCall = 'CAB_CALL',
  PaCall = 'PA_CALL',
  Voice = 'VOICE',
}

export enum PageKeys {
  Adk1 = 'ADK_1',
  Adk2 = 'ADK_2',
  Adk3 = 'ADK_3',
  Lsk1 = 'LSK_1',
  Lsk2 = 'LSK_2',
  Lsk3 = 'LSK_3',
  Up = 'UP',
  Down = 'DOWN',
  Digit0 = 'DIGIT_0',
  Digit1 = 'DIGIT_1',
  Digit2 = 'DIGIT_2',
  Digit3 = 'DIGIT_3',
  Digit4 = 'DIGIT_4',
  Digit5 = 'DIGIT_5',
  Digit6 = 'DIGIT_6',
  Digit7 = 'DIGIT_7',
  Digit8 = 'DIGIT_8',
  Digit9 = 'DIGIT_9',
  DigitDot = 'DIGIT_DOT',
  Clear = 'DIGIT_CLR',
}

export interface KeypadEvents {
  keypad_system_key_pressed: SystemKeys;
  keypad_system_key_released: SystemKeys;
  keypad_page_key_pressed: PageKeys;
  keypad_page_key_released: PageKeys;
}

export class KeypadController {
  private static readonly SYSTEM_KEYS = Object.values(SystemKeys);
  private static readonly PAGE_KEYS = Object.values(PageKeys);

  private readonly state = ConsumerValue.create(null, RmpState.OffStandby);

  private readonly hEventRegex = new RegExp(`^RMP_${this.rmpIndex}_(.+)_(PRESSED|RELEASED)$`);

  constructor(
    private readonly bus: EventBus,
    private readonly rmpIndex: number,
  ) {
    const sub = this.bus.getSubscriber<HEvent & RmpStateControllerEvents>();
    const pub = this.bus.getPublisher<KeypadEvents>();

    this.state.setConsumer(sub.on('rmp_state'));

    sub.on('hEvent').handle((e) => {
      if (this.state.get() !== RmpState.On) {
        return;
      }

      const match = e.match(this.hEventRegex);
      if (match !== null) {
        const [, key, eventType] = match;
        if (KeypadController.isSystemKey(key)) {
          switch (eventType) {
            case 'PRESSED':
              pub.pub('keypad_system_key_pressed', key);
              break;
            case 'RELEASED':
              pub.pub('keypad_system_key_released', key);
              break;
          }
        } else if (KeypadController.isPageKey(key)) {
          switch (eventType) {
            case 'PRESSED':
              pub.pub('keypad_page_key_pressed', key);
              break;
            case 'RELEASED':
              pub.pub('keypad_page_key_released', key);
              break;
          }
        } else {
          console.warn('KeypadController: Unknown H event', e);
        }
      }
    });
  }

  private static isSystemKey(key: string): key is SystemKeys {
    return KeypadController.SYSTEM_KEYS.includes(key as any);
  }

  private static isPageKey(key: string): key is PageKeys {
    return KeypadController.PAGE_KEYS.includes(key as any);
  }
}
