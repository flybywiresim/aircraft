# A380X virtual crew voices

Generates the phrases of the A380X virtual crew (`fbw-a380x/src/systems/extras-host/modules/virtual_crew`) with
the [Piper](https://github.com/OHF-Voice/piper1-gpl) speech synthesiser.

## Phrases and voices

The phrases are defined once in `voice-lines.json` of the virtual crew module. Each phrase is generated for every
voice:

| Voice  | Piper model             | Training data license |
|--------|-------------------------|-----------------------|
| male   | `en_US-joe-medium`      | CC0                   |
| female | `en_US-kristin-medium`  | Public domain         |

Only models whose training data allows the redistribution of the generated audio are used. Several popular Piper
voices (e.g. `ryan`, `hfc_male`, `hfc_female`) are trained on non-commercial (CC BY-NC-SA) data and must not be used.

## Generating

```sh
python3 -m venv .venv
.venv/bin/pip install -r tools/virtual-crew-voices/requirements.txt
.venv/bin/python tools/virtual-crew-voices/generate_voices.py
```

The script downloads the models on first use (to `build/piper-models`) and writes:

- `build/virtual-crew-voices/<voice>/vcrew_<voice>_<phrase>.wav`, one file per voice and phrase, without the leading
  and trailing silence, so that composed phrases ("one" "two" "zero") follow each other naturally
- `build/virtual-crew-voices/sound-xml-entries.xml`, the `<AvionicSounds>` entries for `sound.xml`
- `voice-line-durations.json` in the virtual crew module, used to play the phrases one after the other.
  Commit it whenever the phrases change.

## Packaging for MSFS

The virtual crew plays the phrases with `PLAY_INSTRUMENT_SOUND`, which requires a Wwise event per phrase. The
instruments of MSFS cannot play audio files directly (HTML audio is not supported) and the WAV support of `sound.xml`
is limited to a few fixed slots, so the phrases are packaged with Wwise, following the SDK documentation
"Setting Up Wwise".

1. Install the MSFS 2024 SDK and the Wwise version it uses (a free licence for Flight Simulator add-ons is available
   from Audiokinetic, see "Wwise Licence Information" in the SDK documentation).
2. Open `\MSFS SDK\Samples\Wwise\WwiseSampleProject` in Wwise and enable WAAPI
   (Project > User Preferences > Enable Wwise Authoring API).
3. Import the voices (sounds, Play events and SoundBank `FBW_A380X_VCREW`, then generation):

   ```sh
   python -m pip install waapi-client
   python tools/virtual-crew-voices/wwise_import.py <folder containing male\ and female\>
   ```

   The events are named `Play_Asobo_A320_NEO_<sound>`, e.g. `Play_Asobo_A320_NEO_vcrew_male_v_1` for
   `WwiseEvent="vcrew_male_v_1"` in `sound.xml`: the simulator prefixes every event with the `MainPackage` of
   `sound.xml` (`Asobo_A320_NEO` for the A380X), also for the events of an additional package. Events created with
   another prefix are renamed with `python tools/virtual-crew-voices/wwise_fix_event_names.py`.
   Without WAAPI, the same structure can be created by hand as described in "Setting Up Wwise".

   Without a licence key, Wwise runs in trial mode and refuses to generate when the **whole project** has more than
   200 media files; the sample project already has about 720, and the virtual crew alone has more than 200 phrases
   (all phrases for both voices), so a licence key is needed. Until the key is granted, work on a copy of the sample
   project and remove the sounds of the sample aircraft with `python tools/virtual-crew-voices/wwise_trim_project.py`
   (it refuses to run on the project inside the SDK folder).
4. Create the package with `FilePackager.App.exe` of Wwise: File > Open `PCK_PC.wfpproj` of the sample project,
   Add a package named `FBW_A380X_VCREW.PC.PCK`, drag the SoundBank `FBW_A380X_VCREW` into the package contents,
   then Generate > Generate All. The package is written to the `GeneratedSoundBanks` folder of the sample project.
5. Copy `FBW_A380X_VCREW.PC.PCK` to
   `fbw-a380x/src/base/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380X/common/sound/` and reference
   it in `sound.xml` of the same folder:
   - `<AdditionalPackage Name="FBW_A380X_VCREW" />` in `<WwisePackages>`
   - the content of `sound-xml-entries.xml` in `<AvionicSounds>`
6. Rebuild the aircraft. The phrases must be packaged again whenever they change.

Until the package exists, the virtual crew runs (actions and logic) but stays silent.
