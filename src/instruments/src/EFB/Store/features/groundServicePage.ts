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
    cabinDoorButtonState: ServiceButtonState
    jetWayButtonState: ServiceButtonState
    fuelTruckButtonState: ServiceButtonState
    gpuButtonState: ServiceButtonState
    cargoDoorButtonState: ServiceButtonState
    baggageButtonState: ServiceButtonState
    aftDoorButtonState: ServiceButtonState
    cateringButtonState: ServiceButtonState
}

// hack to fix initialization issue for ACE/vite
let initialState: ButtonSelectionState = {
    cabinDoorButtonState: ServiceButtonState.DISABLED,
    jetWayButtonState: ServiceButtonState.DISABLED,
    fuelTruckButtonState: ServiceButtonState.DISABLED,
    gpuButtonState: ServiceButtonState.DISABLED,
    cargoDoorButtonState: ServiceButtonState.DISABLED,
    baggageButtonState: ServiceButtonState.DISABLED,
    aftDoorButtonState: ServiceButtonState.DISABLED,
    cateringButtonState: ServiceButtonState.DISABLED,
};

const setInitialState = () => {
    initialState = {
        cabinDoorButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:0', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        jetWayButtonState: ServiceButtonState.INACTIVE,
        fuelTruckButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:9', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        gpuButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:8', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        cargoDoorButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:5', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        baggageButtonState: ServiceButtonState.INACTIVE,
        aftDoorButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:3', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        cateringButtonState: ServiceButtonState.INACTIVE,
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
        setCabinDoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.cabinDoorButtonState = action.payload;
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
        setCargoDoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.cargoDoorButtonState = action.payload;
        },
        setBaggageButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.baggageButtonState = action.payload;
        },
        setAftDoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.aftDoorButtonState = action.payload;
        },
        setCateringButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.cateringButtonState = action.payload;
        },
    },
});

export const {
    setCabinDoorButtonState,
    setJetWayButtonState,
    setFuelTruckButtonState,
    setGpuButtonState,
    setCargoDoorButtonState,
    setBaggageButtonState,
    setAftDoorButtonState,
    setCateringButtonState,
} = buttonsSlice.actions;

export default buttonsSlice.reducer;
