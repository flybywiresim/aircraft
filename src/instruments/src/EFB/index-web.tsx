import './Assets/Efb.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter as Router } from 'react-router-dom';
import { SimVarProvider } from '@instruments/common/simVars';
import Efb from './Efb';

ReactDOM.render(<Router><SimVarProvider><Efb /></SimVarProvider></Router>, document.getElementById('A32NX_REACT_MOUNT'));
