import { Subject, Subscribable, MappedSubject, ArraySubject } from 'msfssdk';

import { Arinc429Word } from '@shared/arinc429';

interface EWDItem {
    flightPhaseInhib: number[],
    simVarIsActive: Subscribable<boolean>,
    whichCodeToReturn: () => any[],
    codesToReturn: string[],
    memoInhibit: boolean,
    failure: number,
    sysPage: number,
    side: string
}

interface EWDMessageDict {
    [key: string] : EWDItem
}

export class NewPseudoFWC {
    private readonly failuresLeft: string[] = [];

    private readonly failuresRight: string[] = [];

    private readonly allCurrentFailures: string[] = [];

    private readonly recallFailures: string[] = [];

    private memoMessageLeft: ArraySubject<string> = ArraySubject.create([]);

    private memoMessageRight: ArraySubject<string> = ArraySubject.create([]);

    private readonly fwcFlightPhase = Subject.create(-1);

    private readonly flapsIndex = Subject.create(0);

    private readonly computedAirSpeed = Subject.create(Arinc429Word.empty());

    private readonly computedAirSpeedToNearest2 = this.computedAirSpeed.map((it) => Math.round(it.value / 2) * 2);

    private readonly N1Eng1 = Subject.create(0);

    private readonly N1Eng2 = Subject.create(0);

    private readonly N1IdleEng1 = Subject.create(0);

    private readonly N1IdleEng2 = Subject.create(0);

    private readonly N1AboveIdle = MappedSubject.create(([n1, idleN1]) => Math.floor(n1) > idleN1, this.N1Eng1, this.N1IdleEng1);

    private readonly N2AboveIdle = MappedSubject.create(([n1, idleN1]) => Math.floor(n1) > idleN1, this.N1Eng2, this.N1IdleEng2);

    private readonly engDualFault = Subject.create(false); // TODO

    private readonly emergencyElectricGeneratorPotential = Subject.create(0);

    private readonly emergencyGeneratorOn = this.emergencyElectricGeneratorPotential.map((it) => it > 0);

    private readonly apuMasterSwitch = Subject.create(0);

    private readonly apuAvail = Subject.create(0);

    private readonly radioAlt = Subject.create(0);

    private readonly fac1Failed = Subject.create(0);

    private readonly antiskidActive = Subject.create(0);

    constructor() {
        this.memoMessageLeft.sub((i, t, v) => {
            [1, 2, 3, 4, 5, 6, 7].forEach((value) => {
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${value}`, 'string', '');
            });

            if (v && v.length > 0) {
                this.memoMessageLeft.getArray().forEach((value, index) => {
                    SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_LEFT_LINE_${index + 1}`, 'string', value);
                });
            }
        });

        this.memoMessageRight.sub((i, t, v) => {
            [1, 2, 3, 4, 5, 6, 7].forEach((value) => {
                SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_RIGHT_LINE_${value}`, 'string', '');
            });

            if (v && v.length > 0 && Array.isArray(v)) {
                v.forEach((value, index) => {
                    SimVar.SetSimVarValue(`L:A32NX_EWD_LOWER_RIGHT_LINE_${index + 1}`, 'string', value);
                });
            }
        });
    }

    masterWarning(toggle: number) {
        SimVar.SetSimVarValue('L:A32NX_MASTER_WARNING', 'Bool', toggle);
        SimVar.SetSimVarValue('L:Generic_Master_Warning_Active', 'Bool', toggle);
    }

    masterCaution(toggle: number) {
        SimVar.SetSimVarValue('L:A32NX_MASTER_CAUTION', 'Bool', toggle);
        SimVar.SetSimVarValue('L:Generic_Master_Caution_Active', 'Bool', toggle);
    }

    mapOrder(array, order): [] {
        array.sort((a, b) => {
            if (order.indexOf(a) > order.indexOf(b)) {
                return 1;
            }
            return -1;
        });
        return array;
    }

    onUpdate(_deltaTime) {
        // Inputs update

        this.fwcFlightPhase.set(SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum'));

        this.flapsIndex.set(SimVar.GetSimVarValue('L:A32NX_FLAPS_CONF_INDEX', 'number'));

        this.computedAirSpeed.set(Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED'));

        this.N1Eng1.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:1', 'number'));
        this.N1Eng2.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:2', 'number'));
        this.N1IdleEng1.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_IDLE_N1:1', 'number'));
        this.N1IdleEng2.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_IDLE_N1:2', 'number'));

        this.emergencyElectricGeneratorPotential.set(SimVar.GetSimVarValue('L:A32NX_ELEC_EMER_GEN_POTENTIAL', 'number'));

        this.apuMasterSwitch.set(SimVar.GetSimVarValue('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool'));

        this.apuAvail.set(SimVar.GetSimVarValue('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'bool'));

        this.radioAlt.set(SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND MINUS CG', 'feet'));

        this.fac1Failed.set(SimVar.GetSimVarValue('L:A32NX_FBW_FAC_FAILED:1', 'Bool'));

        this.antiskidActive.set(SimVar.GetSimVarValue('ANTISKID BRAKES ACTIVE', 'Bool'));

        // Output logic

        const flightPhase = this.fwcFlightPhase.get();
        let tempMemoArrayLeft:string[] = [];
        let tempMemoArrayRight:string[] = [];
        const allFailureKeys: string[] = [];
        let tempFailureArrayLeft:string[] = [];
        let failureKeysLeft: string[] = this.failuresLeft;
        let recallFailureKeys: string[] = this.recallFailures;
        let tempFailureArrayRight:string[] = [];
        const failureKeysRight: string[] = this.failuresRight;
        let leftFailureSystemCount = 0;
        let rightFailureSystemCount = 0;

        // Update failuresLeft list in case failure has been resolved
        for (const [key, value] of Object.entries(this.ewdMessageFailures)) {
            if (!value.simVarIsActive.get() || value.flightPhaseInhib.some((e) => e === flightPhase)) {
                failureKeysLeft = failureKeysLeft.filter((e) => e !== key);
                recallFailureKeys = this.recallFailures.filter((e) => e !== key);
            }
        }

        this.recallFailures.length = 0;
        this.recallFailures.push(...recallFailureKeys);

        // Failures first
        for (const [key, value] of Object.entries(this.ewdMessageFailures)) {
            if (value.simVarIsActive.get() && !value.flightPhaseInhib.some((e) => e === flightPhase)) {
                if (value.side === 'LEFT') {
                    allFailureKeys.push(key);
                }

                if ((value.side === 'LEFT' && !this.failuresLeft.includes(key) && !recallFailureKeys.includes(key)) || (value.side === 'RIGHT' && !this.failuresRight.includes(key))) {
                    if (value.side === 'LEFT') {
                        failureKeysLeft.push(key);
                    } else {
                        failureKeysRight.push(key);
                    }

                    if (value.failure === 3) {
                        this.masterWarning(1);
                    }
                    if (value.failure === 2) {
                        this.masterCaution(1);
                    }
                }/*  else if (![eng1FireTest, eng2FireTest, apuFireTest, cargoFireTest].every((e) => e === 0)) {
                    this.masterWarning(1);
                } */

                const newCode: string[] = [];
                if (!recallFailureKeys.includes(key)) {
                    const codeIndex = value.whichCodeToReturn().filter((e) => e !== null);

                    for (const e of codeIndex) {
                        newCode.push(value.codesToReturn[e]);
                    }

                    if (value.sysPage > -1) {
                        if (value.side === 'LEFT') {
                            leftFailureSystemCount++;
                        } else {
                            rightFailureSystemCount++;
                        }
                    }
                }
                if (value.side === 'LEFT') {
                    tempFailureArrayLeft = tempFailureArrayLeft.concat(newCode);
                } else {
                    tempFailureArrayRight = tempFailureArrayRight.concat(newCode);
                }

                if (value.sysPage > -1) {
                    SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', value.sysPage);
                }
            }
        }

        const failLeft = tempFailureArrayLeft.length > 0;

        const mesgFailOrderLeft: string[] = [];
        const mesgFailOrderRight: string[] = [];

        for (const [, value] of Object.entries(this.ewdMessageFailures)) {
            if (value.side === 'LEFT') {
                mesgFailOrderLeft.push(...value.codesToReturn);
            } else {
                mesgFailOrderRight.push(...value.codesToReturn);
            }
        }

        const orderedFailureArrayLeft = this.mapOrder(tempFailureArrayLeft, mesgFailOrderLeft);
        const orderedFailureArrayRight = this.mapOrder(tempFailureArrayRight, mesgFailOrderRight);

        this.allCurrentFailures.length = 0;
        this.allCurrentFailures.push(...allFailureKeys);

        this.failuresLeft.length = 0;
        this.failuresLeft.push(...failureKeysLeft);

        this.failuresRight.length = 0;
        this.failuresRight.push(...failureKeysRight);

        if (tempFailureArrayLeft.length > 0) {
            this.memoMessageLeft.clear();
            orderedFailureArrayLeft.forEach((item) => this.memoMessageLeft.insert(item));
        }

        for (const [, value] of Object.entries(this.ewdMessageMemos)) {
            if (value.simVarIsActive.get() && !(value.memoInhibit) && !value.flightPhaseInhib.some((e) => e === flightPhase)) {
                const newCode: string[] = [];

                const codeIndex = value.whichCodeToReturn().filter((e) => e !== null);
                codeIndex.forEach((e: number) => {
                    newCode.push(value.codesToReturn[e]);
                });

                if (value.side === 'LEFT' && !failLeft) {
                    tempMemoArrayLeft = tempMemoArrayLeft.concat(newCode);
                }
                if (value.side === 'RIGHT') {
                    const tempArrayRight = tempMemoArrayRight.filter((e) => !value.codesToReturn.includes(e));
                    tempMemoArrayRight = tempArrayRight.concat(newCode);
                }

                if (value.sysPage > -1) {
                    SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', value.sysPage);
                }
            }
        }

        const mesgOrderLeft: string[] = [];
        const mesgOrderRight: string[] = [];

        for (const [, value] of Object.entries(this.ewdMessageMemos)) {
            if (value.side === 'LEFT') {
                mesgOrderLeft.push(...value.codesToReturn);
            } else {
                mesgOrderRight.push(...value.codesToReturn);
            }
        }

        const orderedMemoArrayLeft = this.mapOrder(tempMemoArrayLeft, mesgOrderLeft);
        let orderedMemoArrayRight = this.mapOrder(tempMemoArrayRight, mesgOrderRight);

        if (!failLeft) {
            this.memoMessageLeft.clear();
            orderedMemoArrayLeft.forEach((item) => this.memoMessageLeft.insert(item));

            if (orderedFailureArrayRight.length === 0) {
                this.masterCaution(0);
                this.masterWarning(0);
            }
        }

        if (leftFailureSystemCount + rightFailureSystemCount === 0) {
            SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', -1);
        }

        if (orderedFailureArrayRight.length > 0) {
            // Right side failures need to be inserted between special lines
            // and the rest of the memo
            const specialLines = ['000014001', '000015001', '000035001', '000036001', '220001501', '220002101'];
            const filteredMemo = orderedMemoArrayRight.filter((e) => !specialLines.includes(e));
            const specLinesInMemo = orderedMemoArrayRight.filter((e) => specialLines.includes(e));
            if (specLinesInMemo.length > 0) {
                // @ts-expect-error
                orderedMemoArrayRight = [...specLinesInMemo, ...orderedFailureArrayRight, ...filteredMemo];
            } else {
                orderedMemoArrayRight = [...orderedFailureArrayRight, ...orderedMemoArrayRight];
            }
        }

        this.memoMessageRight = ArraySubject.create([]);
        orderedFailureArrayRight.forEach((item) => this.memoMessageRight.insert(item));
    }

    ewdMessageFailures: EWDMessageDict = {
        3400210: { // OVERSPEED FLAPS FULL
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject
                .create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 5 && computedAirSpeedToNearest2 > 181, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340021001', '340021002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400220: { // OVERSPEED FLAPS 3
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject
                .create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 4 && computedAirSpeedToNearest2 > 189, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340022001', '340022002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400230: { // OVERSPEED FLAPS 2
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject
                .create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 3 && computedAirSpeedToNearest2 > 203, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340023001', '340023002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400235: { // OVERSPEED FLAPS 1+F
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject
                .create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 2 && computedAirSpeedToNearest2 > 219, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340023501', '340023502'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        3400240: { // OVERSPEED FLAPS 1
            flightPhaseInhib: [2, 3, 4, 8, 9, 10],
            simVarIsActive: MappedSubject
                .create(([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 1 && computedAirSpeedToNearest2 > 233, this.flapsIndex, this.computedAirSpeedToNearest2),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['340024001', '340024002'],
            memoInhibit: false,
            failure: 3,
            sysPage: -1,
            side: 'LEFT',
        },
        7700027: { // DUAL ENGINE FAILURE
            flightPhaseInhib: [],
            simVarIsActive: this.engDualFault,
            whichCodeToReturn: () => [
                0,
                !(this.emergencyGeneratorOn.get()) ? 1 : null,
                5,
                !(this.apuMasterSwitch.get() === 1 || this.apuAvail.get() === 1) && this.radioAlt.get() < 2500 ? 6 : null,
                (this.N1AboveIdle.get() || this.N2AboveIdle.get()) ? 7 : null,
                this.fac1Failed.get() === 1 ? 8 : null,
                9, 10, 11,
            ],
            codesToReturn: ['770002701', '770002702', '770002703', '770002704', '770002705', '770002706', '770002707', '770002708', '770002709', '770002710', '770002711', '770002712'],
            memoInhibit: false,
            failure: 3,
            sysPage: 0,
            side: 'LEFT',
        },
        3200060: { // NW ANTI SKID INACTIVE
            flightPhaseInhib: [4, 5],
            simVarIsActive: this.antiskidActive.map((it) => it === 0),
            whichCodeToReturn: () => [0, 1],
            codesToReturn: ['320006001', '320006002'],
            memoInhibit: false,
            failure: 2,
            sysPage: 9,
            side: 'LEFT',
        },
    }

    ewdMessageMemos: EWDMessageDict = {};
}
