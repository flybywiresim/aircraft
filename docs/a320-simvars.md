# A320neo Local SimVars

- A32NX_ADIRS_PFD_ALIGNED
    - Bool
    - 0 when ADIRS is not aligned
    - 1 when ADIRS is aligned or 3 minutes after it has started aligning
- A32NX_Neo_ADIRS_START_TIME
    - Seconds
    - Holds the start time in seconds that the ADIRS TIMER will count down from
    - Used to have certain things turn on based on a percentage of the total alignment time
