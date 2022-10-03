declare const ReplayPlayerSpeedMapping: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
};
interface ReplayRecordCameraData {
}
interface ReplayRecordKeyframeData {
    id: number;
    configuration: ReplayRecordCameraData;
}
interface ReplayRecordData {
    totalTime: DataValue;
}
interface ReplayPlayerData {
    isLive: boolean;
    isRecording: boolean;
    selectedKeyframeId: number;
    isCameraRerecording: boolean;
    isPlaying: boolean;
    isRewinding: boolean;
    isForwarding: boolean;
    playbackSpeed: number;
    saveName: string;
    time: DataValue;
    reversedTime: DataValue;
    record: ReplayRecordData;
    cameraKeys: DataValue[];
}
interface TrackSwitchEvent {
    fTimestamp: number;
    iTrackDestId: number;
}
interface EnvSwitchEvent {
    fTimestamp: number;
    sPresetFilename: string;
    dZuluTime: number;
}
interface FlightReplayData {
    iVersion: number;
    sName: string;
    fRecordedTime: number;
    dLatitudeOrigin: number;
    dLongitudeOrigin: number;
    iCameraCount: number;
    iCurrentCamera: number;
    trackSwitchEvents: TrackSwitchEvent[];
    envSwitchEvents: EnvSwitchEvent[];
}
interface ReplayPlayerNewData {
    sFileName: string;
    bIsPlaying: boolean;
    bIsRecording: boolean;
    fTimer: number;
    bPaused: boolean;
    bIsMultiplayer: boolean;
    bUseStartPosition: boolean;
    iReplayCount: number;
    iCurrentFlightReplay: number;
    replaysData: FlightReplayData[];
}
declare class ReplayListener extends ViewListener.ViewListener {
    onUpdate(callback: (data: ReplayPlayerNewData) => void): void;
    loadReplay(): void;
    saveReplay(): void;
    saveReplayAs(): void;
    startReplay(): void;
    pauseReplay(): void;
    toggleReplayReplay(replayReplay: boolean): void;
    stopReplay(): void;
    startRecord(): void;
    startRecordCamera(): void;
    stopRecordCamera(): void;
    cancelRecordCamera(): void;
    stopRecord(): void;
    setStartPosition(): void;
    resetStartPosition(): void;
    loadFile(): void;
    saveFile(): void;
    incrementSaveFile(): void;
    replayName(index: number, name: string): void;
    deleteReplay(index: number): void;
    selectFlight(index: number): void;
    selectCamera(index: number): void;
    seek(percent: number): void;
    setSelectedTrackSwitch(timestamp: number): void;
    setSelectedEnvSwitch(timestamp: number): void;
    createMultiplayers(): void;
    stopMultiplayers(): void;
    loadMultiplayers(): void;
    createMission(): void;
    loadMission(): void;
    askAllAircrafts(): void;
    changePlane(): void;
    startRecordPlaneMission(): void;
    stopRecordPlaneMission(): void;
    playMission(): void;
    pauseMission(): void;
    resetMission(): void;
    stopPlayMission(): void;
    receiveAircraft(): void;
    startRecordCameraMission(): void;
    stopRecordCameraMission(): void;
    toggleGUI(bHideGUI: boolean): void;
    addTrackSwitch(): void;
    addEnvSwitch(): void;
    deleteKeyframe(): void;
    deleteCamera(): void;
    setFirstCameraPosition(): void;
    setSecondCameraPosition(): void;
}
declare function RegisterReplayListener(callback?: any): ReplayListener;
