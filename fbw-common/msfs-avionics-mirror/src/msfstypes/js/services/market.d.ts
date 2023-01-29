declare enum MarketBrowserFiltersItemElementIconMap {
    all = "ICON_ALL",
    cat_wishlist = "ICON_WISHLIST",
    cat_wishlist_full = "ICON_WISHLIST_FULL",
    cat_master = "ICON_CATEGORY_MASTER",
    cat_sub = "ICON_CATEGORY_SUB",
    cat_hide_owned = "ICON_HIDE_OWNED",
    cat_msfs = "ICON_EXPANSION",
    car_sale = "ICON_SALE",
    cat_platform = "ICON_PLATEFORME",
    cat_rating = "ICON_RATINGS",
    cat_creators = "ICON_CREATORS",
    cat_greateorequal = "ICON_GREATEREQUAL"
}
declare enum MarketDisplayViewFilter {
    NONE = 0,
    PAID = 1,
    FREE = 2,
    WORLD_UPDATE = 4,
    ALL = 7
}
interface MarketTags {
    id: number;
    label: string;
    icon: string;
}
interface MarketCategory {
    id: string;
    label: string;
    icon: string;
}
interface MarketItemDetailsData {
    type: string;
    htmlTag: string;
    url: string;
    JSONData: string;
}
interface MarketItemImage {
    thumbnail: string;
    fullres: string;
    videoPath: string;
}
declare class MarketItem {
    id: string;
    storeId: string;
    name: string;
    category: string;
    tags: string[];
    icon: string;
    author: string;
    description: string;
    rate: MarketItemRateData;
    availablePlatformList: string[];
    isAvailableOnCurrentPlatform: boolean;
    isInitComplete: boolean;
    isNew: boolean;
    isVisited: boolean;
    isUpdated: boolean;
    isOwned: boolean;
    isPartialyOwned: boolean;
    isPreview: boolean;
    isFavorite: boolean;
    isBundle: boolean;
    isHardBundle: boolean;
    isDynamicBundle: boolean;
    isInstalled: boolean;
    isPartialyInstalled: boolean;
    isDownloading: boolean;
    hasRightToBeDownloaded: boolean;
    hasRightToBeDownloadedErr: string;
    warns: MarketItemWarnData[];
    downloadData: MarketItemDownloadData;
    purchaseData: MarketItemPurchaseData;
    realPrice: DataValue;
    discountedRealPrice: DataValue;
    discountedRealPricePercentage: number;
    virtualPrice: DataValue;
    discountedVirtualPrice: DataValue;
    discountedVirtualPricePercentage: number;
    discountRemainingTime: DataValue;
    coinsRedeemSentence: string;
    image: MarketItemImage;
    image_main: MarketItemImage;
    image_secondary: MarketItemImage;
    medias: MarketItemImage[];
    detailData: MarketItemDetailsData[];
}
declare class MarketItemRateData {
    show: boolean;
    pending: boolean;
    disabled: boolean;
    recent: DataValue[];
    global: DataValue[];
    user: DataValue;
}
declare enum eMarketItemWarnType {
    INFO = 0,
    WARNING = 1,
    DANGER = 2
}
interface MarketItemWarnData {
    messages: string[];
    lockDownload: boolean;
    lockBuy: boolean;
    type: eMarketItemWarnType;
    buttons: NewPushButtonData[];
}
interface MarketItemDownloadData {
    isPaused: boolean;
    progress: number;
    downloadStatus: string;
    downloadSpeed: DataValue;
    downloadSize: DataValue;
    downloadedSize: DataValue;
}
interface MarketItemPurchaseData {
    isPurchasing: boolean;
    isPipeLock: boolean;
    status: string;
}
declare class MarketBundleData {
    title: string;
    items: MarketItem[];
    purchaseData: DataValue[];
    setJSON(json: string): void;
}
interface MarketItemSpecsData {
    values: DataValue[];
}
interface MarketItemTextData {
    title: string;
    text: string;
    media: MediaContentData;
    mediaPosition: string;
}
interface MarketItemMediaSliderData {
    title: string;
    medias: MediaContentData[];
}
interface MarketItemMediaScrollerData {
    title: string;
    medias: MediaContentData[];
}
interface MarketItemLiveriesItemData {
    name: string;
    media: MediaContentData;
    primaryHexaColor: string;
    secondaryHexaColor: string;
}
interface MarketItemLiveriesData {
    title: string;
    liveries: MarketItemLiveriesItemData[];
}
interface MarketItemSupportContactData {
    label: string;
    url: string;
}
interface MarketItemSupportData {
    title: string;
    contact: MarketItemSupportContactData;
    contacts: MarketItemSupportContactData[];
}
interface MarketItemListData {
    title: string;
    messageType: string | "success" | "warning" | "error";
    message: string;
    buttonTitle: string;
    buttonEvent: string;
    items: MarketItem[];
}
interface MarketBrowserMetaData {
    title: string;
    displayViewFilter: MarketDisplayViewFilter;
    viewFilterButtons: MarketBrowserMetaViewFilterButton[];
}
interface MarketBrowserMetaViewFilterButton {
    title: string;
    filter: MarketDisplayViewFilter;
    hasNewContent: boolean;
}
interface MarketBrowserData {
    count: number;
    items: MarketItem[];
}
interface MarketBrowserFiltersData {
    search: string;
    orderBy: number;
    orders: DataValue[];
    filtersCount: number;
    filters: MarketBrowserFilterData[];
}
interface MarketBrowserFilterData {
    id: string;
    label: string;
    icon: string;
    numberResults: number;
    checked: boolean;
    disabled: boolean;
    template: MarketBrowserFilterTemplate;
    hasSeparator: boolean;
    isExclusive: boolean;
    isVisible: boolean;
    filters: MarketBrowserFilterData[];
}
declare enum MarketBrowserFilterTemplate {
    TOGGLE = 0,
    TOGGLE_PUSH = 1,
    LIST = 2
}
declare class MarketBundleBuyConfirmParams {
    id: string;
    download: boolean;
    dependencies: DataValue[];
    hasRightToBeDownloaded: boolean;
    hasRightToBeDownloadedErr: string;
    constructor(json: string);
}
declare class MarketBrowserFilterSelectEvent extends Event {
    filter_id: string;
    constructor(filter_id: string);
}
declare class MarketBrowserItemSelectEvent extends Event {
    marketItemId: string;
    storeId: string;
    constructor(marketItemId: string, storeId: string);
}
declare class MarketItemFavoriteEvent extends Event {
    marketItemId: string;
    marketItemStoreId: string;
    constructor(marketItemId: string, marketItemStoreId?: string);
}
declare class MarketItemFloaterButtonSelectEvent extends Event {
    marketItemId: string;
    constructor(marketItemId: string);
}
declare abstract class MarketListener extends ViewListener.ViewListener {
    protected fetch(triggerEvent: string, onEvent: string): Promise<any[]>;
}
declare class MarketBrowserListener extends MarketListener {
    askBrowserData(storeId?: string, itemId?: string): void;
    askBrowserMetaData(): void;
    askBrowserFilterData(): void;
    askBrowserCompleteData(id: string): void;
    onSetBrowserData(callback: (data: MarketBrowserData) => void): void;
    onSetBrowserItemData(callback: (data: MarketItem) => void): void;
    onSetBrowserItemDiscountRemainingTimeData(callback: (marketItemId: string, value: DataValue) => void): void;
    onSetBrowserMetaData(callback: (data: MarketBrowserMetaData) => void): void;
    onSetBrowserSearch(callback: (search: string) => void): void;
    onSetBrowserFiltersData(callback: (data: MarketBrowserFiltersData) => void): void;
    sortBy(id: number): void;
    updateSearch(search: string): void;
    updateViewFilter(filter: MarketDisplayViewFilter): void;
    toggleFilter(id: string): void;
    clearFilters(): void;
    openMarketBrowser(search?: string): void;
    openMarketItem(id: string, storeId?: string): void;
    toggleFavoriteMarketItem(id: string, storeid?: string): void;
}
declare function RegisterMarketListener(callback?: any): MarketBrowserListener;
declare class MarketItemListener extends MarketListener {
    onSetData(callback: (data: MarketItem) => void): void;
    onSetBaseData(callback: (data: MarketItem) => void): void;
    onSetBundleData(callback: (bundleData: MarketItemDetailsData) => void): void;
    onSetDownloadData(callback: (bIsDownloading: boolean, data: MarketItemDownloadData) => void): void;
    onSetPurchasedata(callback: (data: MarketItemPurchaseData) => void): void;
    onConfirmBuy(callback: (data: MarketBundleBuyConfirmParams) => void): void;
    onPurchasePipeInProgress(callback: () => void): void;
    onPurchasePipeFinished(callback: (success: boolean, errorCode: string) => void): void;
    onPurchasePipelockError(callback: (data: string) => void): void;
    buy(bundleMarketId: string, download: boolean): void;
    confirmBuy(bundleMarketId: string, download: boolean): void;
    openMarketItem(marketItemId: string, storeId?: string): void;
    onConfirmBuyButtonClick(callback: (data: string) => void): void;
    openContentMgr(marketItemId: string): void;
    downloadMarketItem(marketItemId: string): void;
    pauseDownloading(marketItemId: string): void;
    cancelDownloading(marketItemId: string): void;
    rateItem(marketItemId: string, value: number): void;
    openRateDetails(): void;
    toggleFavoriteMarketItem(id: string, storeId: string): void;
}
declare function RegisterMarketItemListener(callback?: any): MarketItemListener;
