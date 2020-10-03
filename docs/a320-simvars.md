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

- A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position
    - Position (0-2)
    - 0 is SHUT, 1 is AUTO, 2 is OPEN

- A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position
    - Position (0-2)
    - 0 is LO, 1 is NORM, 2 is HI
  
- A32NX_AIRCOND_PACK1_FAULT
    - Bool
    - True if fault in pack 1

- A32NX_AIRCOND_PACK1_TOGGLE
    - Bool
    - True if pack 1 is on

- A32NX_AIRCOND_PACK2_FAULT
    - Bool
    - True if fault in pack 2
  
- A32NX_AIRCOND_PACK2_TOGGLE
    - Bool
    - True if pack 2 is on

- A32NX_AIRCOND_HOTAIR_FAULT
    - Bool
    - True if fault in hot air system
  
- A32NX_AIRCOND_HOTAIR_TOGGLE
    - Bool
    - True if hot air system is on
  
- A32NX_AIRCOND_RAMAIR_TOGGLE
    - Bool
    - True if ram air is on

- A32NX_CALLS_EMER_ON
    - Bool
    - True if emergency cabin call is on

- A32NX_OVHD_COCKPITDOORVIDEO_TOGGLE
    - Bool
    - True if cockpit door video system is on

- PUSH_DOORPANEL_VIDEO
    - Bool
    - True if pedestal door video button is being held

- A32NX_HYD_ENG1PUMP_FAULT
    - Bool
    - True if engine 1 hyd pump fault

- A32NX_HYD_ENG1PUMP_TOGGLE
    - Bool
    - True if engine 1 hyd pump is on

- A32NX_HYD_ENG2PUMP_FAULT
    - Bool
    - True if engine 2 hyd pump fault

- A32NX_HYD_ENG2PUMP_TOGGLE
    - Bool
    - True if engine 2 hyd pump is on

- A32NX_HYD_ELECPUMP_FAULT
    - Bool
    - True if elec hyd pump fault

- A32NX_HYD_ELECPUMP_TOGGLE
    - Bool
    - True if elec hyd pump is on/auto

- A32NX_HYD_PTU_FAULT
    - Bool
    - True if PTU fault

- A32NX_HYD_PTU_TOGGLE
    - Bool
    - True if PTU system on/auto

- A32NX_HYD_ELECPUMPY_FAULT
    - Bool
    - True if yellow elec hyd pump fault

- A32NX_HYD_ELECPUMPY_TOGGLE
    - Bool
    - True if yellow elec hyd pump is on/auto

- A32NX_ENGMANSTART1_TOGGLE
    - Bool
    - True if manual engine 1 start on

- A32NX_ENGMANSTART2_TOGGLE
    - Bool
    - True if manual engine 2 start on

- A32NX_VENTILATION_BLOWER_FAULT
    - Bool
    - True if ventilation blower fault

- A32NX_VENTILATION_BLOWER_TOGGLE
    - Bool
    - True if ventilation blower on

- A32NX_VENTILATION_EXTRACT_FAULT
    - Bool
    - True if ventilation extractor fault

- A32NX_VENTILATION_EXTRACT_TOGGLE
    - Bool
    - True if ventilation extractor on

- A32NX_VENTILATION_CABFANS_TOGGLE
    - Bool
    - True if cabin fans on/auto
