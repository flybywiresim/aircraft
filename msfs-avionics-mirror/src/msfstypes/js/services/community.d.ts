declare type CommunityPanelBase = CommunityPanelPlayerInfoElement | CommunityPanelNotificationsElement | CommunityPanelFriendsElement;
declare type CommunityPanelPlayerNotificationAcknowldgeAction = null | "click" | "clickDeleteTimer" | "actions" | "hover";
declare type CommunityPanelPlayerNotificationTypeAction = null | "primary" | "warn" | "danger";
declare type CommpunityPanelPlayerNotificationIcon = null | "ICON_INVIT_FRIEND" | "ICON_INVIT_ACCEPTED" | "ICON_DOWNLOAD_COMPLETED" | "ICON_NOTE_SENT" | "COMMUNITY_SEND_NOTE";
declare type PlayerStatus = null | "online" | "away" | "busy" | "offline" | "blocked";
declare enum PlayerStatusFriendStatusDataMapping {
    online = "tOnline",
    away = "tAway",
    busy = "tBusy",
    offline = "tOffline",
    blocked = "tBlocked"
}
declare enum PlayerStatusConnectionModeMapping {
    online = 0,
    offline = 1,
    busy = 2,
    away = 3
}
declare enum PlayerStatusOptionListDisplayMapping {
    online = "m_online_list",
    away = "m_away_list",
    busy = "m_busy_list",
    offline = "m_offline_list",
    blocked = "m_blocked_list"
}
declare enum PlayerStatusOptionListTitleMapping {
    online = "ONLINE",
    away = "AWAY",
    busy = "BUSY",
    offline = "DISCONNECTED",
    blocked = "BLOCKED"
}
interface CommunityPanelPlayerData {
    sName: string;
    sCurrency: string;
    sMoney: string;
    sAvatar: string;
    sStatus: PlayerStatus;
    sBuildVersion: string;
    sRichPresence: string;
    bDisable: boolean;
    bCanSignOut: boolean;
    serverList: TreeDataValue;
}
interface CommunityPanelPlayerAvatarData {
    sName: string;
    sStatus: PlayerStatus;
    sRichPresence: string;
    sAvatar: string;
}
interface CommunityPanelPlayerNotificationsData {
    tNotifications: CommunityPanelPlayerNotificationData[];
}
interface CommunityPanelPlayerNotificationData {
    sId: string;
    bUnseen: boolean;
    bHidden: boolean;
    sTitle: string;
    sDescription: string;
    sIcon: CommpunityPanelPlayerNotificationIcon;
    sContentID: string;
    closeAction: CommunityPanelPlayerNotificationActionData;
    tActions: CommunityPanelPlayerNotificationActionData[];
    acknowledgeOn: CommunityPanelPlayerNotificationAcknowldgeAction;
    sCreationTime: string;
    bFloating: boolean;
}
interface CommunityPanelPlayerNotificationActionData {
    sLabel: string;
    sEvent: string;
    sButtonId: string;
    sType: CommunityPanelPlayerNotificationTypeAction;
    bDisabled: boolean;
}
declare class CommunityPanelNotificationSeenEvent extends Event {
    eventId: string;
    constructor(sId: string);
}
declare class CommunityPanelNotificationDeleteEvent extends Event {
    eventId: string;
    constructor(sId: string);
}
declare class CommunityPanelNotificationFloatingDisplayedEvent extends Event {
    eventId: string;
    constructor(sId: string);
}
interface CommunityPanelLocalPlayersData {
    tLocalPlayers: CommunityPanelLocalPlayerData[];
}
interface CommunityPanelLocalPlayerData {
}
interface CommunityPanelFriendsData {
    tOnline: CommunityPanelFriendData[];
    tAway: CommunityPanelFriendData[];
    tBusy: CommunityPanelFriendData[];
    tOffline: CommunityPanelFriendData[];
    tBlocked: CommunityPanelFriendData[];
    bDisabled: boolean;
}
interface CommunityPanelFriendData {
    sId: string;
    sXuid: string;
    sName: string;
    sAvatar: string;
    sStatus: PlayerStatus;
    sRichPresence: string;
    bIsUser: boolean;
    bIsFriend: boolean;
    bIsFriendOnPlayfab: boolean;
    bIsFriendOnXboxLive: boolean;
    bIsFriendOnSteam: boolean;
    bBlocked: boolean;
    bHasGroup: boolean;
    bIsGroupLeader: boolean;
    bCanViewGamercard: boolean;
    bCanInviteToGroup: boolean;
    bCandExpluseFromGroup: boolean;
    dvPending: DataValue;
    sInviteToCustomServerTitle: string;
    sCancelInviteToCustomServerTitle: string;
    bCanInviteToCustomServer: boolean;
}
interface CommunityPanelGroupsData {
    tGroups: CommunityPanelGroupData[];
}
interface CommunityPanelGroupData {
}
interface CommunityPanelNoteSenderData {
    sId: string;
    sName: string;
    sAvatar: string;
    sStatus: PlayerStatus;
    sRichPresence: string;
}
interface CommunityPanelNoteData {
    iId: number;
    from: CommunityPanelNoteSenderData;
    content: string;
}
declare class CommunityPanelToggleClassnameEvent extends Event {
    className: string;
    value: boolean;
    constructor(className: string, value: boolean);
}
declare class CommunityPanelCreateFriendRequestBySearchEvent extends Event {
    nametag: string;
    constructor(nametag: string);
}
declare class CommunityPanelCreateFriendRequestByID extends Event {
    id: string;
    constructor(id: string);
}
declare class CommunityPanelAskAddFriendEvent extends Event {
    data: CommunityPanelFriendData;
    constructor(data: CommunityPanelFriendData);
}
declare class CommunityPanelAskRemoveFriendEvent extends Event {
    data: CommunityPanelFriendData;
    constructor(data: CommunityPanelFriendData);
}
declare class CommunityPanelUpdateLocalDataEvent extends Event {
    data: CommunityPanelFriendsData;
    constructor(data: CommunityPanelFriendsData);
}
declare class CommunityPanelSendMessageEvent extends Event {
    sIdReceiver: string;
    content: string;
    constructor(sIdReceiver: string, content: string);
}
declare class CommunityPanelSendReportEvent extends Event {
    sId: string;
    content: string;
    constructor(sId: string, content: string);
}
declare class CommunityPanelBlockPlayerEvent extends Event {
    sPlayerId: string;
    bBlocked: boolean;
    constructor(sPlayerId: string, bBlocked: boolean);
}
declare class CommunityPanelInviteFriendToGroupEvent extends Event {
    sPlayerId: string;
    constructor(sPlayerId: string);
}
declare class CommunityPanelInviteFriendToGameModeEvent extends Event {
    sPlayerId: string;
    bAccept: boolean;
    constructor(sPlayerId: string, accept: boolean);
}
declare class CommunityPanelCancelInvitationToGroupEvent extends Event {
    sPlayerId: string;
    constructor(sPlayerId: string);
}
declare class CommunityPanelRemoveFriendFromGroupEvent extends Event {
    sPlayerId: string;
    constructor(sPlayerId: string);
}
declare class CommunityPanelChangedStatusEvent extends Event {
    status: PlayerStatus;
    constructor(status: PlayerStatus);
}
declare class CommunityPanelChangedServerEvent extends Event {
    serverName: string;
    constructor(server: string);
}
declare class CommunityPanelViewGamercardEvent extends Event {
    sXuid: string;
    constructor(sXuid: CommunityPanelViewGamercardEvent['sXuid']);
}
declare class CommunityListener extends ViewListener.ViewListener {
    onUpdateOfflineMode(callback: (offlineMode: boolean) => void): void;
    onSetPlayerData(callback: (data: CommunityPanelPlayerData) => void): void;
    onSetPlayerNotificationData(callback: (data: CommunityPanelPlayerNotificationsData) => void): void;
    onSetLocalPlayersData(callback: (data: CommunityPanelFriendsData) => void): void;
    onSetPlayerFriendData(callback: (data: CommunityPanelFriendsData) => void): void;
    onSetPlayerGroupsData(callback: (data: CommunityPanelFriendsData) => void): void;
    onSetServerList(callback: (data: ServerInfoData[], currentServer: string, offline: boolean) => void): void;
    onAvatarUpdate(callback: () => void): void;
    setNotificationAsSeen(sId: string): void;
    deleteNotification(sId: string): void;
    changePlayerStatus(status: PlayerStatus): void;
    selectPlayerServer(server: string): void;
    onPushNotification(callback: (notification: CommunityPanelPlayerNotificationData) => void): void;
    onUpdateNotification(callback: (notification: CommunityPanelPlayerNotificationData) => void): void;
    onDeleteNotification(callback: (sId: string) => void): void;
    createFriendRequestBySearch(nametag: string): void;
    askAddFriend(data: CommunityPanelFriendData): void;
    askRemoveFriend(data: CommunityPanelFriendData): void;
    blockPlayer(sPlayerId: string, bBlock: boolean): void;
    onCreateFriendRequestBySearchResultSuccess(callback: () => void): void;
    onCreateFriendRequestBySearchResultError(callback: (message: string) => void): void;
    createFriendRequestByID(id: string): void;
    onCreateFriend(callback: (friend: CommunityPanelFriendData) => void): void;
    onUpdateFriend(callback: (friend: CommunityPanelFriendData) => void): void;
    onDestroyFriend(callback: (sID: string) => void): void;
    onCreateGroupFriend(callback: (friend: CommunityPanelFriendData) => void): void;
    onUpdateGroupFriend(callback: (friend: CommunityPanelFriendData) => void): void;
    onDestroyGroupFriend(callback: (sID: string) => void): void;
    onDisplayNote(callback: (note: CommunityPanelNoteData) => void): void;
    sendMessage(sIdReceiver: string, content: string): void;
    getReportTopicList(): void;
    onReportTopicList(callback: (data: DataValue[]) => void): void;
    onForceCloseAll(callback: () => void): void;
    inviteFriendToGroup(sPlayerId: string): void;
    inviteFriendToGameMode(sPlayerId: string, bAccept: boolean): void;
    removeFriendFromGroup(sPlayerId: string): void;
    cancelInvitationToGroup(sPlayerId: string): void;
    leaveGroup(): void;
    onPendingQueueUpdate(callback: (queue: number) => void): void;
    viewGamercard(sXuid: string): void;
}
declare function RegisterCommunityListener(callback?: any): CommunityListener;
