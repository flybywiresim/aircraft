# Display Unit Switching

Assuming DMC 1 & 2 operational... the following are the possible combinations:

| Config | Capt PFD | Capt ND | Upper ECAM | Lower ECAM | F/O ND | F/O PFD | Normal/Alternate Capt | Normal/Alternate F/O | Normal/Alternate ECAM | ECAM/ND switch |
|--------|----------|---------|------------|------------|--------|---------|-----------------------|----------------------|-----------------------|----------------|
| 0      | PFD      | ND      | EWD        | SD         | ND     | PFD     | Normal                | Normal               | Normal                | NORM           |
| 1      | ND       | PFD     | EWD        | SD         | ND     | PFD     | Alternate             | Normal               | Normal                | NORM           |
| 2      | PFD      | ND      | EWD        | SD         | PFD    | ND      | Normal                | Alternate            | Normal                | NORM           |
| 3      | PFD      | ND      | EWD        | Nil        | SD     | PFD     | Normal                | Normal               | Normal                | F/O            |
| 4      | PFD      | EWD     | Nil        | EWD        | ND     | PFD     | Normal                | Normal               | Normal                | CAPT           |
| 5      | PFD      | ND      | EWD        | Nil        | PFD    | SD      | Normal                | Alternate            | Normal                | F/O            |
| 6      | EWD      | PFD     | Nil        | SD         | ND     | PFD     | Alternate             | Normal               | Normal                | CAPT           |
| 7      | ND       | PFD     | EWD        | SD         | PFD    | ND      | Alternate             | Alternate            | Normal                | NORM           |
| 8      | EWD      | PFD     | Nil        | SD         | PFD    | ND      | Alternate             | Alternate            | Normal                | CAPT           |
| 9      | ND       | PFD     | EWD        | Nil        | PFD    | SD      | Alternate             | Alternate            | Normal                | F/O            |
| 10     | PFD      | EWD     | Nil        | SD         | PFD    | ND      | Normal                | Alternate            | Normal                | CAPT           |
| 11     | ND       | PFD     | EWD        | Nil        | SD     | PFD     | Alternate             | Normal               | Normal                | F/O            |

The config is stored in the simvar `L:A32NX_EFIS_DISPLAY_CONFIG`.
