use super::{A380FuelPump, A380FuelValve};
use systems::shared::arinc429::{Arinc429Word, SignStatus};

const FIRST_DISCRETE_BIT: u8 = 11;
const DISCRETE_BITS_PER_WORD: usize = 19;

const LEFT_FUEL_PUMPS: [A380FuelPump; 10] = [
    A380FuelPump::Feed1Main,
    A380FuelPump::Feed1Stby,
    A380FuelPump::Feed2Main,
    A380FuelPump::Feed2Stby,
    A380FuelPump::LeftOuter,
    A380FuelPump::LeftMidFwd,
    A380FuelPump::LeftMidAft,
    A380FuelPump::LeftInnerFwd,
    A380FuelPump::LeftInnerAft,
    A380FuelPump::TrimLeft,
];
const RIGHT_FUEL_PUMPS: [A380FuelPump; 11] = [
    A380FuelPump::Feed3Main,
    A380FuelPump::Feed3Stby,
    A380FuelPump::Feed4Main,
    A380FuelPump::Feed4Stby,
    A380FuelPump::RightOuter,
    A380FuelPump::RightMidFwd,
    A380FuelPump::RightMidAft,
    A380FuelPump::RightInnerFwd,
    A380FuelPump::RightInnerAft,
    A380FuelPump::TrimRight,
    A380FuelPump::Apu,
];

pub(super) fn pack_fuel_pump_words(
    ssm: SignStatus,
    mut state_for_pump: impl FnMut(A380FuelPump) -> bool,
) -> [Arinc429Word<u32>; 2] {
    [
        pack_discrete_word_from_items(ssm, LEFT_FUEL_PUMPS, &mut state_for_pump),
        pack_discrete_word_from_items(ssm, RIGHT_FUEL_PUMPS, &mut state_for_pump),
    ]
}

pub(super) fn pack_fuel_valve_words(
    ssm: SignStatus,
    state_for_valve: impl FnMut(A380FuelValve) -> bool,
) -> [Arinc429Word<u32>; 3] {
    pack_discrete_words_from_items(ssm, A380FuelValve::iterator(), state_for_valve)
}

pub(super) fn pack_discrete_words<const WORD_COUNT: usize>(
    ssm: SignStatus,
    states: impl IntoIterator<Item = bool>,
) -> [Arinc429Word<u32>; WORD_COUNT] {
    let mut words = [Arinc429Word::new(0, ssm); WORD_COUNT];
    let mut states = states.into_iter();

    for word in words.iter_mut() {
        for (bit_offset, state) in states.by_ref().take(DISCRETE_BITS_PER_WORD).enumerate() {
            word.set_bit(FIRST_DISCRETE_BIT + bit_offset as u8, state);
        }
    }
    words
}

pub(super) fn pack_discrete_words_from_items<const WORD_COUNT: usize, T>(
    ssm: SignStatus,
    items: impl IntoIterator<Item = T>,
    state_for_item: impl FnMut(T) -> bool,
) -> [Arinc429Word<u32>; WORD_COUNT] {
    pack_discrete_words(ssm, items.into_iter().map(state_for_item))
}

fn pack_discrete_word_from_items<T>(
    ssm: SignStatus,
    items: impl IntoIterator<Item = T>,
    state_for_item: impl FnMut(T) -> bool,
) -> Arinc429Word<u32> {
    let [word] = pack_discrete_words_from_items::<1, T>(ssm, items, state_for_item);
    word
}

pub(super) fn bit_from_discrete_words<const WORD_COUNT: usize>(
    words: &[u32; WORD_COUNT],
    index: usize,
) -> bool {
    let word_index = index / DISCRETE_BITS_PER_WORD;
    let bit = (FIRST_DISCRETE_BIT - 1) as usize + index % DISCRETE_BITS_PER_WORD;

    word_index < words.len() && ((words[word_index] >> bit) & 1) != 0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn discrete_words_pack_fuel_pump_words_with_running_word_bit_mapping() {
        let [left_word, right_word] = pack_fuel_pump_words(SignStatus::NormalOperation, |pump| {
            matches!(
                pump,
                A380FuelPump::Feed1Main
                    | A380FuelPump::LeftInnerAft
                    | A380FuelPump::TrimLeft
                    | A380FuelPump::Feed3Stby
                    | A380FuelPump::RightInnerAft
                    | A380FuelPump::Apu
            )
        });

        assert!(left_word.is_normal_operation());
        assert!(left_word.get_bit(11));
        assert!(!left_word.get_bit(12));
        assert!(left_word.get_bit(19));
        assert!(left_word.get_bit(20));
        assert!(!left_word.get_bit(21));

        assert!(right_word.is_normal_operation());
        assert!(!right_word.get_bit(11));
        assert!(right_word.get_bit(12));
        assert!(right_word.get_bit(19));
        assert!(!right_word.get_bit(20));
        assert!(right_word.get_bit(21));
    }

    #[test]
    fn discrete_words_pack_fuel_valve_words_across_word_boundaries() {
        let words = pack_fuel_valve_words(SignStatus::NormalOperation, |valve| {
            matches!(
                valve,
                A380FuelValve::Engine1LowPressureValve
                    | A380FuelValve::LeftInnerAftTransferValve
                    | A380FuelValve::LeftMidAftTransferValve
                    | A380FuelValve::TransferDefuelValve
                    | A380FuelValve::LeftJettisonNozzleValve
                    | A380FuelValve::RightJettisonNozzleValve
            )
        });

        assert!(words.iter().all(Arinc429Word::is_normal_operation));

        assert!(words[0].get_bit(11));
        assert!(words[0].get_bit(29));
        assert!(words[1].get_bit(11));
        assert!(words[2].get_bit(11));
        assert!(words[2].get_bit(12));
        assert!(words[2].get_bit(13));

        assert!(!words[0].get_bit(12));
        assert!(!words[1].get_bit(12));
        assert!(!words[2].get_bit(14));
    }

    #[test]
    fn discrete_word_bit_reader_uses_zero_based_word_indices() {
        let packed_words = pack_discrete_words::<3>(
            SignStatus::NormalOperation,
            (0..41).map(|index| matches!(index, 0 | 18 | 19 | 38 | 39 | 40)),
        );
        let words = packed_words.map(|word| word.value());

        for index in [0, 18, 19, 38, 39, 40] {
            assert!(bit_from_discrete_words(&words, index));
        }

        for index in [1, 20, 37, 41] {
            assert!(!bit_from_discrete_words(&words, index));
        }
    }
}
