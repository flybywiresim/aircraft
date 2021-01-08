import { VerticalSpeed } from '../Subsystems/VerticalSpeed.jsx';
import { LevelChange } from '../Subsystems/LevelChange.jsx';
import { Altitude } from '../Subsystems/Altitude.jsx';
import { Heading } from '../Subsystems/Heading.jsx';
import { Speed } from '../Subsystems/Speed.jsx';
import { Mode } from '../Subsystems/Mode.jsx';


export const FlightControlUnit = () => {
    return <div className="wrapper">
        <Speed />
        <Heading/>
        <Mode />
        <Altitude />
        <VerticalSpeed />
        <LevelChange />
    </div>;
}
