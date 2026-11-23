# Custom Import/Export File Extensions Design (`.biw` & `.biwtheme`)

## Overview

Brick Instruction Works uses dedicated custom file extensions for all portable studio project and custom theme import/export files:

| Artifact | Extension | Format Header (`format`) | Schema Version |
| --- | --- | --- | --- |
| Studio Project Export/Import | `.biw` | `brick-instruction-works-project` | Studio `4` / Store `1` |
| Single Custom Theme Export/Import | `.biwtheme` | `brick-instruction-works-theme` | `1` |
| Custom Theme Pack Export/Import | `.biwtheme` | `brick-instruction-works-themes` | `1` |

## Validation

- Project imports validate the `.biw` filename extension and require a valid `brick-instruction-works-project` payload header and schema version in [`src/storage/fileFormats.ts`](../src/storage/fileFormats.ts) and [`src/storage/projectStorage.ts`](../src/storage/projectStorage.ts).
- Theme imports validate the `.biwtheme` filename extension and require a valid `brick-instruction-works-theme` or `brick-instruction-works-themes` payload header in [`src/themes/customThemes.ts`](../src/themes/customThemes.ts).

## Browser & iOS Compatibility

- **Download / Share MIME Type**: Exported `.biw` and `.biwtheme` files are packaged with `application/octet-stream` (`CUSTOM_FILE_MIME_TYPE`) so desktop and mobile Safari preserve `.biw` and `.biwtheme` filenames instead of appending `.json`.
- **File Picker `accept` Filtering**:
  - Desktop browsers filter file pickers via `accept=".biw"` (`#projectLoadInput`) and `accept=".biwtheme"` (`#themeImportInput`).
  - Because iOS/iPadOS Files greys out unregistered custom extensions when `accept` is present, the studio runtime removes `accept` on Apple touch devices while JavaScript validation checks `.biw` and `.biwtheme` on all platforms.
- **Drag-and-Drop**: Dropping a `.biw` file onto the welcome Proofing Table or Open Model dialog routes directly to the `.biw` project importer alongside `.io`, `.ldr`, and `.mpd` models.
