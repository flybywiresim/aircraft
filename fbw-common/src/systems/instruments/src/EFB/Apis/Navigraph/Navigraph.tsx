// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useContext } from 'react';
import { NavigraphClient } from '@flybywiresim/fbw-sdk';

export const NavigraphContext = React.createContext<NavigraphClient>(undefined!);

export const useNavigraph = () => useContext(NavigraphContext);
