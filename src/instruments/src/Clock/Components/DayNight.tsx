import { useSimVar } from '@instruments/common/simVars';

const secondsToDisplay = (seconds: number): number[] => {
    const displayTime = [0, 0, 0];
    displayTime[0] = Math.floor(seconds / 3600);
    return displayTime;
};

const DayNight = () => {
    const [localTime] = useSimVar('E:LOCAL TIME', 'seconds', 200);
    const displayTime = secondsToDisplay(localTime);
    return ((displayTime[0] >= 6 && displayTime[0] <= 18) ? 'day' : 'night');
};

export default DayNight;
