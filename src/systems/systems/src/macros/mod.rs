/// Provide potential with the given normal range.
macro_rules! provide_frequency {
    ($t: ty, $normal_range: expr) => {
        impl ProvideFrequency for $t {
            fn frequency(&self) -> Frequency {
                self.output_frequency
            }

            fn frequency_normal(&self) -> bool {
                let hz = self.output_frequency.get::<hertz>();
                $normal_range.contains(&hz)
            }
        }
    };
}

/// Provide load with a normal range of 0% to 100%.
macro_rules! provide_load {
    ($t: ty) => {
        impl ProvideLoad for $t {
            fn load(&self) -> Ratio {
                self.load
            }

            fn load_normal(&self) -> bool {
                self.load <= Ratio::new::<percent>(100.)
            }
        }
    };
}

/// Provide potential with the given normal range.
macro_rules! provide_potential {
    ($t: ty, $normal_range: expr) => {
        impl ProvidePotential for $t {
            fn potential(&self) -> ElectricPotential {
                self.output_potential
            }

            fn potential_normal(&self) -> bool {
                let volts = self.output_potential.get::<volt>();
                $normal_range.contains(&volts)
            }
        }
    };
}

#[macro_export]
macro_rules! assert_is_powered {
    ($tb:expr, $bus_type:expr) => {
        assert!(
            $tb.is_powered($bus_type),
            "Expected the {} bus to be powered, but it is unpowered.",
            $bus_type.to_string()
        );
    };
}

#[macro_export]
macro_rules! assert_is_unpowered {
    ($tb:expr, $bus_type:expr) => {
        assert!(
            !$tb.is_powered($bus_type),
            "Expected the {} bus to be unpowered, but it is powered.",
            $bus_type.to_string()
        );
    };
}

#[macro_export]
macro_rules! assert_is_powered_by {
    ($tb:expr, $bus_type:expr, $origin:expr) => {
        let potential = $tb.potential_of($bus_type);
        let origins = potential.origins();
        if origins.count() == 0 {
            panic!(
                "Expected the {} bus to be powered by {}, but it is unpowered.",
                $bus_type.to_string(),
                $origin.to_string(),
            )
        }

        assert!(
            $tb.is_single_origin($bus_type, $origin),
            "Expected the {} bus to be powered by {}, but it is powered.",
            $bus_type.to_string(),
            $origin.to_string()
        );
    };
}
