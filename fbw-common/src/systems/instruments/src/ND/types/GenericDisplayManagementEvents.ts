import { Arinc429WordData } from '../../../../shared/src/arinc429';

export interface GenericDisplayManagementEvents {
  trueRefActive: boolean;
  trueRefPushButton: boolean;
  heading: Arinc429WordData;
  track: Arinc429WordData;
}
