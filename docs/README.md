# Documentation Placeholder Readme

Fill me out!

## Custom Fly-By-Wire

In case of Microsoft Store version, the configuration of the throttle can be found here:
`%LOCALAPPDATA%\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe\LocalState\packages\<name of a32nx folder in community folder>\work\ThrottleConfiguration.ini`

In case of Steam version, the configuration of the throttle can be found here:
`%APPDATA%\Roaming\Microsoft Flight Simulator\Packages\<name of a32nx folder in community folder>\work\ThrottleConfiguration.ini`

This is the default configuration:
```
[Throttle]
Enabled = true
ReverseOnAxis = false
DetentReverseFull = -1.00
DetentIdle = -1.00
DetentClimb = 0.89
DetentFlexMct = 0.95
DetentTakeOffGoAround = 1.00
```

ℹ️ The configuration file is written with the default configuration when it's not found.

⚠️ The plane has to be reloaded to use a changed configured

The following values can be configured:

| Parameter|Comment|
|----------|-------------|
| Enabled |  Enabled or disables throttle handling completely |
| ReverseOnAxis | When true reverse will be mapped on throttle axis and parameter *DetentReverseFull* is used  |
| DetentReverseFull | Configures the throttle value for full reverse |
| DetentIdle | Configures the throttle value for IDLE detent |
| DetentClimb | Configures the throttle value for CLB detent |
| DetentFlexMct | Configures the throttle value for FLX/MCT detent |
| DetentTakeOffGoAround | Configures the throttle value for TOGA detent |
