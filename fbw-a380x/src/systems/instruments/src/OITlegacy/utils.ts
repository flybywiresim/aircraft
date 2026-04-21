import { initialState, setSimbriefData, SimbriefData } from '@flybywiresim/flypad';
import { PayloadAction } from '@reduxjs/toolkit';

export function simbriefDataFromFms(
  simBriefData: SimbriefData,
  origin?: string,
  destination?: string,
  altn?: string,
): PayloadAction<SimbriefData> {
  const state = Object.assign({}, simBriefData ?? initialState.data);
  state.departingAirport = origin ?? state.departingAirport;
  state.arrivingAirport = destination ?? state.arrivingAirport;
  state.altIcao = altn ?? state.altIcao;
  return setSimbriefData(state);
}
