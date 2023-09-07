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
    cabinLeftDoorButtonState: ServiceButtonState
    cabinRightDoorButtonState: ServiceButtonState
    jetWayButtonState: ServiceButtonState
    fuelTruckButtonState: ServiceButtonState
    gpuButtonState: ServiceButtonState
    cargoDoorButtonState: ServiceButtonState
    baggageButtonState: ServiceButtonState
    aftLeftDoorButtonState: ServiceButtonState
    aftRightDoorButtonState: ServiceButtonState
    cateringButtonState: ServiceButtonState
}

// hack to fix initialization issue for ACE/vite
let initialState: ButtonSelectionState = {
    cabinLeftDoorButtonState: ServiceButtonState.DISABLED,
    cabinRightDoorButtonState: ServiceButtonState.DISABLED,
    jetWayButtonState: ServiceButtonState.DISABLED,
    fuelTruckButtonState: ServiceButtonState.DISABLED,
    gpuButtonState: ServiceButtonState.DISABLED,
    cargoDoorButtonState: ServiceButtonState.DISABLED,
    baggageButtonState: ServiceButtonState.DISABLED,
    aftLeftDoorButtonState: ServiceButtonState.DISABLED,
    aftRightDoorButtonState: ServiceButtonState.DISABLED,
    cateringButtonState: ServiceButtonState.DISABLED,
};

const setInitialState = () => {
    initialState = {
        cabinLeftDoorButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:0', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        cabinRightDoorButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:1', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        jetWayButtonState: ServiceButtonState.INACTIVE,
        fuelTruckButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:9', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        gpuButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:8', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        cargoDoorButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:5', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        baggageButtonState: ServiceButtonState.INACTIVE,
        aftLeftDoorButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:2', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
        aftRightDoorButtonState: (SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:3', 'Percent over 100') === 1.0 ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE),
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
        setCabinLeftDoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.cabinLeftDoorButtonState = action.payload;
        },
        setCabinRightDoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.cabinRightDoorButtonState = action.payload;
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
        setAftLeftDoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.aftLeftDoorButtonState = action.payload;
        },
        setAftRightDoorButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.aftRightDoorButtonState = action.payload;
        },
        setCateringButtonState: (state, action: PayloadAction<ServiceButtonState>) => {
            state.cateringButtonState = action.payload;
        },
    },
});

export const {
    setCabinLeftDoorButtonState,
    setCabinRightDoorButtonState,
    setJetWayButtonState,
    setFuelTruckButtonState,
    setGpuButtonState,
    setCargoDoorButtonState,
    setBaggageButtonState,
    setAftLeftDoorButtonState,
    setAftRightDoorButtonState,
    setCateringButtonState,
} = buttonsSlice.actions;

export default buttonsSlice.reducer;
