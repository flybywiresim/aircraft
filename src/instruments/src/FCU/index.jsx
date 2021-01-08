import ReactDOM from 'react-dom';
import { renderTarget } from '../util.mjs';
import { FlightControlUnit } from './Systems/FlightControlUnit.jsx';
import { BarometricSelector } from './Systems/BarometricSelector.jsx';
import './style.scss';


ReactDOM.render(<div>
    <FlightControlUnit />
    <BarometricSelector />
</div>, renderTarget);
