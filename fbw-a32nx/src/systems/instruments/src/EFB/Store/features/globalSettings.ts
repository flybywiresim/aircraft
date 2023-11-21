import { createSlice, PayloadAction } from "@reduxjs/toolkit";

//Store for alle settings which should be application global for the EFB application but not neccesary for the simvars

interface GlobalSettingsState
{
    cabinAnnouncementsActive:boolean,
    passengerAmbienceActive:boolean,
    boardingMusicActive:boolean
}

let initialState:GlobalSettingsState = {cabinAnnouncementsActive:true, passengerAmbienceActive:true, boardingMusicActive:true}

export const globalSettingsSlice = createSlice({
    name:"globalSettings",
    initialState:initialState,
    reducers:{
        setCabinAnnouncementsActive:(state:any, action:PayloadAction<boolean>) => {
            state.cabinAnnouncementsActive = action.payload;
        },
        setPassengerAmbienceActive:(state:any, action:PayloadAction<boolean>) => {
            state.passengerAmbienceActive = action.payload
        },
        setBoardingMusicActive:(state:any, action:PayloadAction<boolean>) => {
            state.boardingMusicActive = action.payload;
        }
    }
});

export const {setCabinAnnouncementsActive} = globalSettingsSlice.actions;
export const {setPassengerAmbienceActive} = globalSettingsSlice.actions;
export const {setBoardingMusicActive} = globalSettingsSlice.actions;

export default globalSettingsSlice.reducer;