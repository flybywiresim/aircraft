declare class IngamePanelControlsViewListener extends ViewListener.ViewListener {
    onInGamePanelControlsUpdated(callback: any): void;
    requestDeviceList(): void;
}
declare function RegisterIngamePanelControlsViewListener(callback?: any): IngamePanelControlsViewListener;
