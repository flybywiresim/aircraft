declare class InstallationManagerListener extends ViewListener.ViewListener {
    constructor(name: string);
    onUpdateLoadingFinished(callback: any): void;
    onShowUpdateManager(callback: any): void;
    onShowContentManager(callback: any): void;
    onInitInstallPath(callback: any): void;
    onStartDownload(callback: any): void;
    onPauseDownload(callback: any): void;
    onResumeDownload(callback: any): void;
    onShowContinue(callback: any): void;
    onSetDownloadSize(callback: any): void;
    onSetAvailableSpace(callback: any): void;
    onDisableDownloadBtn(callback: any): void;
    onSetGlobalDownloadProgress(callback: any): void;
    onClearWorldUpdateInfo(callback: any): void;
    onShowWorldUpdates(callback: any): void;
    onSetBtnText(callback: any): void;
    onSetOfflineMode(callback: any): void;
    onSetDebugUpdateText(callback: any): void;
    onShowStorageBtn(callback: any): void;
}
declare function RegisterInstallationManagerListener(callback?: any): InstallationManagerListener;
