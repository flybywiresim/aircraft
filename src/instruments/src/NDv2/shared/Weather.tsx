import { EfisNdMode, rangeSettings } from '@shared/NavigationDisplay';
import { EcpSimVars } from 'instruments/src/MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';
import {
    ArraySubject, ConsumerSubject, DisplayComponent, EventBus,
    FSComponent, MapBingLayer, MapSystemBuilder, MapSystemKeys, MapWxrModule, SetSubject, Subject, UnitType, VNode,
} from 'msfssdk';
import { NDSimvars } from '../NDSimvarPublisher';

export class WeatherComponent extends DisplayComponent<{bus: EventBus, mode: Subject<number>}> {
    private bingClass = SetSubject.create('arc');

    private readonly mapRangeSub = ConsumerSubject.create(this.props.bus.getSubscriber<EcpSimVars>().on('ndRangeSetting').whenChanged(), -1);

    private compiledMap = MapSystemBuilder.create(this.props.bus)
        // .withFollowAirplane()
        .withModule(MapSystemKeys.Weather, () => new MapWxrModule())
        .withLayer<MapBingLayer, {
    [MapSystemKeys.Weather]: MapWxrModule
    }>(MapSystemKeys.Bing, (context) => {
        const weather = context.model.getModule('weather');

        return (
            <MapBingLayer
                model={context.model}
                mapProjection={context.projection}
                bingId="A32NX_ND_WEATHER"
                reference={Subject.create(EBingReference.SEA)}
                earthColors={ArraySubject.create()}
                isoLines={Subject.create(false)}
                wxrMode={weather.wxrMode}
                mode={EBingMode.PLANE}
                delay={0}
                class={this.bingClass}
            />
        );
    }, 0)
        .withProjectedSize(new Float64Array([768, 768]))
        .build();

     private weatherModule = this.compiledMap.context.model.getModule(MapSystemKeys.Weather) as MapWxrModule;

     private range = 10;

     public onAfterRender(node: VNode): void {
         super.onAfterRender(node);
         const map = this.compiledMap.context.getLayer('bing') as MapBingLayer;

         this.compiledMap.context.projection.set({ range: UnitType.NMILE.convertTo(20, UnitType.GA_RADIAN) });

         this.weatherModule.weatherRadarMode.set(EWeatherRadar.HORIZONTAL);
         this.weatherModule.isEnabled.set(true);
         this.weatherModule.weatherRadarArc.set(UnitType.DEGREE.createNumber(360));

         const sub = this.props.bus.getSubscriber<NDSimvars>();

         sub.on('weatherActive').whenChanged().handle((w) => {
             if (w === 0) {
                 this.weatherModule.isEnabled.set(true);
                 this.compiledMap.ref.instance.wake();
                 this.compiledMap.context.projection.set({ range: UnitType.NMILE.convertTo(this.range, UnitType.GA_RADIAN) });
                 map.onUpdated(0, 0);
             } else {
                 this.weatherModule.isEnabled.set(false);
                 this.compiledMap.ref.instance.sleep();
             }
         });

         this.mapRangeSub.sub((r) => {
             this.range = rangeSettings[r];
             this.compiledMap.context.projection.set({ range: UnitType.NMILE.convertTo(this.range, UnitType.GA_RADIAN) });
             map.onUpdated(0, 0);
         });

         this.props.mode.sub((m) => {
             if (m === EfisNdMode.ARC) {
                 this.bingClass.add('arc');
                 this.bingClass.delete('rose');
             } else if (m === EfisNdMode.ROSE_ILS || EfisNdMode.ROSE_NAV || EfisNdMode.ROSE_VOR) {
                 this.bingClass.add('rose');
                 this.bingClass.delete('arc');
             } else {
                 this.bingClass.delete('arc');
                 this.bingClass.delete('rose');
             }
         });

         setTimeout(() => {
             map.onUpdated(0, 0);
         }, 100);
     }

     render(): VNode {
         return (
             <div class="WeatherWrapper" display={this.props.mode.map((m) => (m === EfisNdMode.PLAN ? 'none' : 'inline'))}>
                 { this.compiledMap.map }
             </div>

         );
     }
}
