import React from 'react';
import { HashRouter } from 'react-router-dom';
import { render } from '@instruments/common/index';
import { RadioManagementPanel } from './RadioManagementPanel';

import './index.css';

render(
    <HashRouter>
        <RadioManagementPanel side="L" />
    </HashRouter>,
);
