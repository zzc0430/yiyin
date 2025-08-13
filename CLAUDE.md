# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

壹印 (YiYin) is an Electron + Svelte application for adding watermarks and frames to photos. It's a cross-platform desktop application that processes images with EXIF data extraction and custom text overlays.

## Architecture

### Tech Stack
- **Frontend**: Svelte 4 with TypeScript, SCSS for styling
- **Desktop Framework**: Electron 24 with Vite
- **Image Processing**: Sharp, ExifTool, FFmpeg
- **Build System**: Vite with electron-builder

### Project Structure
- `/web/` - Svelte frontend application
  - `/main/` - Main app entry with components for UI
  - `/components/` - Reusable Svelte components
  - `/store/` - State management stores
  - `/modules/` - Frontend business logic modules
- `/electron/` - Electron main and preload processes
  - `/main/` - Main process entry
  - `/preload/` - Preload scripts for IPC
  - `/src/` - Core electron business logic
    - `/modules/` - Image processing, ExifTool integration
    - `/router/` - IPC routing handlers
- `/common/` - Shared code between frontend and electron
  - `/const/` - Constants and field definitions
  - `/utils/` - Utility functions
  - `/modules/` - Shared business modules

### Path Aliases
The project uses TypeScript path aliases extensively:
- `@web/*` → `web/*`
- `@common/*` → `common/*`
- `@components/*` → `web/components/*`
- `@modules/*` → `electron/src/modules/*`
- `@utils/*` → `electron/src/utils/*`
- `@src/*` → `electron/src/*`

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (Electron + Vite)
npm start

# Build the application
npm run build

# Type checking
npm run tsc

# Package application for distribution
npm run make          # Build without publishing
npm run package       # Build with electron-builder
npm run package:dir   # Build unpacked directory

# Release management
npm run push:release  # Push release version
npm run push:dev     # Push development version
```

## Key Implementation Details

### Image Processing Pipeline
1. Images are processed through ExifTool for metadata extraction
2. Sharp library handles image manipulation (resize, composite, text overlay)
3. Custom watermark templates are defined in `/common/const/def-temps.ts`
4. Font files are stored in `/web/assets/font/`

### IPC Communication
- Router pattern used for IPC between main and renderer
- Routes defined in `/electron/src/router/`
- Type-safe IPC using TypeScript interfaces in `/electron/src/interface.ts`

### State Management
- Svelte stores in `/web/store/` manage application state
- Configuration persisted via Electron's storage APIs
- User preferences stored in app data directory

### Build Configuration
- Vite config handles both web and electron builds
- Electron-builder configuration in `package.json` for multi-platform builds
- Custom script `/scripts/install-exiftool.ts` bundles ExifTool with the app

## Testing & Quality

### Linting
ESLint is configured with TypeScript and Svelte support. The configuration extends airbnb-base with custom rules for the project's needs.

### Type Checking
Run `npm run tsc` to check TypeScript types across the entire codebase.

## Platform-Specific Notes

### macOS
- `.icns` icon in `/icon/icon.icns`
- DMG packaging configured with custom layout

### Windows
- `.ico` icon in `/icon/icon.ico`
- NSIS installer with customizable installation directory

### Linux
- Builds for both `.deb` and `.rpm` packages

## External Dependencies

### ExifTool
- Bundled during build via `/scripts/install-exiftool.ts`
- Platform-specific binaries in `/static/` directory
- Extracted to dist-electron during build

### FFmpeg
- Used via fluent-ffmpeg for video processing capabilities
- Installed via @ffmpeg-installer/ffmpeg package

## Important Conventions

1. **Import Order**: Imports must be alphabetically ordered with newlines between groups (enforced by ESLint)
2. **No Implicit Any**: TypeScript strict mode is enabled, explicit types required
3. **Path Resolution**: Always use path aliases for imports, avoid relative paths where possible
4. **Async/Await**: Preferred over promises for cleaner async code
5. **Error Handling**: Use try-catch blocks with proper logging via the logger module