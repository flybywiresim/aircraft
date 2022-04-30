import { DisplayComponent, Subject } from 'msfssdk';

export interface NDPageProps {

}

export abstract class NDPage extends DisplayComponent<NDPageProps> {
    isReady = Subject.create(false);

    onPageSelected() {
        this.isReady.set(false);
        setTimeout(() => {
            this.isReady.set(true);
        }, 2_000 + Math.round(Math.random() * 200) - 100);
    }
}
