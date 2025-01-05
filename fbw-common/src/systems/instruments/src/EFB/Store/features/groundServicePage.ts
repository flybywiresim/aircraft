// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

enum ServiceButtonState {
  HIDDEN,
  DISABLED,
  INACTIVE,
  CALLED,
  ACTIVE,
  RELEASED,
}

interface ButtonSelectionState {
  boarding1DoorButtonState: ServiceButtonState;
  boarding2DoorButtonState: ServiceButtonState;
  boarding3DoorButtonState: ServiceButtonState;
  serviceDoorButtonState: ServiceButtonState;
  cargo1DoorButtonState: ServiceButtonState;
  jetWayButtonState: ServiceButtonState;
  fuelTruckButtonState: ServiceButtonState;
  gpuButtonState: ServiceButtonState;
  baggageButtonState: ServiceButtonState;
  cateringButtonState: ServiceButtonState;
  asuButtonState: ServiceButtonState;
}

// hack to fix initialization issue for ACE/vite
let initialState: ButtonSelectionState = {
  boarding1DoorButtonState: ServiceButtonState.DISABLED,
  boarding2DoorButtonState: ServiceButtonState.DISABLED,
  boarding3DoorButtonState: ServiceButtonState.DISABLED,
  serviceDoorButtonState: ServiceButtonState.DISABLED,
  cargo1DoorButtonState: ServiceButtonState.DISABLED,
  fuelTruckButtonState: ServiceButtonState.DISABLED,
  gpuButtonState: ServiceButtonState.DISABLED,
  jetWayButtonState: ServiceButtonState.DISABLED,
  baggageButtonState: ServiceButtonState.DISABLED,
  cateringButtonState: ServiceButtonState.DISABLED,
  asuButtonState: ServiceButtonState.DISABLED,
};

const setInitialState = () => {
  initialState = {
    boarding1DoorButtonState:
      SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:0', 'Percent over 100') === 1.0
        ? ServiceButtonState.ACTIVE
        : ServiceButtonState.INACTIVE,
    boarding2DoorButtonState:
      SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:1', 'Percent over 100') === 1.0
        ? ServiceButtonState.ACTIVE
        : ServiceButtonState.INACTIVE,
    boarding3DoorButtonState:
      SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:2', 'Percent over 100') === 1.0
        ? ServiceButtonState.ACTIVE
        : ServiceButtonState.INACTIVE,
    cargo1DoorButtonState:
      SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:5', 'Percent over 100') === 1.0
        ? ServiceButtonState.ACTIVE
        : ServiceButtonState.INACTIVE,
    serviceDoorButtonState:
      SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:3', 'Percent over 100') === 1.0
        ? ServiceButtonState.ACTIVE
        : ServiceButtonState.INACTIVE,
    fuelTruckButtonState:
      SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:9', 'Percent over 100') === 1.0
        ? ServiceButtonState.ACTIVE
        : ServiceButtonState.INACTIVE,
    gpuButtonState:
      SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:8', 'Percent over 100') === 1.0
        ? ServiceButtonState.ACTIVE
        : ServiceButtonState.INACTIVE,
    jetWayButtonState: ServiceButtonState.INACTIVE,
    baggageButtonState: ServiceButtonState.INACTIVE,
    cateringButtonState: ServiceButtonState.INACTIVE,
    asuButtonState:
      SimVar.GetSimVarValue('L:A32NX_ASU_TURNED_ON', 'Bool') === 1.0
        ? ServiceButtonState.ACTIVE
        : ServiceButtonState.INACTIVE,
  };
};

// hack to fix initialization issue for ACE/vite
if (process.env.VITE_BUILD) {
  window.addEventListener('AceInitialized', setInitialState);
} else {
  setInitialState();
}

export const buttonsSlice = createSlice({
  name: 'ground',
  initialState,
  reducers: {
    setBoarding1DoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.boarding1DoorButtonState = action.payload;
    },
    setBoarding2DoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.boarding2DoorButtonState = action.payload;
    },
    setBoarding3DoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.boarding3DoorButtonState = action.payload;
    },
    setServiceDoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.serviceDoorButtonState = action.payload;
    },
    setCargo1DoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.cargo1DoorButtonState = action.payload;
    },
    setJetWayButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.jetWayButtonState = action.payload;
    },
    setFuelTruckButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.fuelTruckButtonState = action.payload;
    },
    setGpuButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.gpuButtonState = action.payload;
    },
    setBaggageButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.baggageButtonState = action.payload;
    },
    setCateringButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.cateringButtonState = action.payload;
    },
    setAsuButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
      state.asuButtonState = action.payload;
    },
  },
});

export const {
  setBoarding1DoorButtonState,
  setBoarding2DoorButtonState,
  setBoarding3DoorButtonState,
  setServiceDoorButtonState,
  setCargo1DoorButtonState,
  setJetWayButtonState,
  setFuelTruckButtonState,
  setGpuButtonState,
  setBaggageButtonState,
  setCateringButtonState,
  setAsuButtonState,
} = buttonsSlice.actions;

export default buttonsSlice.reducer;
