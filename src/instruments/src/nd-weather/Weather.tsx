import { NDWeatherSimvars } from 'instruments/src/nd-weather/NDWeatherSimvarPublisher';
import { ArraySubject, DisplayComponent, EventBus, FSComponent, MapBingLayer, MapSystemBuilder, MapSystemKeys, MapWxrModule, Subject, UnitType, VNode } from 'msfssdk';

export class WeatherComponent extends DisplayComponent<{bus: EventBus}> {
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
                bingId="A32NX"
                reference={Subject.create(EBingReference.SEA)}
                earthColors={ArraySubject.create()}
                isoLines={Subject.create(false)}
                wxrMode={weather.wxrMode}
                mode={EBingMode.PLANE}
                delay={0}
            />
        );
    }, 0)
        .withProjectedSize(new Float64Array([768, 768]))
        .build();

     private weatherModule = this.compiledMap.context.model.getModule(MapSystemKeys.Weather) as MapWxrModule;

     private range = 10;

     public onAfterRender(node: VNode): void {
         super.onAfterRender(node);
         //   this.compiledMap.ref.instance.wake();

         //   Coherent.call('SET_MAP_PARAMS', 42, new LatLongAlt(0, 0), 20000, 1);

         // this.compiledMap.context.getLayer(MapSystemKeys.Weather).isEnabled.set(true);
         const map = this.compiledMap.context.getLayer('bing') as MapBingLayer;
         this.compiledMap.context.projection.set({ range: UnitType.NMILE.convertTo(20, UnitType.GA_RADIAN) });

         this.weatherModule.weatherRadarMode.set(EWeatherRadar.HORIZONTAL);
         this.weatherModule.isEnabled.set(true);
         this.weatherModule.weatherRadarArc.set(UnitType.DEGREE.createNumber(360));

         const sub = this.props.bus.getSubscriber<NDWeatherSimvars>();

         sub.on('weatherActive').whenChanged().handle((w) => {
             if (w === 0) {
                 //  this.weatherModule.isEnabled.set(true);
                 this.compiledMap.ref.instance.wake();
                 this.compiledMap.context.projection.set({ range: UnitType.NMILE.convertTo(this.range, UnitType.GA_RADIAN) });
                 map.onUpdated(0, 0);
             } else {
                 //     this.weatherModule.isEnabled.set(false);
                 this.compiledMap.ref.instance.sleep();
             }
         });

         sub.on('ndRange').whenChanged().handle((r) => {
             if (r === 0) {
                 this.range = 10;
             } else if (r === 1) {
                 this.range = 20;
             } else if (r === 2) {
                 this.range = 40;
             } else if (r === 3) {
                 this.range = 80;
             } else if (r === 4) {
                 this.range = 160;
             } else if (r === 5) {
                 this.range = 320;
             }
             this.compiledMap.context.projection.set({ range: UnitType.NMILE.convertTo(this.range, UnitType.GA_RADIAN) });
             map.onUpdated(0, 0);
         });

         setTimeout(() => {
             map.onUpdated(0, 0);
         }, 5000);
     }

     render(): VNode {
         return (
             <>
                 { this.compiledMap.map }
             </>

         );
     }
}
