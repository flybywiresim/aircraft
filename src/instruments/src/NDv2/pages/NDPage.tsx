import { Subject } from 'msfssdk';

export interface NDPage {
    isVisible: Subject<boolean>;
}
