# A320neo Local SimVars

- A32NX_NO_SMOKING_MEMO
    - Boolean that determines whether the NO SMOKING annunication should be visible on the ECAM memo
    - Also is used for knowing when to play the no smoking chime sound
    
- A32NX_ADIRS_PFD_ALIGNED
    - Bool
    - 0 when ADIRS is not aligned
    - 1 when ADIRS is aligned or 3 minutes after it has started aligning
    
- A32NX_Neo_ADIRS_START_TIME
    - Seconds
    - Holds the start time in seconds that the ADIRS TIMER will count down from
    - Used to have certain things turn on based on a percentage of the total alignment time
    
- A32NX_BRAKE_TEMPERATURE_{1,2,3,4}
    - celsius
    - represents the brake temperature of the rear wheels
    
- A32NX_BRAKES_HOT
    - boolean
    - whether one of the brakes are hot
    
- XMLVAR_Auto
    - Used in the `.flt` files to set a default value for the ATC 3 way switch on the TCAS panel
    - Maps to the `I:XMLVAR_Auto` variable which is the actual backing var for the switch
    
- XMLVAR_ALT_MODE_REQUESTED
    - Used in the `.flt` files to set a default value for the ALT RPTG 2 way switch on the TCAS panel
    - Maps to the `I:XMLVAR_ALT_MODE_REQUESTED` variable which is the actual backing var for the switch
- A32NX_ELEC_COMMERCIAL_TOGGLE
    - Bool
    - True if electrical commercial push button on
- A32NX_ELEC_COMMERCIAL_FAULT
    - Bool
    - True if fault in electrical commercial system
- A32NX_ELEC_GALYCAB_TOGGLE
    - Bool
    - True if electrical galy & cab push button on
- A32NX_ELEC_GALYCAB_FAULT
    - Bool
    - True if fault in electrical galy & cab system
