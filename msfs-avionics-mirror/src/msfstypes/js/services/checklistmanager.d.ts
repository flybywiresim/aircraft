declare enum _EEvaluationMode {
    eFree = 0,
    eProgressive = 1,
    eCopilot = 2
}
declare enum _EEvaluationScope {
    eTest = 0,
    eCheckpoint = 1,
    ePage = 2,
    eStep = 3,
    eChecklist = 4
}
declare enum _EHelperFlags {
    eNone = 0,
    eAutoCheck = 1,
    eCopilotAutoCheck = 2
}
declare namespace _CheckpointColors {
    const cAutoComplete: string;
    const cManualValidation: string;
    const cHighlight: string;
    const cPageAutoComplete: string;
}
declare class ChecklistData {
    sDesc: string;
    aGroups: ChecklistPageDataGroup[];
}
declare class ChecklistPageDataGroup {
    sId: string;
    sDesc: string;
    aPages: ChecklistPageData[];
}
declare class ChecklistPageData {
    nPageId: number;
    sDesc: string;
    aCheckpoints: CheckpointData[];
}
declare class ChecklistCompletion {
    aPages: ChecklistPageCompletion[];
    aCheckpoints: CheckpointCompletion[];
    aBlocks: CheckpointCompletion[];
}
declare class ChecklistPageCompletion {
    nPageId: number;
    bUIComplete: boolean;
}
declare class CheckpointCompletion {
    nPageId: number;
    nCheckpointId: number;
    bUISkipped: boolean;
    bUIChecked: boolean;
    bUIHelpAvailable: boolean;
    bUIHelpActivated: boolean;
    bUICopilotAvailable: boolean;
    bManual: boolean;
}
declare class ChecklistEvaluation {
    nCurrentPageId: number;
    nCurrentCheckpointId: number;
    nCursorPageId: number;
    nCursorCheckpointId: number;
    bAutocheckActivated: boolean;
    bCopilotActivated: boolean;
    eCopilotScope: _EEvaluationScope;
}
declare class ChecklistHelpers {
    bAutoCheck: boolean;
}
declare class ChecklistConfiguration {
    oHelpers: ChecklistHelpers;
}
declare class ChecklistFeedback {
    sFooterText: string;
}
declare class ChecklistListener extends ViewListener.ViewListener {
    onSetChecklist(callback: (_oData: ChecklistData, _oCompletion: ChecklistCompletion, _oEvaluation: ChecklistEvaluation, _oConfig: ChecklistConfiguration) => void): void;
    onUpdateChecklistCompletion(callback: (_oCompletion: ChecklistCompletion) => void): void;
    onUpdateChecklistConfig(callback: (_oConfig: ChecklistConfiguration) => void): void;
    onUpdateChecklistEvaluation(callback: (_oMode: ChecklistEvaluation) => void): void;
    onUpdateChecklistFeedback(callback: (_oFeedback: ChecklistFeedback) => void): void;
    onDisplay(callback: (_nPageId: number) => void): void;
    pushManualCheck(_pageId: number, _checkpointId: number, _bool: boolean): void;
    pushManualUncheck(_pageId: number, _checkpointId: number, _bool: boolean): void;
    pushSelectChecklist(_pageId: number, _checkpointId: number): void;
    pushStartCopilotPage(_pageId: number, _checkpointId: number): void;
    pushStopCopilotPage(_pageId: number): void;
    pushPreviousPage(): void;
    pushNextPage(): void;
    pushResetCurrentPage(_pageId: number): void;
    pushToggleAssistance(_pageId: number, _checkpointId: number): void;
    pushSetAssistance(_pageId: number, _checkpointId: number, _value: boolean): void;
}
declare function RegisterChecklistListener(callback?: any): ChecklistListener;
interface IData<T> {
    Reset(): any;
    SetData(_oData: T): any;
}
declare class Evaluation implements IData<ChecklistEvaluation> {
    data: ChecklistEvaluation;
    private m_checklist;
    constructor(_checklist: ChecklistElement);
    Reset(): void;
    SetData(_oData: ChecklistEvaluation): void;
    isAutocheckActivated(): boolean;
    IsAutocheckCurrentPage(_oPage: ChecklistPageElement): boolean;
    IsAutocheckCurrentCheckpoint(_oCheckpoint: ChecklistCheckpointLineElement): boolean;
    IsCopilotCurrentPage(_oPage: ChecklistPageElement): boolean;
    IsCopilotCurrentCheckpoint(_oCheckpoint: ChecklistCheckpointLineElement): boolean;
}
declare class Helpers implements IData<ChecklistHelpers> {
    data: ChecklistHelpers;
    private HelperAutoCheckElement;
    private HelperManualCheck;
    constructor();
    Reset(): void;
    SetData(_oData: ChecklistHelpers): void;
}
declare class Configuration implements IData<ChecklistConfiguration> {
    oHelpers: Helpers;
    constructor();
    Reset(): void;
    SetData(_oData: ChecklistConfiguration): void;
}
