//! Provides things one needs for creating systems code for a flight simulator aircraft.
//!
//! # Terminology
//! Throughout type names and documentation:
//! - **Simulator** refers to the simulator you integrate with, such as MSFS.
//! - **Simulation** refers to the system simulation you create by using this crate.
#[macro_use]
pub mod macros;

pub mod apu;
pub mod electrical;
pub mod engine;
pub mod failures;
pub mod hydraulic;
pub mod landing_gear;
pub mod navigation;
pub mod overhead;
pub mod pneumatic;
pub mod pressurization;
pub mod shared;
pub mod simulation;
