# Sound Lab for Android

The same page, wrapped in a WebView. There is no second codebase: `app/src/main/assets/index.html`
is a copy of the `index.html` in the project root, and the copy is made at build time, so the web
version and the app version can never drift apart.

## Build

Needs the Android SDK (platform 37, build-tools 36) and JDK 17.

```bash
cp index.html android/app/src/main/assets/index.html
cd android
gradle assembleDebug
```

The APK lands in `app/build/outputs/apk/debug/app-debug.apk` (about 1.9 MB).

## Install on a device or emulator

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.soundlab/.MainActivity
```

## What the wrapper adds

A WebView alone is not quite enough for this page, so `MainActivity` adds two things:

- `setMediaPlaybackRequiresUserGesture(false)`, so a question can play its sound as it appears.
- An `AndroidTTS` bridge to the device's own text-to-speech. A bare WebView often has no speech
  synthesis of its own, which would leave the example words silent. The page checks for the bridge
  and uses it when present, falling back to `speechSynthesis` in a normal browser.

`setDomStorageEnabled(true)` keeps your scores between sessions, as `localStorage` does on the web.

## Release build

The debug APK is signed with the debug key and is fine for your own device and the emulator. For a
signed release build, add a `signingConfig` to `app/build.gradle` and run `gradle assembleRelease`.
