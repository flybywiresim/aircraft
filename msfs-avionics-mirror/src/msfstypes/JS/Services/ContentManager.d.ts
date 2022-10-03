interface SPackageInfo {
    sPackageID: string;
    sPackageFriendlyID: string;
    multiSelectState: CheckboxData;
    sImagePath: string;
    sTitle: string;
    sSubtitle: string;
    sAuthor: string;
    sStatus: string;
    sLocalVersion: string;
    sServerVersion: string;
    sDownloadState: string;
    sDownloadSubstate: string;
    fDownloadProgress: number;
    currentSize: DataValue;
    downloadSize: DataValue;
    additionalSize: DataValue;
    bHidden: boolean;
    bCommunity: boolean;
    bThirdParty: boolean;
    bIsExpansion: boolean;
    bIsPartOfExpansion: boolean;
    bIsStandard: boolean;
    sBundleName: boolean;
    bIsRetailable: boolean;
}
declare class ContentManagerListener extends ViewListener.ViewListener {
    constructor(name: string);
    onSetDownloadSize(callback: any): void;
    onSetDeleteSize(callback: any): void;
    onSetGlobalDownloadProgress(callback: any): void;
    onSetDownloadablePackages(callback: any): void;
    onUpdatePackage(callback: any): void;
    onSetPackageDownloadProgress(callback: any): void;
    onSetTotalInstallationSize(callback: any): void;
    onSetError(callback: any): void;
    onShowStorageBtn(callback: any): void;
    onBeginDownload(callback: any): void;
    onHideDownload(callback: any): void;
    onShowDelete(callback: any): void;
    onShowCancel(callback: any): void;
    onSetDownloadMode(callback: any): void;
    onSetToggleState(callback: any): void;
    onSetNbItemSelected(callback: any): void;
    onSetFocusedItem(callback: any): void;
    onSetLoading(callback: any): void;
    onSetBrowserFiltersData(callback: (data: MarketBrowserFiltersData) => void): void;
    toggleFilter(id: string): void;
    sortBy(id: number): void;
    onSetViewMode(callback: any): void;
    onSetOfflineMode(callback: any): void;
    onHideFilters(callback: any): void;
    onSetBtnText(callback: any): void;
}
declare function RegisterContentManagerListener(callback?: any): ContentManagerListener;
declare class PackageEvent extends Event {
    sEventType: string;
    sPackageId: string;
    constructor(_eventType: string, _sPackageId: string);
}
