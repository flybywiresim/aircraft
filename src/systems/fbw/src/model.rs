mod sys {
    #![allow(clippy::all)]
    #![allow(non_upper_case_globals)]
    #![allow(non_camel_case_types)]
    #![allow(non_snake_case)]
    #![allow(dead_code)]
    #![allow(safe_packed_borrows)]
    include!(concat!(env!("OUT_DIR"), "/model_bindings.rs"));
}

macro_rules! wrapper {
    ($name:ident, $iname:ident) => {
        paste::paste! {
            #[derive(Debug)]
            pub(crate) struct $name(sys:: [< $name ModelClass >]);

            impl Default for $name {
                fn default() -> Self {
                    $name(unsafe {
                        sys:: [< $name ModelClass >] ::new()
                    })
                }
            }

            impl $name {
                #[inline]
                pub(crate) fn initialize(&mut self) {
                    unsafe {
                        self.0.initialize();
                    }
                }

                #[inline]
                pub(crate) fn step(&mut self) {
                    unsafe {
                        self.0.step();
                    }
                }

                #[inline]
                pub(crate) fn input(&mut self) -> &mut sys:: [< $iname _input >] {
                    &mut self.0. [< $name _U >] .in_
                }

                #[inline]
                pub(crate) fn output(&self) -> &sys:: [< $iname _output >] {
                    &self.0. [< $name _Y >] .out
                }

                #[inline]
                pub(crate) fn output_mut(&mut self) -> &mut sys:: [< $iname _output >] {
                    &mut self.0. [< $name _Y >] .out
                }
            }

            impl Drop for $name {
                fn drop(&mut self) {
                    unsafe {
                        self.0.terminate();
                    }
                }
            }
        }
    };
}

wrapper!(FlyByWire, fbw);
wrapper!(AutopilotLaws, ap_laws);
wrapper!(AutopilotStateMachine, ap_sm);
