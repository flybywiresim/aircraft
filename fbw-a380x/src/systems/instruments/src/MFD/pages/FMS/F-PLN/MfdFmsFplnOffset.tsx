import { Subject } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';

interface MfdFmsFplnOffsetProps extends AbstractMfdPageProps {}

export class MfdFmsFplnOffset extends FmsPage<MfdFmsFplnOffsetProps> {
  private offsetStartpWpt = Subject.create<string>('WAYPOINT');
  private offsetEndpWpt = Subject.create<string>('WAYPOINT');
}
