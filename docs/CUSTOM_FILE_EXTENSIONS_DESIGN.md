# Custom Import/Export File Extensions Design (`.biw` & `.biwtheme`)

## Overview

Brick Instruction Works uses dedicated custom file extensions for all portable studio project and custom theme import/export files instead of generic `.json` suffixes:

| Artifact | Extension | Format Header (`format`) | Schema Version |
| --- | --- | --- | --- |
| Studio Project Export/Import | `.biw` | `brick-instruction-works-project` | Studio `4` / Store `1` |
| Single Custom Theme Export/Import | `.biwtheme` | `brick-instruction-works-theme` | `1` |
| Custom Theme Pack Export/Import | `.biwtheme` | `brick-instruction-works-themes` | `1` |

## Strict Non-Backward-Compatible Policy

- Legacy `.bic.json`, `.bictheme.json`, `.bic`, and generic `.json` files are **intentionally rejected** on import.
- Both the filename extension (`.biw` or `.biwtheme`) and the top-level payload header (`format` + `version`) are strictly validated in [`src/storage/fileFormats.ts`](../src/storage/fileFormats.ts), [`src/storage/projectStorage.ts`](../src/storage/projectStorage.ts), and [`src/themes/customThemes.ts`](../src/themes/customThemes.ts).
- Renaming a legacy file to `.biw` or `.biwtheme` is also rejected because legacy payloads lack the `brick-instruction-works-*` format headers and schema version.

## Browser & iOS Compatibility

- **Download / Share MIME Type**: Exported `.biw` and `.biwtheme` files are packaged with `application/octet-stream` (`CUSTOM_FILE_MIME_TYPE`) rather than `application/json`. This prevents desktop and mobile Safari from silently appending `.json` to downloaded or shared filenames.
- **File Picker `accept` Filtering**:
  - Desktop browsers filter file pickers cleanly via `accept=".biw"` (`#projectLoadInput`) and `accept=".biwtheme"` (`#themeImportInput`).
  - Because iOS/iPadOS Files greys out unregistered custom extensions when `accept` is present, the studio runtime removes `accept` on Apple touch devices while JavaScript validation strictly enforces `.biw` and `.biwtheme` on all platforms.
- **Drag-and-Drop**: Dropping a `.biw` file onto the empty welcome proofing sheet routes directly to the `.biw` project importer alongside `.io`, `.ldr`, and `.mpd` models.
