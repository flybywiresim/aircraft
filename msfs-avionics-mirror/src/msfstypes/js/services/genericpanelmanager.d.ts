declare class GenericPanelListener extends ViewListener.ViewListener {
    onSetupPanelInfos(callback: any): void;
    onSetupPanelForm(callback: any): void;
    onSetupCustomComponent(callback: any): void;
    on(str: any, arg: any): void;
    trigger(str: any, ...args: any[]): void;
}
declare function RegisterGenericPanelListener(callback?: () => void): GenericPanelListener;
