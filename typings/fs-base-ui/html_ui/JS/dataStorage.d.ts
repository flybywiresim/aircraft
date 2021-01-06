declare global {
    interface DataStorage {
        getData(key: string): any;
        searchData(key: string): DataStorageSearchData[] | null;
        setData(key: string, data: any): any;
        deleteData(key: string): any;
    }

    interface DataStorageSearchData {
        key: any;
        data: any;
    }

    function OnDataStorageReady(): void;
    function GetDataStorage(): DataStorage | void;
    function GetStoredData(key: string): any;
    function SearchStoredData(key: string): any;
    function SetStoredData(key: string, data: any): any;
    function DeleteStoredData(key: string): any;
}

export {};
