/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/// <reference path="../../../typings/fs-base-ui/html_ui/JS/common.d.ts" />

/**
 * NotiticationParams container for popups to package popup metadata
 */
export type NotiticationParams = {
    __Type: string;
    buttons: NotificationButton[];
    style: string;
    displayGlobalPopup: boolean;
    contentData: string;
    contentUrl: string;
    contentTemplate: string;
    id: string;
    title: string;
    time: number;
}

/**
 * PopUp utility class to create a pop-up UI element
 *
 * Usage:
 * import { PopUp } from '@shared/popup';
 * ...
 * const popup = new PopUp();
 * popup.showPopUp({ title: "CRITICAL SETTING CHANGED", message: "Your message here", style: "small"}, yesFunc, noFunc);
 */
export class PopUp {
    params: NotiticationParams;

    popupListener: any;

    /**
     * Creates a Popup
     */
    constructor() {
        const title = 'A32NX POPUP';
        const time = new Date().getTime();
        this.popupListener = undefined;
        this.params = {
            __Type: 'SNotificationParams',
            buttons: [new NotificationButton('TT:MENU.YES', `A32NX_POP_${title}_${time}_YES`), new NotificationButton('TT:MENU.NO', `A32NX_POP_${title}_${time}_NO`)],
            style: 'normal',
            displayGlobalPopup: true,
            contentData: 'Default Message',
            contentUrl: '', // i.e. "/templates/Controls/PopUp_EditPreset/PopUp_EditPreset.html";
            contentTemplate: '', // i.e. "popup-edit-preset";
            id: `${title}_${time}`,
            title,
            time,
        };
    }

    /**
     * Pass Popup display data to Coherent
     * @param params
     */
    _showPopUp(params: any = {}): void {
        Coherent.trigger('SHOW_POP_UP', params);
    }

    /**
     * Show popup with given or already initiated parameters
     * @param {string} params.title Title for popup - will show in menu bar
     * @param {string} params.message Popup message
     * @param {string} params.style Style/Type of popup. Valid types are small|normal|big|big-help
     * @param {function} callbackYes Callback function -> YES button is clicked.
     * @param {function} callbackNo Callback function -> NO button is clicked.
     */
    showPopUp(params: any = {}, callbackYes: any, callbackNo: any): void {
        if (params.title) {
            this.params.title = params.title;
        }
        if (params.message) {
            this.params.contentData = params.message;
        }
        if (params.style) {
            this.params.style = params.style;
        }
        if (callbackYes) {
            const yes = (typeof callbackYes === 'function') ? callbackYes : () => callbackYes;
            Coherent.on(`A32NX_POP_${this.params.id}_YES`, yes);
        }
        if (callbackNo) {
            const no = (typeof callbackNo === 'function') ? callbackNo : () => callbackNo;
            Coherent.on(`A32NX_POP_${this.params.id}_NO`, no);
        }

        if (!this.popupListener) {
            this.popupListener = RegisterViewListener('JS_LISTENER_POPUP', this._showPopUp.bind(null, this.params));
        } else {
            this._showPopUp(this.params);
        }
    }
}
