/**
 * NotificationParams class container for popups to package popup metadata
 */
class NotificationParams {
  constructor() {
    this.__Type = 'SNotificationParams';
    this.buttons = [];
    this.style = 'normal';
    this.displayGlobalPopup = true;
  }
}

/**
 * NXPopUp utility class to create a pop-up UI element
 */
export class NXPopUp {
  constructor() {
    this.params = new NotificationParams();
    this.popupListener;
    this.params.title = 'A32NX POPUP';
    this.params.time = new Date().getTime();
    this.params.id = this.params.title + '_' + this.params.time;
    this.params.contentData = 'Default Message';
    this.params.style = 'small';
    this.params.buttons.push(new NotificationButton('TT:MENU.YES', 'A32NX_POP_' + this.params.id + '_YES'));
    this.params.buttons.push(new NotificationButton('TT:MENU.NO', 'A32NX_POP_' + this.params.id + '_NO'));
  }

  _showPopUp(params) {
    try {
      Coherent.trigger('SHOW_POP_UP', params);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Show popup with given or already initiated parameters
   * @param {string} title Title for popup - will show in menu bar
   * @param {string} message Popup message
   * @param {string} style Style/Type of popup. Valid types are small|normal|big|big-help
   * @param {function} callbackYes Callback function -> YES button is clicked.
   * @param {function} callbackNo Callback function -> NO button is clicked.
   */
  showPopUp(title, message, style, callbackYes, callbackNo) {
    if (title) {
      this.params.title = title;
    }
    if (message) {
      this.params.contentData = message;
    }
    if (style) {
      this.params.style = style;
    }
    if (callbackYes) {
      const yes = typeof callbackYes === 'function' ? callbackYes : () => callbackYes;
      Coherent.on(`A32NX_POP_${this.params.id}_YES`, () => {
        Coherent.off(`A32NX_POP_${this.params.id}_YES`, null, null);
        yes();
      });
    }
    if (callbackNo) {
      const no = typeof callbackNo === 'function' ? callbackNo : () => callbackNo;
      Coherent.on(`A32NX_POP_${this.params.id}_NO`, () => {
        Coherent.off(`A32NX_POP_${this.params.id}_NO`, null, null);
        no();
      });
    }

    if (!this.popupListener) {
      this.popupListener = RegisterViewListener('JS_LISTENER_POPUP', this._showPopUp.bind(null, this.params));
    } else {
      this._showPopUp();
    }
  }
}

/**
 * NXNotif utility class to create a notification event and element
 */

export class NXNotifManager {
  constructor() {
    Coherent.on('keyIntercepted', (key) => this.registerIntercepts(key));
    Coherent.call('INTERCEPT_KEY_EVENT', 'PAUSE_TOGGLE', 0);
    Coherent.call('INTERCEPT_KEY_EVENT', 'PAUSE_ON', 0);
    Coherent.call('INTERCEPT_KEY_EVENT', 'PAUSE_OFF', 0);
    Coherent.call('INTERCEPT_KEY_EVENT', 'PAUSE_SET', 0);
    this.notifications = [];
  }

  registerIntercepts(key) {
    switch (key) {
      case 'PAUSE_TOGGLE':
      case 'PAUSE_ON':
      case 'PAUSE_OFF':
      case 'PAUSE_SET':
        this.notifications.forEach((notif) => {
          notif.hideNotification();
        });
        this.notifications.length = 0;
        break;
      default:
        break;
    }
  }

  showNotification(params = {}) {
    const notif = new NXNotif();
    notif.showNotification(params);
    this.notifications.push(notif);
  }
}

class NXNotif {
  constructor() {
    const title = 'A32NX ALERT';
    this.time = new Date().getTime();
    this.params = {
      id: `${title}_${this.time}`,
      title,
      type: 'MESSAGE',
      theme: 'GAMEPLAY',
      image: 'IMAGE_NOTIFICATION',
      description: 'Default Message',
      timeout: 10000,
      time: this.time,
    };
  }

  setData(params = {}) {
    if (params.title) {
      this.params.title = params.title;
      this.params.id = `${params.title}_${new Date().getTime()}`;
    }
    if (params.type) {
      this.params.type = params.type;
    }
    if (params.theme) {
      this.params.theme = params.theme;
    }
    if (params.image) {
      this.params.image = params.image;
    }
    if (params.message) {
      this.params.description = params.message;
    }
    if (params.timeout) {
      this.params.timeout = params.timeout;
    }
  }

  /**
   * Show notification with given or already initiated parametrs.
   * @param {string} params.title Title for notification - will show as the message header
   * @param {string} params.type Type of Notification - Valid types are MESSAGE|SUBTITLES
   * @param {string} params.theme Theme of Notification. Valid types are TIPS|GAMEPLAY|SYSTEM
   * @param {string} params.image Notification image. Valid types are IMAGE_NOTIFICATION|IMAGE_SCORE
   * @param {string} params.message Notification message
   * @param {number} params.timeout Time in ms before notification message will disappear
   */
  showNotification(params = {}) {
    this.setData(params);

    if (!nxNotificationsListener) {
      nxNotificationsListener = RegisterViewListener('JS_LISTENER_NOTIFICATIONS');
    }
    nxNotificationsListener.triggerToAllSubscribers('SendNewNotification', this.params);
    setTimeout(() => {
      this.hideNotification();
    }, this.params.timeout);
  }

  // TODO FIXME: May break in the future, check every update
  hideNotification() {
    nxNotificationsListener.triggerToAllSubscribers('HideNotification', this.params.type, null, this.params.id);
  }
}
