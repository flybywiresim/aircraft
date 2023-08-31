use crate::{
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::{SimulationElement, SimulationElementVisitor},
};

#[derive(Clone)]
pub struct VHF {
    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,
}
impl VHF {
    pub fn new_vhf1() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::DirectCurrentEssential,
        }
    }

    pub fn new_vhf2() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::DirectCurrent(2),
        }
    }

    pub fn new_vhf3() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::DirectCurrent(1),
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }
}

impl SimulationElement for VHF {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }
}

#[derive(Clone)]
pub struct COMM {
    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,
}
impl COMM {
    pub fn new_hf1() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::AlternatingCurrentEssentialShed,
        }
    }

    pub fn new_hf2() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::AlternatingCurrent(2),
        }
    }

    pub fn new_cids1() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::DirectCurrentEssential,
        }
    }

    pub fn new_cids2() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::DirectCurrentEssential,
        }
    }

    pub fn new_flt_int() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::DirectCurrentEssential,
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }
}

impl SimulationElement for COMM {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }
}

#[derive(Clone)]
pub struct ADF {
    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,
}
impl ADF {
    pub fn new_adf1() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::AlternatingCurrentEssentialShed,
        }
    }

    pub fn new_adf2() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::AlternatingCurrent(2),
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }
}

impl SimulationElement for ADF {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }
}

#[derive(Clone)]
pub struct VOR {
    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,
}
impl VOR {
    pub fn new_vor1() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::AlternatingCurrentEssential,
        }
    }

    pub fn new_vor2() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::AlternatingCurrent(2),
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }
}

impl SimulationElement for VOR {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }
}

#[derive(Clone)]
pub struct ILS {
    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,
}
impl ILS {
    pub fn new_ils() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::DirectCurrent(1),
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }
}

impl SimulationElement for ILS {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }
}

#[derive(Clone)]
pub struct GLS {
    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,
}
impl GLS {
    pub fn new_gls() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::DirectCurrent(1),
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }
}

impl SimulationElement for GLS {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }
}

#[derive(Clone)]
pub struct MARKERS {
    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,
}
impl MARKERS {
    pub fn new_markers() -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by: ElectricalBusType::DirectCurrent(1),
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }
}

impl SimulationElement for MARKERS {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }
}
