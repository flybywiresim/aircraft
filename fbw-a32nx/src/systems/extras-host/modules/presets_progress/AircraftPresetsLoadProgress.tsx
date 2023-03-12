// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, EventSubscriber, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';
import { NotificationManager } from '@shared/notification';
import { AircraftPresetsList } from '../common/AircraftPresetsList';

interface SimVars {
    load: number;
    loadProgress: number;
    loadCurrentId: number;
}

enum SimVarSources {
    load = 'L:A32NX_AIRCRAFT_PRESET_LOAD',
    loadProgress = 'L:A32NX_AIRCRAFT_PRESET_LOAD_PROGRESS',
    loadCurrentId = 'L:A32NX_AIRCRAFT_PRESET_LOAD_CURRENT_ID',
}

class AircraftPresetsLoadProgressSimVarPublisher extends SimVarPublisher<SimVars> {
    private static simvars = new Map<keyof SimVars, SimVarDefinition>([
        ['load', { name: SimVarSources.load, type: SimVarValueType.Number }],
        ['loadProgress', { name: SimVarSources.loadProgress, type: SimVarValueType.Number }],
        ['loadCurrentId', { name: SimVarSources.loadCurrentId, type: SimVarValueType.Number }],
    ]);

    public constructor(bus: EventBus) {
        super(AircraftPresetsLoadProgressSimVarPublisher.simvars, bus);
    }
}

/**
 * This class monitors the load progress of the aircraft presets and displays notifications
 * when a preset is being loaded and when the loading process is complete.
 *
 * Potential improvements/extensions:
 * - Display procedure steps in a subtle way - not a notification or popup
 */
export class AircraftPresetsLoadProgress {
    private readonly eventBus: EventBus;

    private subscriber: EventSubscriber<SimVars> = null;

    private notification: NotificationManager;

    private simVarPublisher: AircraftPresetsLoadProgressSimVarPublisher;

    private previousValues: SimVars = {
        load: 0,
        loadProgress: 0,
        loadCurrentId: 0,
    }

    constructor(private readonly bus: EventBus) {
        console.log('AircraftPresetsLoadProgress: Created');
        this.eventBus = bus;
        this.notification = new NotificationManager();
        this.simVarPublisher = new AircraftPresetsLoadProgressSimVarPublisher(this.eventBus);
    }

    public connectedCallback(): void {
        this.subscriber = this.eventBus.getSubscriber<SimVars>();

        this.subscriber.on('load').whenChanged().handle((presetID: number) => {
            this.onLoadIndicationChange(presetID);
            this.previousValues.load = presetID;
        });
        this.subscriber.on('loadProgress').whenChanged().handle((progress: number) => {
            this.previousValues.loadProgress = progress;
        });
        this.subscriber.on('loadCurrentId').whenChanged().handle((stepId: number) => {
            this.previousValues.loadCurrentId = stepId;
        });

        this.simVarPublisher.subscribe('load');
        this.simVarPublisher.subscribe('loadProgress');
        this.simVarPublisher.subscribe('loadCurrentId');
    }

    public startPublish(): void {
        console.log('AircraftPresetsLoadProgress: startPublish()');
        this.simVarPublisher.startPublish();
    }

    public update(): void {
        this.simVarPublisher.onUpdate();
    }

    private onLoadIndicationChange(presetID: number) {
        if (this.previousValues.load === 0 && presetID > 0) {
            this.notification.showNotification({
                title: 'Aircraft Presets',
                message: `Loading Preset "${(AircraftPresetsList.getPresetName(presetID))}"`,
                type: 'MESSAGE',
                duration: 1500,
            });
        } else if (this.previousValues.load > 0 && presetID === 0) {
            this.notification.showNotification({
                title: 'Aircraft Presets',
                message: `Finished loading "${(AircraftPresetsList.getPresetName(this.previousValues.load))}" (or aborted)`,
                type: 'MESSAGE',
                duration: 1500,
            });
        }
    }
}
