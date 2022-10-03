interface ToolBarButtonData {
    __Type: "ToolBarButtonData";
    icon: string;
    childDetached: boolean;
    buttonVisible: boolean;
    disabled: boolean;
    childActive: boolean;
    nbNotifications: number;
    newNotification: boolean;
    name: string;
    ID: string;
    shortcut: string;
    managedByToolbar: boolean;
}
declare class ToolBarButtonAction {
    ID: string;
    x: number;
    childActive?: boolean;
    childVisible?: boolean;
    y: number;
    childDetached?: boolean;
}
declare class ToolBarPanelData {
    __Type: "ToolBarPanelData";
    visible: boolean;
    action: string;
    x: number;
    y: number;
}
declare class ToolBarListener extends ViewListener.ViewListener {
    onSetToolBarElements(callback: (data: ToolBarButtonData[], isFirstFlight: boolean) => void): void;
    onToolBarButtonFocusChange(callback: (id: string, focused: boolean) => void): void;
    onUpdateToolBarElement(callback: (data: ToolBarButtonData) => void): void;
    onPanelActiveChange(callback: (panelID: string, visible: boolean, minimized: boolean) => void): void;
    onSetToolBarCustomizationList(callback: (data: ToolBarButtonData[]) => void): void;
    onInGamePanelMouseOut(callback: (panelID: string) => void): void;
    setButtonChildActive(ID: string, active: boolean): void;
    setButtonChildDetach(ID: string, detach: boolean): void;
    setButtonChildExtern(ID: string, extern: boolean): void;
    setButtonEnabled(ID: string, enabled: boolean): void;
    setMinimized(ID: string, minimized: boolean): void;
    setActivePause(paused: boolean): void;
    onActivePauseUpdate(callback: (paused: boolean) => void): void;
    setFirstFlightInteracted(): void;
    getFirstFlightInteracted(): boolean;
    resetAllPanelsPosition(): void;
    onPanelVisible(ID: string): void;
    onToolbarMode(callback: (on: boolean) => void): void;
    pushPanelMouseOver(ID: string): void;
    onInGamePanelMouseOver(callback: (panelID: string) => void): void;
    pushPanelMouseOut(ID: string): void;
    pushLocalPanelVisibility(panelID: string, visible: boolean): void;
    onLocalPanelVisibility(callback: (panelID: string, visible: boolean) => void): void;
    pushPanelAttachedPosition(data: ToolBarButtonAction): void;
    onInGamePanelToggleMinimize(callback: (panelID: string, minimized: boolean) => void): void;
    pushInGamePanelToggleMinimize(panelID: string, minimized: boolean): void;
    onUpdatePanelPosition(callback: (data: ToolBarButtonAction) => void): void;
    onRefreshPanelPosition(callback: (panelID: string) => void): void;
    pushRefreshPanelPosition(panelID: string): void;
    onUpdatePanelAttachment(callback: (panelID: string, detached: boolean) => void): void;
    onUpdatePanelExtern(callback: (panelID: string, extern: boolean) => void): void;
    onSetupPanelInfos(callback: (infos: PanelInfos) => void): void;
    onSetupPanelOptions(callback: (data: PanelOptionData[]) => void): void;
    onTogglePanelOptionVisibility(callback: (updateList: {
        optionID: string;
        visible: boolean;
    }[]) => void): void;
    onTogglePanelOptionDisable(callback: (updateList: {
        optionID: string;
        disabled: boolean;
    }[]) => void): void;
    onUpdatePanelOptions(callback: (data: PanelOptionData[]) => void): void;
    pushUpdatePanelOption(optionID: string, dataList: DataValue[]): void;
    onSetHeaderVisibility(callback: (data: boolean) => void): void;
}
declare function RegisterToolBarListener(callback?: any): ToolBarListener;
