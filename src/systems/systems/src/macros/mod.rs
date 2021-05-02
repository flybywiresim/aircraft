macro_rules! potential_target {
    ($t: ty) => {
        impl PotentialTarget for $t {
            fn powered_by<T: PotentialSource + ?Sized>(&mut self, source: &T) {
                self.input_potential = source.output();
            }

            fn or_powered_by<T: PotentialSource + ?Sized>(&mut self, source: &T) {
                self.input_potential = self.input_potential.merge(&source.output());
            }
        }
    };
}

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
