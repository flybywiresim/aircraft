#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(dead_code)]

use serde::Serialize;

use bytemuck::AnyBitPattern;

include!(concat!(env!("OUT_DIR"), "/bindings_380.rs"));
