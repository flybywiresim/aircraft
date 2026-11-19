# ATCCOM

The active MFD uses FSComponent pages. CONNECT sends ATSU logon/logoff requests and
shows station status. REQUEST sends DCL to the ATSU mailbox. REPORT & NOTIFY
currently supports short CPDLC free text, and EMER supports the standard MAYDAY
and PAN PAN downlink elements. MSG RECORD reads received and monitored messages
from ATSU storage. The remaining report templates and ADS-C controls are not
implemented.

D-ATIS displays the source report when available. If the source has no D-ATIS,
it requests a METAR and labels it METAR ONLY. Neither mode guarantees that an
external weather service will answer; NO REPLY remains possible offline.
