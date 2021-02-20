// TODO: get rid of this all and replace it with EFB config

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(default, rename_all = "PascalCase")]
pub(crate) struct ThrottleConfig {
    pub(crate) log: bool,
    pub(crate) enabled: bool,
    pub(crate) reverse_on_axis: bool,
    pub(crate) reverse_idle: bool,
    pub(crate) detent_dead_zone: f64,
    pub(crate) detent_reverse_full: f64,
    pub(crate) detent_reverse_idle: f64,
    pub(crate) detent_idle: f64,
    pub(crate) detent_climb: f64,
    pub(crate) detent_flex_mct: f64,
    pub(crate) detent_toga: f64,
}

impl Default for ThrottleConfig {
    fn default() -> Self {
        ThrottleConfig {
            log: true,
            enabled: true,
            reverse_on_axis: false,
            reverse_idle: false,
            detent_dead_zone: 0.0,
            detent_reverse_full: -1.0,
            detent_reverse_idle: -0.70,
            detent_idle: 0.0,
            detent_climb: 0.89,
            detent_flex_mct: 0.95,
            detent_toga: 1.0,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(default, rename_all = "PascalCase")]
pub(crate) struct ModelConfig {
    #[serde(rename = "AutopilotStateMachineEnabled")]
    pub(crate) autopilot_state_machine_enabled: bool,
    pub(crate) autopilot_laws_enabled: bool,
    pub(crate) fly_by_wire_enabled: bool,
    pub(crate) custom_flight_guidance_enabled: bool,
    pub(crate) flight_director_smoothing_enabled: bool,
    pub(crate) flight_director_smoothing_factor: f64,
    pub(crate) flight_director_smoothing_limit: f64,
    pub(crate) autothrust_workaround_enabled: bool,
}

impl Default for ModelConfig {
    fn default() -> Self {
        ModelConfig {
            autopilot_state_machine_enabled: true,
            autopilot_laws_enabled: true,
            fly_by_wire_enabled: true,
            custom_flight_guidance_enabled: false,
            flight_director_smoothing_enabled: true,
            flight_director_smoothing_factor: 2.5,
            flight_director_smoothing_limit: 20.0,
            autothrust_workaround_enabled: true,
        }
    }
}
