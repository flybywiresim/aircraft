declare class BindingCombo {
    sKeys: string;
    daKeys: number[];
    sHTML: string;
    physicalKey?: PhysicalKey;
    keyState?: HardwareKeyState;
}
declare class KeyBinding {
    iUId: number;
    sName: string;
    sCategory: string;
    sSubCategory: string;
    sNameTT: string;
    sCategoryTT: string;
    sSubCategoryTT: string;
    sContext: string;
    sDescription: string;
    primary: BindingCombo;
    secondary: BindingCombo;
    sTags: string;
    bIsReversed: boolean;
    bIsAxis: boolean;
    bCanMapOnRelease: boolean;
    bMapOnRelease: boolean;
    bHidden: boolean;
}
declare class ScannedKey {
    combo: BindingCombo;
    bHasConflicts: boolean;
    daConflicts: string[];
    sError: string;
}
declare class PhysicalKey {
    iUId: number;
    iIndex: number;
    nType: string;
    sDisplayName: string;
    sDisplayNameShort: string;
    sHTML: string;
    fAxisSensitivityMinus: number;
    fAxisSensitivityPlus: number;
    daSensitivityCurve: Array<Vec2>;
    fAxisDeadZone: number;
    fAxisNeutral: number;
    fReactivity: number;
    fExtremityDeadZone: number;
    daPOVNames: Array<string>;
    bShowSensitivity: boolean;
}
declare class BindingData {
    deviceName: string;
    bSimpleSensitivity: boolean;
    keys: PhysicalKey[];
    keyBindings: KeyBinding[];
    type: string;
    canHaveVibrations: boolean;
    vibrations: boolean;
    hasAxes: boolean;
}
declare class HardwareKeyState {
    iUId: number;
    fValue: number;
    fRawValue: number;
}
declare class DevicePresetData {
    deviceName: string;
    sFriendlyName: string;
    sFileName: string;
    bLocked: boolean;
}
declare class ControllerData {
    iDeviceId: number;
    sTranslatedName: string;
    sLayout: string;
    sTextureFolder: string;
}
declare class SelectActionData {
    actionId: number;
    showAxis: boolean;
    showButtons: boolean;
    constructor(json?: string);
    static toJSON(data: SelectActionData): string;
}
declare class DeviceCalibrationData {
    deviceId: number;
}
declare function RegisterControlsListener(callback?: any): ControlsViewListener;
declare class ControlsViewListener extends ViewListener.ViewListener {
    requestUserInputProfileList(): void;
    askSwitchCurrentProfile(deviceId: string, filename: string): void;
    askRenameCurrentPreset(): void;
    askDeleteCurrentPreset(): void;
    createUserPreset(): void;
    duplicateCurrentPreset(): void;
    askRenameCurrentProfile(): void;
    askDeleteCurrentProfile(): void;
    createUserProfile(): void;
    duplicateCurrentProfile(): void;
    setCurrentGlobalProfile(id: string): void;
    requestCurrentMapping(): void;
    requestCurrentKeyState(): void;
    initKeyBindings(_deviceId: string): void;
    initGlobal(id: string): void;
    onSetCurrentBindings(callback: (data: BindingData, _resetDisplay: boolean) => void): void;
    onKeyScanned(callback: (_scan: ScannedKey) => void): void;
    onKeySelected(callback: (_scan: ScannedKey) => void): void;
    onScanFinished(callback: () => void): void;
    onHardwareKeysChanged(callback: (_keyStates: Array<HardwareKeyState>, _axisStates: Array<HardwareKeyState>, _axisButtonStates: Array<HardwareKeyState>) => void): void;
    onEnableImportButton(callback: (_isEnable: boolean) => void): void;
    onDevicePresetListChange(callback: (deviceId: number, presets: DevicePresetData[], currentFilename: string) => void): void;
    onGlobalProfilesListChange(callback: (profiles: DataValue[], currentId: string) => void): void;
    onInitListControllers(callback: (data: ControllerData[], currentDeviceId: number) => void): void;
    onSetCurrentController(callback: (_deviceId: string) => void): void;
    onAddUserInput(callback: (deviceId: number, data: DevicePresetData) => void): void;
    onLoadingStateChange(callback: (loading: boolean) => void): void;
    onActiveUserInput(callback: (deviceId: number, userInputFilename: string, isReadOnly: boolean) => void): void;
    onShowSensibility(callback: () => void): void;
    onUpdateSensitivityCurve(callback: (_key: PhysicalKey) => void): void;
}
declare enum EFilterType {
    ALL = 0,
    ESSENTIALS = 1,
    ASSIGNED = 2,
    NEW = 3
}
declare class ControlsScreenBase extends TemplateElement {
    protected m_canImportFSX: boolean;
    get templateID(): string;
    protected m_ControlsListener: ControlsViewListener;
    private SN_Axis;
    protected m_lastDevice: string;
    protected m_KeyMapperElem: KeyMapper;
    protected m_JoyMapperElem: JoyMapper;
    protected tabListElem: NewListButtonElement;
    protected filterElem: ControlsFilterElement;
    protected m_ControllerDataList: ControllerData[];
    constructor();
    connectedCallback(): void;
    onListenerRegistered: () => void;
    disconnectedCallback(): void;
    protected OnLoadingStateChange: (loading: boolean) => void;
    private get eCurrentFilter();
    private set eCurrentFilter(value);
    private onAllActionsAdded;
    OnFilterListSelected: () => void;
    private InitTabElem;
    private _textSearchTimeout;
    OnSearchByTextChanged: () => void;
    OnSearchByInputChanged: () => void;
    private OnSetCurrentBindings;
    SetCurrentBindings(data: BindingData, _resetDisplay: boolean): void;
    protected updateDescription(e: CustomEvent): void;
    SetKeyBindings(data: BindingData, _resetDisplay: boolean): void;
    SetJoyBindings(data: BindingData, _resetDisplay: boolean): void;
    OnKeyScanned: (_scan: ScannedKey) => void;
    OnScanFinished: () => void;
    OnHardwareKeysChanged: (_keyStates: Array<HardwareKeyState>, _axis: Array<HardwareKeyState>, _axisButton: Array<HardwareKeyState>) => void;
    OnControllerButtonChanged: (e: Event) => void;
    imageFound: () => void;
    imageNotFound: () => void;
    private m_initTimeout;
    RefreshControllerPage(_deviceId: string): void;
    EnableImportButton: (_isEnable: boolean) => void;
    ShowHeader(_visible: boolean): void;
    ShowGlobal(id: string): void;
    RefreshSubPage(_deviceId: string): void;
    InitListControllers: (data: ControllerData[], _defaultDeviceId: number) => void;
    SetCurrentController: (_deviceId: string) => void;
    onProfileSelected: (deviceId: string, filename: string) => void;
    AddUserInput: (deviceId: number, data: DevicePresetData) => void;
    ActiveUserInput: (deviceId: number, userInputFilename: string, isReadOnly: boolean) => void;
    ShowInputEditPage(): void;
    protected showSensibility: () => void;
    private onSensitivityPopUpClosed;
    protected setGlobalProfileId: (profileId: string) => void;
    protected onDevicePresetListChange: (deviceId: number, presets: DevicePresetData[], currentFilename: string) => void;
    protected onGlobalProfilesListChange: (list: DataValue[], currentId: string) => void;
    OnCalibrateSelected(): void;
    OnCalibrateClose(): void;
    OnImportNewProfile: () => void;
    OnExportCurrentProfile: () => void;
}
