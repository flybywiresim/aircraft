export namespace PageEnum {
    export enum MainPage {
        Dashboard,
        Dispatch,
        Ground,
        Performance,
        Navigation,
        ATC,
        Failures,
        Checklists,
        Presets,
        Settings,
    }

    export enum DispatchPage {
        OFP,
        Overview
    }

    export enum WeatherWidgetPage {
        None,
        Some,
        Error,
    }

    export enum BatteryLevel {
        Charging = 0,
        Warning = 8,
        Low = 13,
        LowMedium = 37,
        Medium = 62,
        HighMedium = 87,
        Full = 100,
    }
}
