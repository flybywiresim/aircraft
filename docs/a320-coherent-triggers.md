# A32NX CoherentGT Triggers

## FMGC

### Type `Type_2_Message`

See `FMMessage` in `src/shared/src/FmMessages.ts`.

### Triggers

- A32NX_FMGC_SEND_MESSAGE_TO_MCDU
    - Sends a Type II message to the MCDU (both at the moment)
    - The `efisTarget` and `efisText` options are ignored by the MCDU
    - Payload: `[Type_2_Message]`

- A32NX_FMGC_SEND_MESSAGE_TO_EFIS
    - Sends a Type II message to the MCDU (both at the moment)
    - The `efisTarget` option specified whether the PFD or ND will display the message
    - Payload: `[Type_2_Message]`

- A32NX_FMGC_RECALL_MESSAGE_FROM_MCDU_WITH_ID
    - Removes a previously sent Type II message from the MCDU
    - The `efisTarget` option is ignored by the MCDU
    - Payload: `[id: number]`
    - `id`:
        -  The ID of the message to remove

- A32NX_FMGC_RECALL_MESSAGE_FROM_EFIS_WITH_ID
    - Removes a previously sent Type II message from the EFIS
    - The `efisTarget` option is ignored (both displays process the command)
    - Payload: `[id: number]`
    - `id`:
        -  The ID of the message to remove