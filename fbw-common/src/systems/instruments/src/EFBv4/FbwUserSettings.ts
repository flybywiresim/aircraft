import {
    DefaultUserSettingManager,
    EventBus,
    UserSettingManager,
    UserSettingSaveManager,
    UserSettingValue,
} from '@microsoft/msfs-sdk';

const fbwUserSettings = [
    {
        name: 'fbwTelexEnabled',
        defaultValue: false as boolean,
    },
    {
        name: 'fbwSettingsVersion',
        defaultValue: 0 as number,
    },
    {
        name: 'fbwEfbLanguage',
        defaultValue: 'en' as string,
    },
] as const;

export type FbwUserSettingsDefs = {
    readonly [Item in typeof fbwUserSettings[number]as Item['name']]: Item['defaultValue'];
}

type LegacySettingMapping = {
    newSettingName: keyof FbwUserSettingsDefs & string,
    valueMapper?: (value: string) =>UserSettingValue,
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
    private static LEGACY_SETTINGS_TO_NEW_SETTINGS: Record<string, LegacySettingMapping> = {
        A32NX_CONFIG_TELEX_STATUS: {
            newSettingName: 'fbwTelexEnabled',
            valueMapper: (value) => value === 'ENABLED',
        },
        A32NX_EFB_LANGUAGE: { newSettingName: 'fbwEfbLanguage' },
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
