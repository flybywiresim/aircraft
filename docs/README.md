# Documentation

## Custom Fly-By-Wire System

⚠️ This is work in progress, there are still issues, see section Known issues below!

### Compatibility

- :x: incompatible with YourControls add-on

### Throttle configuration

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

### Known issues

⚠️ The custom fly-by-wire system is not yet on study level. In order to achieve this level a longer effort is needed. The system is a large improvement over the default implementation and there is no reason to hold it back longer than necessary.

ℹ️ Tuning is a large effort to be done for differnt flight conditions like speed, configuration, weight and center-of-gravity (CG). You can help by reporting issues in certain flight conditions. Please take note of important conditions mentioned before.

#### Not solved or missing

- :x: pitch normal law (C* law) creates a too small pitch rate on low speed or g-load on higher speeds
- :x: High speed protection
- :x: High angle of attack (AoA) protection
- :x: alternative law
- :x: direct law (in flight)
- :x: simulation of hydraulic system missing -> when engines are off / electric pump is off control surfaces should not work

#### Considered solved

- :heavy_check_mark: pitch normal law (C* law) sometimes oscillates on low speed
- :heavy_check_mark: yaw damper / rudder control missing
- :heavy_check_mark: pitch attitude protections can oscillate
- :heavy_check_mark: nose-down pitch attitude protection sometimes kicks-in too early
- :heavy_check_mark: transformation from ground to flight mode might take longer than intended (nose might drop after releasing the stick)
- :heavy_check_mark: auto-trim feature locks trim wheel completely
- :heavy_check_mark: flare mode might be stronger than expected, needs to be investigated
- :heavy_check_mark: after landing sometimes a slight pitch up moment is introduced, needs to be investigated
- :heavy_check_mark: strange interaction with default auto thrust system -> thrust lever sometimes does not move, fix is to manually disable ATHR
- :heavy_check_mark: after a longer pause the fbw system goes crazy
