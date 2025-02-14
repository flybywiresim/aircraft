use fxhash::{FxHashMap, FxHashSet};
use serde::de::{Deserializer, SeqAccess, Visitor};
use systems::failures::FailureType;

#[derive(Default)]
pub(super) struct Failures {
    identifier_to_failure_type: FxHashMap<u64, FailureType>,
    active_failures: Option<FxHashSet<FailureType>>,
}
impl Failures {
    pub(super) fn add_failures(&mut self, failures: impl IntoIterator<Item = (u64, FailureType)>) {
        self.identifier_to_failure_type.extend(failures);
    }

    pub(super) fn handle_failure_update(&mut self, data: &str) {
        let visitor = FailureIdVisitor(&self.identifier_to_failure_type);
        self.active_failures =
            match serde_json::Deserializer::from_str(data).deserialize_seq(visitor) {
                Ok(active_failures) => Some(active_failures),
                Err(e) => {
                    eprintln!("SYSTEMS: Failed to parse failure update message: '{e}'");
                    None
                }
            };
    }

    pub(super) fn get_updated_active_failures(&mut self) -> Option<FxHashSet<FailureType>> {
        self.active_failures.take()
    }
}

struct FailureIdVisitor<'a>(&'a FxHashMap<u64, FailureType>);
impl<'a, 'de> Visitor<'de> for FailureIdVisitor<'a> {
    type Value = FxHashSet<FailureType>;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(formatter, "a sequence of failure ids")
    }

    fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
    where
        A: SeqAccess<'de>,
    {
        let mut active_failures = FxHashSet::with_capacity_and_hasher(
            seq.size_hint().unwrap_or_default(),
            Default::default(),
        );
        while let Some(failure_id) = seq.next_element()? {
            if let Some(failure) = self.0.get(&failure_id).copied() {
                active_failures.insert(failure);
            }
        }
        Ok(active_failures)
    }
}
