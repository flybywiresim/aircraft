import { Geometry } from '@fmgc/guidance/Geometry';

export interface GuidanceComponent {

    init(): void;

    update(deltaTime: number): void;

    acceptNewMultipleLegGeometry(geometry: Geometry): void;

}
