import { Consumer, ConsumerSubject } from '@microsoft/msfs-sdk';
import { Arinc429Register, Arinc429Word, Arinc429WordData } from '@shared/arinc429';

export const Arinc429EqualityFunc = (a: Arinc429WordData, b: Arinc429WordData) => a.value === b.value && a.ssm === b.ssm;

export const Arinc429MutateFunc = (a: Arinc429Register, b: Arinc429Register) => a.set(b.word);

export class Arinc429ConsumerSubject {
    static create(initialConsumer: Consumer<Arinc429WordData> | undefined): ConsumerSubject<Arinc429WordData> {
        return ConsumerSubject.create(initialConsumer ?? null, Arinc429Register.empty(), Arinc429EqualityFunc, Arinc429MutateFunc);
    }
}
