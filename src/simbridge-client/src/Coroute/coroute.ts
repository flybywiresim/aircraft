import { Airport } from './Airport';
import { General } from './General';
import { Navlog } from './Navlog';

export interface CoRouteDto {
    name: String;

    origin: Airport;

    destination: Airport;

    general: General;

    navlog: Navlog
}
