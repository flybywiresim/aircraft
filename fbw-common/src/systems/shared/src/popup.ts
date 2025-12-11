// @ts-strict-ignore
import { SimVarValueType, Wait } from '@microsoft/msfs-sdk';
import { v4 as uuidv4 } from 'uuid';
/**
 * NotificationParams container for popups to package popup metadata
 */
export type NotificationParams = {
  __Type: string;
  buttons: NotificationButton[];
  style: string;
  displayGlobalPopup: boolean;
  contentData: string;
  contentUrl: string;
  contentTemplate: string;
  id: string;
  title: string;
  description: string;
  duration: number;
  closePopupTitle: string;
  closePopup: boolean;
};

export class NotificationButton {
  __Type: string;
  toGlobalFlow: boolean;
  close: boolean;
  selected: boolean;
  id: string;
  strParam: string;
  title: string;
  event: string;
  theme: string;
  enabled: boolean;

  constructor(
    title: string = '',
    event: string = '',
    close: boolean = true,
    theme: string | null = null,
    toGlobalFlow: boolean = false,
  ) {
    this.__Type = 'NotificationButton';
    this.toGlobalFlow = toGlobalFlow;
    this.close = close;
    this.selected = false;
    this.id = '';
    this.strParam = '';
    this.title = title;
    this.event = event;
    this.theme = theme || '';
    this.enabled = true;
  }
}

/**
 * PopUpDialog utility class to create a pop-up UI element
 *
 * Usage:
 * import { PopUpDialog } from '@flybywiresim/fbw-sdk';
 * ...
 * const popup = new PopUpDialog();
 * popup.showPopUp("CRITICAL SETTING CHANGED", "Your message here", "small", yesFunc, noFunc);
 * popup.showInformation("CRITICAL MESSAGE", "Your message here", "small", yesFunc);
 */
export class PopUpDialog {
  params: NotificationParams;

  popupListener: any;

  /**
   * Creates a Popup
   */
  constructor() {
    const title = 'FBW POPUP';
    const time = new Date().getTime();
    this.popupListener = undefined;
    this.params = {
      __Type: 'SNotificationParams',
      buttons: [
        new NotificationButton('TT:MENU.YES', `FBW_POP_${title}_${time}_YES`),
        new NotificationButton('TT:MENU.NO', `FBW_POP_${title}_${time}_NO`),
      ],
      style: 'normal',
      displayGlobalPopup: true,
      contentData: 'Default Message',
      contentUrl: '', // i.e. "/templates/Controls/PopUp_EditPreset/PopUp_EditPreset.html";
      contentTemplate: '', // i.e. "popup-edit-preset";
      id: `${title}_${time}`,
      title,
      description: '',
      duration: 0,
      closePopupTitle: '',
      closePopup: false,
    };
  }

  /**
   * Pass Popup display data to Coherent
   * @param params
   */
  /* eslint-disable no-underscore-dangle */
  async _showPopUp(params: any = {}): Promise<void> {
    await Wait.awaitCondition(
      () =>
        SimVar.GetSimVarValue('L:FBW_IN_FLIGHT_DECK', SimVarValueType.Bool) === 1 &&
        SimVar.GetSimVarValue('COCKPIT CAMERA HEADLOOK', SimVarValueType.Enum) !== 1 &&
        SimVar.GetSimVarValue('CHASE CAMERA HEADLOOK', SimVarValueType.Enum) !== 1,
      60,
    );
    Coherent.trigger('UNFOCUS_INPUT_FIELD', uuidv4()); // Needed to mitigate an issue when ALT-TAB or using toggle free look
    Coherent.trigger('SHOW_POP_UP', params);
  }

  /**
   * Show popup with given or already initiated parameters
   * @param {string} title Title for popup - will show in menu bar
   * @param {string} message Popup message
   * @param {string} style Style/Type of popup. Valid types are small|normal|big|big-help
   * @param {function} callbackYes Callback function -> YES button is clicked.
   * @param {function} callbackNo Callback function -> NO button is clicked.
   */
  showPopUp(
    title: string,
    message: string,
    style: 'small' | 'normal' | 'big' | 'big-help',
    callbackYes: () => void,
    callbackNo: () => void,
  ): void {
    if (title) {
      this.params.title = title;
    }
    if (message) {
      this.params.contentData = message;
      this.params.description = message;
    }
    if (style) {
      this.params.style = style;
    }
    if (callbackYes) {
      const yes = typeof callbackYes === 'function' ? callbackYes : () => callbackYes;
      Coherent.on(`FBW_POP_${this.params.id}_YES`, () => {
        Coherent.off(`FBW_POP_${this.params.id}_YES`, null, null);
        yes();
      });
    }
    if (callbackNo) {
      const no = typeof callbackNo === 'function' ? callbackNo : () => callbackNo;
      Coherent.on(`FBW_POP_${this.params.id}_NO`, () => {
        Coherent.off(`FBW_POP_${this.params.id}_NO`, null, null);
        no();
      });
    }

    if (!this.popupListener) {
      this.popupListener = RegisterViewListener('JS_LISTENER_POPUP', this._showPopUp.bind(null, this.params));
    } else {
      this._showPopUp(this.params);
    }
  }

  /**
   * Show information with given or already initiated parameters
   * @param {string} title Title for popup - will show in menu bar
   * @param {string} message Popup message
   * @param {string} style Style/Type of popup. Valid types are small|normal|big|big-help
   * @param {function} callback Callback function -> OK button is clicked.
   */
  showInformation(
    title: string,
    message: string,
    style: 'small' | 'normal' | 'big' | 'big-help',
    callback: () => void,
  ): void {
    if (title) {
      this.params.title = title;
    }
    if (message) {
      this.params.contentData = message;
      this.params.description = message;
    }
    if (style) {
      this.params.style = style;
    }
    if (callback) {
      const yes = typeof callback === 'function' ? callback : () => callback;
      Coherent.on(`FBW_POP_${this.params.id}_YES`, () => {
        Coherent.off(`FBW_POP_${this.params.id}_YES`, null, null);
        yes();
      });
    }
    this.params.buttons = [new NotificationButton('TT:MENU.OK', `FBW_POP_${this.params.id}_YES`)];

    if (!this.popupListener) {
      this.popupListener = RegisterViewListener('JS_LISTENER_POPUP', this._showPopUp.bind(null, this.params));
    } else {
      this._showPopUp(this.params);
    }
  }
}
