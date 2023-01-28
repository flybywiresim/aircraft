import { useSimVar } from '@instruments/common/simVars';

type StaticBugProperties = {
    type: BugType,
    min: number,
    max: number,
    increment: number
}

export type Bug = StaticBugProperties & {
    value: number,
    isActive: boolean
}

type BugSetter = (bug: Bug) => void;

export enum BugType {
    SPD = 'SPD',
    ALT = 'ALT',
}

function useBug(type: BugType, index: number): [Bug, BugSetter] {
    const valueName = `L:A32NX_ISIS_BUGS_${type}_VALUE:${index}`;
    const activeName = `L:A32NX_ISIS_BUGS_${type}_ACTIVE:${index}`;

    const [value, setValue] = useSimVar(valueName, BugType.SPD ? 'knots' : 'feet');
    const [isActive, setIsActive] = useSimVar(activeName, 'boolean');

    const getter = { value, isActive, ...bugPropertiesByType[type] };
    const setter = ({ value, isActive }) => {
        setValue(value);
        setIsActive(isActive);
    };

    return [getter, setter];
}

export function useBugs(): [Bug[], BugSetter[]] {
    const [altBug0, setAltBug0] = useBug(BugType.ALT, 0);
    const [altBug1, setAltBug1] = useBug(BugType.ALT, 1);

    const [spdBug0, setSpdBug0] = useBug(BugType.SPD, 0);
    const [spdBug1, setSpdBug1] = useBug(BugType.SPD, 1);
    const [spdBug2, setSpdBug2] = useBug(BugType.SPD, 2);
    const [spdBug3, setSpdBug3] = useBug(BugType.SPD, 3);

    return [
        [altBug0, altBug1, spdBug0, spdBug1, spdBug2, spdBug3],
        [setAltBug0, setAltBug1, setSpdBug0, setSpdBug1, setSpdBug2, setSpdBug3],
    ];
}

const bugPropertiesByType: Record<BugType, StaticBugProperties> = {
    [BugType.SPD]: { type: BugType.SPD, min: 30, max: 660, increment: 1 },
    [BugType.ALT]: { type: BugType.ALT, min: 100, max: 50000, increment: 100 },
};
