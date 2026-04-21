// @ts-strict-ignore
/**
 * NXNotif utility class to create a notification event and element
 */

import { NotificationButton, NotificationParams } from '@flybywiresim/fbw-sdk';

export class NXNotifManager {
  private notifications = [];
  constructor() {
    Coherent.on('keyIntercepted', (key) => this.registerIntercepts(key));
    Coherent.call('INTERCEPT_KEY_EVENT', 'PAUSE_TOGGLE', 0);
    Coherent.call('INTERCEPT_KEY_EVENT', 'PAUSE_ON', 0);
    Coherent.call('INTERCEPT_KEY_EVENT', 'PAUSE_OFF', 0);
    Coherent.call('INTERCEPT_KEY_EVENT', 'PAUSE_SET', 0);
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

interface NotificationData {
  __Type: 'NotificationData';
  type: string;
  id: number;
  title: string;
  description: string;
  theme: string;
  image: string;
  style?: string;
  buttons?: NotificationButton[];
  hasGauge?: boolean;
  priority?: number;
  params?: NotificationParams;
  sound?: string;
}

class NXNotif {
  private title = 'A32NX ALERT';
  private timeout = 10000;

  private params: NotificationData = {
    __Type: 'NotificationData',
    id: 0,
    title: this.title,
    type: 'MESSAGE',
    theme: 'GAMEPLAY',
    image: 'IMAGE_NOTIFICATION',
    description: 'Default Message',
  };

  private nxNotificationsListener?: ViewListener.ViewListener;

  constructor() {}

  setData(params: Partial<NotificationData> = {}) {
    if (params.title) {
      this.params.title = params.title;
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
    if (params.description) {
      this.params.description = params.description;
    }
  }

  setTimeout(timeout: number) {
    this.timeout = timeout;
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
  showNotification(params: Partial<NotificationData> = {}) {
    this.setData(params);

    if (!this.nxNotificationsListener) {
      this.nxNotificationsListener = RegisterViewListener('JS_LISTENER_NOTIFICATIONS', () => {}, true);
    }
    this.nxNotificationsListener.triggerToAllSubscribers('SendNewNotification', this.params);
    setTimeout(() => {
      this.hideNotification();
    }, this.timeout);
  }

  // TODO FIXME: May break in the future, check every update
  hideNotification() {
    this.nxNotificationsListener.triggerToAllSubscribers('HideNotification', this.params.type, null, this.params.id);
  }
}
