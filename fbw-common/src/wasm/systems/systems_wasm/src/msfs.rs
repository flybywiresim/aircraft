//! Module declared to be able to compile documentation.
//! Does not provide any meaningful functionality.
#[cfg(not(target_arch = "wasm32"))]
pub(crate) mod legacy {
    use std::cell::Cell;
    use std::rc::Rc;

    use msfs::sys::{ID32, UINT32};

    pub fn execute_calculator_code<T>(_code: &str) {}

    pub fn trigger_key_event(_event_id: ID32, _value: UINT32) {}

    pub fn trigger_key_event_ex1(
        _event_id: ID32,
        _value0: UINT32,
        _value1: UINT32,
        _value2: UINT32,
        _value3: UINT32,
        _value4: UINT32,
    ) {
    }

    #[derive(Debug)]
    pub struct AircraftVariable {}

    impl AircraftVariable {
        pub fn from(
            _name: &str,
            _units: &str,
            _index: usize,
        ) -> Result<Self, Box<dyn std::error::Error>> {
            Ok(Self {})
        }

        pub fn get(&self) -> f64 {
            0.
        }
    }

    #[derive(Debug)]
    pub struct NamedVariable {
        value: Rc<Cell<f64>>,
    }

    impl NamedVariable {
        pub fn from(_name: &str) -> Self {
            Self {
                value: Rc::new(Cell::new(0.)),
            }
        }

        pub fn get_value(&self) -> f64 {
            self.value.get()
        }

        pub fn set_value(&self, value: f64) {
            self.value.set(value);
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
pub(crate) mod commbus {
    use std::{cell::RefCell, marker::PhantomData, rc::Rc};

    #[derive(Default)]
    #[allow(clippy::upper_case_acronyms, dead_code)]
    pub enum CommBusBroadcastFlags {
        JS,
        WASM,
        WASMSelfCall,
        #[default]
        Default,
        AllWASM,
        All,
    }

    #[derive(Default)]
    pub struct CommBus<'a> {
        events: Vec<Rc<RefCell<Option<CommBusEvent<'a>>>>>,
    }
    impl<'a> CommBus<'a> {
        /// Registers to a communication event.
        /// Returns the event if the registration was successful.
        /// By calling `take` on the returned value the event gets unregistered.
        pub fn register(
            &mut self,
            event_name: &str,
            callback: impl FnMut(&str) + 'a,
        ) -> Option<Rc<RefCell<Option<CommBusEvent<'a>>>>> {
            if let Some(event) = CommBusEvent::register(event_name, callback) {
                let event = Rc::new(RefCell::new(Some(event)));
                self.events.push(event.clone());
                Some(event)
            } else {
                None
            }
        }

        /// Calls a communication event.
        /// Returns `true` if the call was successful.
        pub fn call(_event_name: &str, _args: &str, _called: CommBusBroadcastFlags) -> bool {
            true
        }
    }

    /// CommBus handle. When this handle goes out of scope the callback will be unregistered.
    pub struct CommBusEvent<'a>(PhantomData<&'a ()>);
    impl<'a> CommBusEvent<'a> {
        /// Registers to a communication event.
        pub fn register(_event_name: &str, _callback: impl FnMut(&str) + 'a) -> Option<Self> {
            Some(Self(PhantomData))
        }
    }
}
