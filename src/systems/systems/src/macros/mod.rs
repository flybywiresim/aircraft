macro_rules! potential_target {
    ($t: ty) => {
        impl PotentialTarget for $t {
            fn powered_by<T: PotentialSource + ?Sized>(&mut self, source: &T) {
                self.input = source.output_potential();
            }

            fn or_powered_by<T: PotentialSource + ?Sized>(&mut self, source: &T) {
                if self.input.is_unpowered() {
                    self.powered_by(source);
                }
            }
        }
    };
}
