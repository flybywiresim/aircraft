declare type NotificationType = "POPUP" | "MESSAGE" | "STACKABLE" | "OVERLAY";
declare type NotificationTheme = "INFO" | "SUCCESS" | "WARNING" | "SYSTEM" | "TIPS" | "GAMEPLAY" | "SCORE";
declare class NotificationData {
    __Type: string;
    id: number;
    type: NotificationType;
    theme: NotificationTheme;
    title: string;
    description: string;
    image: string;
    style: string;
    buttons: NotificationButton[];
    hasGauge: boolean;
    priority: number;
    params: PopUp.NotiticationParams;
    sound: string;
}
declare class NotificationsListener extends ViewListener.ViewListener {
    constructor(name: string);
    onCloseAllNotifications(callback: any): void;
    onSendNewNotification(callback: any): void;
    onUpdateNotificationText(callback: any): void;
    onUpdateNotificationData(callback: any): void;
    onUpdateNotificationGauge(callback: any): void;
    onSetupObjectiveSteps(callback: any): void;
    onHideNotification(callback: any): void;
    onSetSubtitles(callback: any): void;
    onHideSubtitles(callback: any): void;
    onEnterPause(callback: any): void;
    onLeavePause(callback: any): void;
    PlayNotificationSound(id: number): void;
}
declare function RegisterNotificationsListener(callback?: any): NotificationsListener;
declare class NotificationElement extends TemplateElement {
    get templateID(): string;
    _data: NotificationData;
    protected _theme: string;
    private _hideMotive?;
    protected m_clearTimeout: number;
    constructor();
    connectedCallback(): void;
    SetUpNotif(_oData: NotificationData): void;
    UpdateTexts(_oData: NotificationData): void;
    setTitle(newTitle: string): void;
    setDesc(newDesc: string): void;
    UpdateGauge(id: number, gaugePercent: number): void;
    onPause(): void;
    afterPause(): void;
    protected OnClick(): void;
    IsDisappearing(): boolean;
    Hide(): void;
    RemoveNotification(id: number, hideMotive?: string): void;
    Close(hideMotive?: string): void;
    OnFinishedCB: () => void;
    OnFinished(): void;
    get theme(): string;
    set theme(theme: string);
    CleanUp(): void;
}
