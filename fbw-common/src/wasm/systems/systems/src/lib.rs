//! Provides things one needs for creating systems code for a flight simulator aircraft.
//!
//! # Terminology
//! Throughout type names and documentation:
//! - **Simulator** refers to the simulator you integrate with, such as MSFS.
//! - **Simulation** refers to the system simulation you create by using this crate.
#[macro_use]
pub mod macros;

pub mod air_conditioning;
pub mod apu;
pub mod electrical;
pub mod engine;
pub mod enhanced_gpwc;
pub mod failures;
pub mod flight_warning;
pub mod hydraulic;
pub mod icing_state;
pub mod indicating_recording;
pub mod integrated_modular_avionics;
pub mod landing_gear;
pub mod navigation;
pub mod overhead;
pub mod payload;
pub mod physics;
pub mod pneumatic;
pub mod shared;
pub mod simulation;
pub mod structural_flex;
pub mod wind_turbine;
