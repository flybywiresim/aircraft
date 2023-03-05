import { EfisNdMode, EfisSide, rangeSettings } from '@shared/NavigationDisplay';
import { ConsumerSubject, EventBus, MappedSubject, Subject } from 'msfssdk';
import { Terrain } from '../../../../../simbridge-client/src';
import { NDSimvars } from '../../NDSimvarPublisher';
import { EcpSimVars } from '../../../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';
import { Arinc429RegisterSubject } from '../../../MsfsAvionicsCommon/Arinc429RegisterSubject';

const MAP_TRANSITION_FRAMERATE = 24;
const MAP_TRANSITION_DURATION = 1.5;
const RERENDER_TIMEOUT = 500;
const METRES_TO_NAUTICAL_MILES = 1852;

export class TerrainMap {
    constructor(
        private readonly bus: EventBus,
        private readonly side: EfisSide,
        private readonly width: number,
        private readonly height: number,
    ) {
        const subs = bus.getSubscriber<NDSimvars>();

        subs.on('latitude').whenChanged().handle((value) => this.pposLat.setWord(value));
        subs.on('longitude').whenChanged().handle((value) => this.pposLon.setWord(value));

        MappedSubject.create(
            ([terrOnNdActive, rangeIndex, modeIndex]) => {
                if (!terrOnNdActive || rangeIndex === -1) {
                    this.visualisation.set(new MapVisualizationData());
                    return;
                } if (this.visualisation.get().RerenderTimeout === undefined) {
                    const newVisualizationData = new MapVisualizationData(this.visualisation);

                    newVisualizationData.RerenderTimeout = RERENDER_TIMEOUT;

                    this.visualisation.set(newVisualizationData);
                }

                const meterPerPixel = Math.round(rangeSettings[rangeIndex] * METRES_TO_NAUTICAL_MILES / height);
                const displayConfiguration = {
                    active: modeIndex !== EfisNdMode.PLAN && terrOnNdActive,
                    mapWidth: width,
                    mapHeight: height,
                    meterPerPixel: meterPerPixel + (10 - (meterPerPixel % 10)),
                    mapTransitionTime: MAP_TRANSITION_DURATION,
                    mapTransitionFps: MAP_TRANSITION_FRAMERATE,
                    arcMode: modeIndex === EfisNdMode.ARC,
                    gearDown: SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum') !== 1,
                };

                Terrain.setDisplaySettings(side, displayConfiguration).catch((_ex) => {
                    return this.visualisation.set(new MapVisualizationData());
                });
            },
            this.terrOnNdActive,
            this.rangeIndex,
            this.modeIndex,
        );
    }

    private readonly terrOnNdActive = Subject.create(true);

    private readonly pposLat = Arinc429RegisterSubject.createEmpty();

    private readonly pposLon = Arinc429RegisterSubject.createEmpty();

    private readonly verticalSpeed = Subject.create(0);

    private readonly trueHeading = Subject.create(0);

    private readonly altitude = Subject.create(0);

    private readonly positionUpdateTimer = Subject.create<number | undefined>(0);

    private readonly potentiometer = ConsumerSubject.create(this.bus.getSubscriber<NDSimvars>().on('potentiometerCaptain'), -1);

    private readonly rangeIndex = ConsumerSubject.create(this.bus.getSubscriber<EcpSimVars>().on('ndRangeSetting'), -1);

    private readonly modeIndex = ConsumerSubject.create(this.bus.getSubscriber<EcpSimVars>().on('ndMode'), EfisNdMode.ARC);

    public visualisation = Subject.create(new MapVisualizationData());

    public positionUpdatedOnce = false;

    async syncWithRenderer(timestamp: number) {
        setTimeout(() => {
            Terrain.ndMapAvailable(this.side, timestamp).then((available) => {
                if (!available && this.terrOnNdActive.get()) {
                    this.syncWithRenderer(timestamp);
                    return;
                }

                Terrain.ndTransitionMaps(this.side, timestamp).then((transitionMaps) => {
                    Terrain.ndTerrainRange(this.side, timestamp).then((rangeData) => {
                        if ('minElevation' in rangeData && rangeData.minElevation !== Infinity && 'maxElevation' in rangeData && rangeData.maxElevation !== Infinity) {
                            let minimumColor = 'rgb(0, 255, 0)';
                            if (rangeData.minElevationIsWarning) {
                                minimumColor = 'rgb(255, 255, 0)';
                            } else if (rangeData.minElevationIsCaution) {
                                minimumColor = 'rgb(255, 0, 0)';
                            }
                            let maximumColor = 'rgb(0, 255, 0)';
                            if (rangeData.maxElevationIsWarning) {
                                maximumColor = 'rgb(255, 255, 0)';
                            } else if (rangeData.maxElevationIsCaution) {
                                maximumColor = 'rgb(255, 0, 0)';
                            }

                            const visualisation = this.visualisation.get();

                            if (visualisation) {
                                visualisation.NextMinimumElevation = { altitude: rangeData.minElevation, color: minimumColor };
                                visualisation.NextMaximumElevation = { altitude: rangeData.maxElevation, color: maximumColor };

                                visualisation.Version.set(visualisation.Version.get() + 1);
                            }
                        } else if (this.visualisation.get()) {
                            this.visualisation.get().NextMinimumElevation = { altitude: Infinity, color: 'rgb(0, 0, 0)' };
                            this.visualisation.get().NextMaximumElevation = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

                            this.visualisation.get().Version.set(this.visualisation.get().Version.get() + 1);
                        }

                        const newVisualisation = new MapVisualizationData(this.visualisation.get());

                        newVisualisation.MapTransitionData = transitionMaps;
                        if (newVisualisation.TerrainMapBuffer[0].opacity === 0.01) {
                            newVisualisation.TerrainMapBuffer[0].data = transitionMaps[transitionMaps.length - 1];
                        } else {
                            newVisualisation.TerrainMapBuffer[1].data = transitionMaps[transitionMaps.length - 1];
                        }

                        newVisualisation.Version.set(newVisualisation.Version.get() + 1);

                        this.visualisation.set(newVisualisation);
                    }).catch(() => {
                        this.visualisation.set(new MapVisualizationData());
                    });
                }).catch(() => {
                    this.visualisation.set(new MapVisualizationData());
                });
            }).catch(() => {
                this.visualisation.set(new MapVisualizationData());
            });
        }, 200);
    }

    mapTransitionDone() {
        const rerenderVisualization = new MapVisualizationData(this.visualisation.get());

        if (rerenderVisualization.TerrainMapBuffer[0].opacity === 0.01) {
            rerenderVisualization.TerrainMapBuffer[0].opacity = 1;
            rerenderVisualization.TerrainMapBuffer[1].opacity = 0.01;
        } else {
            rerenderVisualization.TerrainMapBuffer[0].opacity = 0.01;
            rerenderVisualization.TerrainMapBuffer[1].opacity = 1;
        }

        rerenderVisualization.MapTransitionData = [];
        rerenderVisualization.MinimumElevation = rerenderVisualization.NextMinimumElevation;
        rerenderVisualization.MaximumElevation = rerenderVisualization.NextMaximumElevation;
        rerenderVisualization.RerenderTimeout = RERENDER_TIMEOUT;

        this.visualisation.set(rerenderVisualization);
    }

    update(deltaTime) {
        const positionUpdateTimer = this.positionUpdateTimer.get();

        if (positionUpdateTimer !== undefined) {
            if (positionUpdateTimer > 0) {
                this.positionUpdateTimer.set(Math.max(0, positionUpdateTimer - deltaTime));
            } else if (this.pposLat.get().isNormalOperation() && this.pposLon.get().isNormalOperation()) {
                this.positionUpdateTimer.set(undefined);

                Terrain.mapdataAvailable().then((available) => {
                    if (available && this.side === 'L') {
                        Terrain.setCurrentPosition(
                            this.pposLat.get().value,
                            this.pposLon.get().value,
                            this.trueHeading.get(),
                            Math.round(this.altitude.get()),
                            Math.round(this.verticalSpeed.get() * 60.0),
                        ).then(() => {
                            this.positionUpdatedOnce = true;
                        }).catch();
                    }

                    this.positionUpdateTimer.set(1000);
                }).catch((e) => {
                    console.error(e);
                });
            }
        }

        if (!this.positionUpdatedOnce) {
            return;
        }

        const visualisation = this.visualisation.get();

        if (this.terrOnNdActive.get() && visualisation.RerenderTimeout !== undefined) {
            if (visualisation.RerenderTimeout <= 0) {
                const newVisualizationData = new MapVisualizationData(visualisation);
                newVisualizationData.RerenderTimeout = undefined;
                this.visualisation.set(newVisualizationData);

                Terrain.renderNdMap(this.side).then((timestamp) => {
                    if (timestamp > 0) {
                        this.syncWithRenderer(timestamp);
                    } else {
                        // clear all data
                        this.visualisation.set(new MapVisualizationData());
                    }
                }).catch((_ex) => this.visualisation.set(new MapVisualizationData()));
            } else {
                const newVisualizationData = new MapVisualizationData(visualisation);

                if (newVisualizationData.RerenderTimeout !== undefined) {
                    newVisualizationData.RerenderTimeout -= deltaTime;
                }

                this.visualisation.set(newVisualizationData);
            }
        } else if (!this.terrOnNdActive.get()) {
            this.visualisation.set(new MapVisualizationData(visualisation));
        }
    }
}

export class MapVisualizationData {
    public TerrainMapBuffer: { opacity: number, data: string }[] = [{ opacity: 0.01, data: '' }, { opacity: 0.01, data: '' }];

    public MapTransitionData: string[] = [];

    public RerenderTimeout: number | undefined = undefined;

    public NextMinimumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    public NextMaximumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    public MinimumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    public MaximumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    public Version = Subject.create(0);

    constructor(...args) {
        if (args.length !== 0 && args[0] instanceof MapVisualizationData) {
            this.TerrainMapBuffer = args[0].TerrainMapBuffer;
            this.MapTransitionData = args[0].MapTransitionData;
            this.RerenderTimeout = args[0].RerenderTimeout;
            this.NextMinimumElevation = args[0].NextMinimumElevation;
            this.NextMaximumElevation = args[0].NextMaximumElevation;
            this.MinimumElevation = args[0].MinimumElevation;
            this.MaximumElevation = args[0].MaximumElevation;
        }
    }
}
