# A32NX CoherentGT Triggers

## FMGC

### Type `Type_2_Message`

See `FMMessage` in `src/shared/src/FmMessages.ts`.

### Triggers

- A32NX_FMGC_SEND_MESSAGE_TO_MCDU
    - Sends a Type II message to the MCDU (both at the moment)
    - The `efisTarget` and `efisText` options are ignored by the MCDU
    - Payload: `[Type_2_Message]`

- A32NX_FMGC_RECALL_MESSAGE_FROM_MCDU_WITH_ID
    - Removes a previously sent Type II message from the MCDU
    - The `efisTarget` option is ignored by the MCDU
    - Payload: `[text: string]`
    - `text`:
        -  The MCDU text of the message to remove
