# Minecraft GUI Builder (Electron)

    npm install
    npm start                      # start the app
    npm start -- "F:\miamod"       # start and link a mod immediately
    npm test                       # 26 tests (JSON, Java, mod scan, parser, ...)
    npm run test:app               # smoke test: opens the real app and tests functions (Linux: xvfb-run -a npm run test:app)
    npm run dist:win               # Windows installer (nsis + portable)
    npm run dist:mac               # .dmg macOS (only on a Mac)

Ready scripts:
    build-windows.bat    Windows installer (runs tests first)
    build-mac.command    .dmg macOS: double click on a Mac
    build-all.bat        Windows local + macOS via GitHub Actions (.github/workflows/build.yml)
    run-tests.bat        automated tests + app tests

The .dmg cannot be created from Windows: you need a Mac or GitHub Actions.
Unsigned app: on macOS on first launch right click > Open, or xattr -cr "/Applications/Minecraft GUI Builder.app".

Interface: menu bar, tabs (Components / Assets / Mod, Element / Project / Colors), layers, status bar, light/dark theme (Settings -> Interface).
Colors: Colors tab = harmonic suggestions (complementary, analogous, triad, tints, shades), Minecraft palette, contrast control, theme generation from a color.

Launch: start screen to choose GUI type (main menu, pause, inventory, empty screen, containers). Multiple screens per project, linkable with open_gui action (Esc/close_gui go back).

Professional editor features: command palette (Ctrl+K), align/distribute, group (Ctrl+G), layer order, Panel auto layout, context menu, pan/zoom (Space+drag, Ctrl+scroll), reference image, Problems panel (lint), vanilla GUI templates.

Verified: test build, Electron app launch, use of all main windows/functions without JS errors.
NOT verified: compilazione del Java generato dentro Minecraft (Forge 1.20.1 / NeoForge 1.21.1), Ollama, `npm run dist`.
Gradle versions in templates should be checked with the official MDK'MDK ufficiale.
