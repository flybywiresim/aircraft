import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Store for all settings which should be global for the EFB but not neccesary for the simvars.

interface GlobalSettingsState {
    cabinAnnouncementsSetting: boolean,
    passengerAmbienceSetting: boolean,
    boardingMusicSetting: boolean
};

const initialState:GlobalSettingsState = { cabinAnnouncementsSetting: true, passengerAmbienceSetting: true, boardingMusicSetting: true };

export const globalSettingsSlice = createSlice({
    name: 'globalSettings',
    initialState: initialState,
    reducers: {
        setCabinAnnouncementsSetting: (state: any, action: PayloadAction<boolean>) => {
            state.cabinAnnouncementsActive = action.payload;
        },
        setPassengerAmbienceSetting: (state: any, action: PayloadAction<boolean>) => {
            state.passengerAmbienceActive = action.payload;
        },
        setBoardingMusicSetting: (state: any, action: PayloadAction<boolean>) => {
            state.boardingMusicActive = action.payload;
        },
    },
});

export const { setCabinAnnouncementsSetting } = globalSettingsSlice.actions;
export const { setPassengerAmbienceSetting } = globalSettingsSlice.actions;
export const { setBoardingMusicSetting } = globalSettingsSlice.actions;

export default globalSettingsSlice.reducer;
