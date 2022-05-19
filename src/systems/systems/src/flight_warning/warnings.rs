use std::fmt::{Debug, Display, Formatter};

#[derive(Eq, PartialEq, Hash, Copy, Clone)]
pub struct WarningCode {
    ata: u8,
    sub_ata: u8,
    id: u16,
}

/// A helper macro to
#[macro_export]
macro_rules! warning_code {
    ($ata: expr, $sub_ata: expr, $id: expr) => {{
        debug_assert_eq!($ata.len(), 2);
        debug_assert_eq!($sub_ata.len(), 2);
        debug_assert_eq!($id.len(), 3);
        WarningCode::new(
            $ata.parse::<u8>().unwrap(),
            $sub_ata.parse::<u8>().unwrap(),
            $id.parse::<u16>().unwrap(),
        )
    }};
}

impl WarningCode {
    pub fn new(ata: u8, sub_ata: u8, id: u16) -> Self {
        Self { ata, sub_ata, id }
    }
}

impl Display for WarningCode {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:02}-{:02}-{:03}", self.ata, self.sub_ata, self.id)
    }
}

impl Debug for WarningCode {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:02}-{:02}-{:03}", self.ata, self.sub_ata, self.id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    mod warning_code_tests {
        use super::*;

        #[test]
        fn can_be_made_human_readable() {
            assert_eq!(WarningCode::new(0, 0, 10).to_string(), "00-00-010");
            assert_eq!(WarningCode::new(21, 27, 10).to_string(), "21-27-010");
            assert_eq!(WarningCode::new(26, 0, 130).to_string(), "26-00-130");
            assert_eq!(WarningCode::new(77, 0, 80).to_string(), "77-00-080");
        }

        #[test]
        fn can_be_compared() {
            assert_eq!(WarningCode::new(0, 0, 10), WarningCode::new(0, 0, 10));
            assert_eq!(WarningCode::new(21, 27, 10), WarningCode::new(21, 27, 10));
            assert_eq!(WarningCode::new(26, 0, 130), WarningCode::new(26, 0, 130));
            assert_eq!(WarningCode::new(77, 0, 80), WarningCode::new(77, 0, 80));
        }
    }
}
