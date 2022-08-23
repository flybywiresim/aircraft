# A32NX Flight Warning System

This folder contains the code for the Flight Warning System (FWS) used by the A32NX (ATA 31).

The Flight Warning System is made up the following parts:
- 2 Flight Warning Computers (FWCs)
- 2 System Data Acquisition Concentrators (SDACs)

## Flight Warning Computers

The FWS has of two independent Flight Warning Computers (FWCs).

Each FWC is directly to a series of the most critical aircraft systems and has all the data available to determine the
current flight phase and generate red warnings.

A Flight Warning Computer is made up of four logical parts[^1]:

1. Parameter Acquisition
2. Warning Computation
3. Warning Presentation & Output
4. Audio Generation

[^1]: See http://vasy.inria.fr/publications/Garavel-Hautbois-93.html

### Basics
The FWCs are made up of 3 CPUs that run independently to provide the functionalities listed above.
The primary warning and monitor logic runs on a CPU with a cycle time of 480ms.

### Inputs
The FWCs acquire various parameters from other systems.
The types of signals range from simple discrete circuits for detecting single button pushes to fully digital ARINC429 conveying encoded numeric data.

#### Discrete Booleans

A boolean can be transmitted over a discrete wire.
There are three different flags that together make up how the signal is interpreted:
- `+` or `-`: Whether to check for Ground (-) or for +28VDC (+)
- `D` or `I`: Whether the signal should be used directly as-is (D) or inverted (I)
- `O` suffix (for "off"): Whether the inner part of the signal (spurious/permanent) should be flipped

Here is full matrix of how the different signals are interpreted:

| Code   | 0                    | 1                     |
|--------|----------------------|-----------------------|
| `DP-`  | Spurious Gnd         | Permanent Non-Gnd     |
| `DP+`  | Permanent Non-+28VDC | Spurious +28VDC       |
| `DP-O` | Spurious Non-Gnd     | Permanent Gnd         |
| `DP+O` | Permanent +28VDC     | Spurious Non-+28VDC   |
| `IP-`  | Permanent Non-Gnd    | Spurious Gnd          |
| `IP+`  | Spurious +28VDC      | Permanent Non-+28VDC  |
| `IP-O` | Permanent Gnd        | Spurious Non-Gnd      |
| `IP+O` | Spurious Non-+28VDC  | Permanent +28VDC      |

#### ARINC 429

The ARINC 429 protocol is a technical standard for transmitting digital signals between systems.
A system wanting to transmit ARINC 429 data owns an ARINC 429 bus. Many receiving systems may be connected to this bus as passive listeners.
As the sender on a bus is always known (due to the physical ownership of a bus) there is no need for a "global" address system; instead each listener must know the types of data the sender is sending and how to decode it.

Transmissions are organized in 32-bit words, usually containing:
- An 8 bit numeric label, as the key differentiator between words.
- A 2 bit source identifier, to differentiate up to four identical systems sending the same data.
- A 19 bit data section
- A 2 bit Sign/Status Matrix,
- One parity bit
In some special cases the SDI can also be used to provide an additional two bits to the data section, instead of identifying the source.

Words are retransmitted periodically, and a receiving system will usually memorize the last transmitted value for its own local processing purposes.
However if a word has not been received for a chosen timeout period, the receiving system may chose to discard the last known value and assume a failure case.
This logic is specific to each receiving system.

Signals are commonly encoded in a few different ways:
- Discrete Words, collections of individual bits that would otherwise be expressed as individual physical wires
- Numerical Words, typically encoded as binary numbers (BNR) or binary coded decimals (BCD).

In addition to conveying the signal, ARINC 429 also conveys the validity of the signal:

| Abbr. | Status           |
|-------|------------------|
| NO    | Normal Operation |
| FT    | Functional Test  |
| NCD   | No Computed Data |
| FW    | Failure Warning  |


### Parameter Acquisition

The FWCs have a dedicated CPU performing the acquisition functionality across thousands of inputs.
Inputs are validated (e.g. parity checked) and held in memory for warning activation.

Both FWCs are connected separately to same systems, and FWCs are able to recover from an input failure by acquiring a
parameter from the opposite FWC.

### Warning Activation

Based on the acquired parameters, the FWC calculates a set of activated warnings.
This is done mostly using simple boolean logic, where a warning is considered activated when all of its conditions are fulfilled.

Types of warnings:
- Primary Failures
- Secondary Failures
- Independent Failures
- Auto Call Out / Decision Heights
- Memo
- Special Lines
- Status

### Warning Monitor

Before the warnings are passed from an FWC on to the pilots, its monitor (implemented in software) provides a set of inhibitions to ensure pilots can handle and respond to the warnings appropriately:
- A flight phase inhibition prevents warnings from appearing at critical or unrelated phases of the flight.
  For example, a very minor fault may not be presented during the takeoff roll as to not draw too much attention.
  However after the flight reaches a certain altitude and the immediate takeoff has completed, the warning would appear as the inhibition has ended.
- A clear button allows pilots to remove warnings from the display. After clearing, a warning is considered dealt with and will usually remain hidden for the rest of the flight or until manually recalled.
  The warning will also reappear if both it resolves by no longer fulfilling its conditions (for example because a failed system has been reset) and then spontaneously meeting its conditions again at a later point in time.
- As a last resort, the Emergency Cancel pushbutton mutes any audio emission and forces the displayed warning with the highest priority to be permanently canceled, regardless of its future activation. This can be helpful in case where warning conditions rapidly and repeatedly switch between fulfilled and unfulfilled.

Finally, a priority system ensures that the most important warnings are relayed first and that the sound outputs remain coherent by only playing a small number of sounds at once.

### Display Output

The FWCs both

### Sound Emission

There are two categories of sounds that can be emitted by an FWC:
- Audio
- Synthetic Voice


#### Synthetic Voice
The Synthetic Voice seems to be:
- Not normally interruptable, so it can be triggered even by a single pulse
- Bypassing any kind of confirmation delay on the warning node
- Able to buffer a single callout

#### Sound Inhibition

The general sound scape seems to be architected in a way where it is strongly avoided to play more than one synthetic
voice at a time.

Each FWC is directly connected to the Emergency Cancel button on the ECAM control panel.
Holding the Emergency Cancel button immediately inhibits all currently sounds until it is released.
Additionally, there may be a one-second silence after it is released and the warning with the highest priority is
inhibited.

The FWCs receive discretes from the GPWS and TCAS to prevent non-critical callouts from playing while either of these
systems is emitting synthetic voice. In the other hand the FWCs can inhibit these systems from playing while extremely
critical warnings are emitted (e.g. Stall callout).

The two FWCs are connected via discretes, so they can cross-inhibit each other when a sound is played.
For this task, each FWC has two outgoing discretes, one for Synthetic Voice, and one for other audio.
If an FWC detects that the opposite FWC is playing Audio/Synthetic voice, it will inhibit its own Audio/Synthetic voice
output respectively for the duration of the inhibition.
This essentially means that the first FWC to play Audio or Synthetic Voice wins in that category and the later FWC does not even attempt to play a sound.
However, this is done on a sound by sound basis, and as soon as an FWC releases its sound inhibition it is fair game for the opposite FWC to take over.

## System Data Acquisition Concentrators

The FWS has two independent System Data Acquisition Concentrators (SDACs).

Each SDAC is connected to a wide variety of aircraft systems via discrete and ARINC429 inputs.
In the FWS architecture the SDACs provide supplemental data to the FWCs and are required for amber warnings.

They are not currently implemented in the A32NX.
