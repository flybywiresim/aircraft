import { Subject } from 'msfssdk';
import { Arinc429Register } from '@shared/arinc429';

export class Arinc429RegisterSubject extends Subject<Arinc429Register> {
    static createEmpty(): Arinc429RegisterSubject {
        return new Arinc429RegisterSubject(Arinc429Register.empty(), () => false); // FIXME bruh
    }

    get(): Arinc429Register {
        return this.value;
    }

    set(_value: Arinc429Register) {
        throw new Error('Cannot directly set Arinc429RegisterSubject');
    }

    setWord(word: number) {
        const oldSsm = this.value.ssm;
        const oldValue = this.value.value;

        this.value.set(word);

        if (oldSsm !== this.value.ssm || oldValue !== this.value.value) {
            this.notify();
        }
    }
}
