import {
    DefaultUserSettingManager,
    EventBus,
    UserSettingManager,
    UserSettingSaveManager,
    UserSettingValue,
} from '@microsoft/msfs-sdk';

export enum InitBaroUnit {
    Auto = 'AUTO',
    InHg = 'IN HG',
    Hpa = 'HPA',
}

export enum FpSyncMode {
    None = 'NONE',
    Load = 'LOAD',
    Save = 'SAVE',
}

export enum SimBridgeMode {
    AutoOn = 'AUTO ON',
    AutoOff = 'AUTO OFF',
    PermOff = 'PERM OFF',
}

const fbwUserSettings = [
    {
        name: 'fbwSettingsVersion',
        defaultValue: 0 as number,
    },
    {
        name: 'fbwTelexEnabled',
        defaultValue: false as boolean,
    },
    {
        name: 'fbwInitBaroUnit',
        defaultValue: InitBaroUnit.Auto as InitBaroUnit,
    },
    {
        name: 'fbwSimbriefOverrideUserID',
        defaultValue: -1 as number,
    },
    {
        name: 'fbwDynamicRegistrationDecal',
        defaultValue: false as boolean,
    },
    {
        name: 'fbwFpSync',
        defaultValue: FpSyncMode.Load as FpSyncMode,
    },
    {
        name: 'fbwSimBridgeEnabled',
        defaultValue: SimBridgeMode.AutoOn as SimBridgeMode,
    },
    {
        name: 'fbwSimbridgeRemote',
        defaultValue: false as boolean,
    },
    {
        name: 'fbwSimBridgeIP',
        defaultValue: 'localhost' as string,
    },
    {
        name: 'fbwSimBridgePort',
        defaultValue: 8380 as number,
    },
    {
        name: 'fbwRadioReceiverUsageEnabled',
        defaultValue: false as boolean,
    },
    {
        name: 'fbwModelWheelChocksEnabled',
        defaultValue: true as boolean,
    },
    {
        name: 'fbwModelConesEnabled',
        defaultValue: true as boolean,
    },
    {
        name: 'fbwGsxFuelSyncEnabled',
        defaultValue: false as boolean,
    },
    {
        name: 'fbwGsxPayloadSyncEnabled',
        defaultValue: false as boolean,
    },
    {
        name: 'fbwEfbLanguage',
        defaultValue: 'en' as string,
    },
    {
        name: 'fbwEfbRemindersOrder',
        defaultValue: [
            'Weather',
            'Pinned Charts',
            'Maintenance',
            'Checklists',
        ].toString(),
    },
] as const;

export type FbwUserSettingsDefs = {
    readonly [Item in typeof fbwUserSettings[number] as Item['name']]: Item['defaultValue'];
}

type LegacySettingMapping = {
    newSettingName: keyof FbwUserSettingsDefs & string,
    valueMapper?: (value: string) => UserSettingValue,
}

export class FbwUserSettings {
    private static INSTANCE: DefaultUserSettingManager<FbwUserSettingsDefs> | undefined;

    public static getManager(bus: EventBus): UserSettingManager<FbwUserSettingsDefs> {
        if (FbwUserSettings.INSTANCE === undefined) {
            FbwUserSettings.INSTANCE = new DefaultUserSettingManager<FbwUserSettingsDefs>(bus, fbwUserSettings);
        }

        return FbwUserSettings.INSTANCE;
    }
}

export class FbwUserSettingsSaveManager extends UserSettingSaveManager {
    private static readonly LEGACY_SETTINGS_TO_NEW_SETTINGS: Record<string, LegacySettingMapping> = {
        // TODO AircraftOptionsPinProgramsPage
        // TODO RealismPage
        // TODO ThirdPartyOptionsPage
        // TODO AtsuAocPage
        // TODO AudioPage
        // TODO FlyPadPage

        A32NX_CONFIG_TELEX_STATUS: {
            newSettingName: 'fbwTelexEnabled',
            valueMapper: (value) => value === 'ENABLED',
        },
        A32NX_CONFIG_INIT_BARO_UNIT: { newSettingName: 'fbwInitBaroUnit' },
        A32NX_CONFIG_OVERRIDE_SIMBRIEF_USERID: { newSettingName: 'fbwSimbriefOverrideUserID' },
        A32NX_DYNAMIC_REGISTRATION_DECAL: {
            newSettingName: 'fbwDynamicRegistrationDecal',
            valueMapper: (value) => value === '1',
        },
        A32NX_FP_SYNC: { newSettingName: 'fbwFpSync' },
        A32NX_CONFIG_SIMBRIDGE_ENABLED: { newSettingName: 'fbwSimBridgeEnabled' },
        A32NX_CONFIG_SIMBRIDGE_REMOTE: {
            newSettingName: 'fbwSimbridgeRemote',
            valueMapper: (value) => value !== 'local',
        },
        A32NX_CONFIG_SIMBRIDGE_IP: { newSettingName: 'fbwSimBridgeIP' },
        A32NX_CONFIG_SIMBRIDGE_PORT: {
            newSettingName: 'fbwSimBridgePort',
            valueMapper: (value) => parseInt(value),
        },
        A32NX_RADIO_RECEIVER_USAGE_ENABLED: {
            newSettingName: 'fbwRadioReceiverUsageEnabled',
            valueMapper: (value) => value === '1',
        },
        A32NX_MODEL_WHEELCHOCKS_ENABLED: {
            newSettingName: 'fbwModelWheelChocksEnabled',
            valueMapper: (value) => value === '1',
        },
        A32NX_MODEL_CONES_ENABLED: {
            newSettingName: 'fbwModelConesEnabled',
            valueMapper: (value) => value === '1',
        },
        A32NX_GSX_FUEL_SYNC: {
            newSettingName: 'fbwGsxFuelSyncEnabled',
            valueMapper: (value) => value === '1',
        },
        A32NX_GSX_PAYLOAD_SYNC: {
            newSettingName: 'fbwGsxPayloadSyncEnabled',
            valueMapper: (value) => value === '1',
        },
        A32NX_EFB_LANGUAGE: { newSettingName: 'fbwEfbLanguage' },
        A32NX_REMINDER_WIDGET_ORDERED_KEYS: { newSettingName: 'fbwEfbRemindersOrder' },
    };

    constructor(private bus: EventBus) {
        const FbwUserSettingsManager = FbwUserSettings.getManager(bus);

        const settings = [
            ...FbwUserSettingsManager.getAllSettings(),
        ];

        super(settings, bus);
    }

    public tryPortLegacyA32NXSettings(): void {
        const version = FbwUserSettings.getManager(this.bus).getSetting('fbwSettingsVersion').get();

        if (version !== 0) {
            console.log('[FbwUserSettingsSaveManager](portLegacyA32NXSettings) Version is not 0, no need to port anything');
        }

        console.log('[FbwUserSettingsSaveManager](portLegacyA32NXSettings) Version is 0, looking for legacy settings to port...');

        const oldData = GetDataStorage().searchData('A32NX_');

        if (oldData === null) {
            return;
        }

        for (const oldSetting of oldData) {
            let formattedData = oldSetting.data;

            if (formattedData.length === 0) {
                formattedData = '<empty string>';
            }

            console.log(`[FbwUserSettingsSaveManager](portLegacyA32NXSettings) ${oldSetting.key} = ${formattedData}`);

            const newSetting = FbwUserSettingsSaveManager.LEGACY_SETTINGS_TO_NEW_SETTINGS[oldSetting.key];

            if (!newSetting) {
                console.warn(`[FbwUserSettingsSaveManager](portLegacyA32NXSettings) No equivalent new setting found for ${oldSetting.key}`);
                continue;
            }

            const mappedValue = newSetting.valueMapper?.(oldSetting.data) ?? oldSetting.data;

            console.info(
                `[FbwUserSettingsSaveManager](portLegacyA32NXSettings) newSetting: ${newSetting.newSettingName}, mappedValue = ${mappedValue}`,
            );
        }
    }
}
