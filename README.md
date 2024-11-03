# Music Composition Web App

Welcome to the Music Composition Web App! This project enables users to create, play, and download custom chord progressions and musical compositions using an easy-to-understand code editor. This tool is designed for musicians, developers, and music enthusiasts interested in creating music programmatically.

## Features

- **Interactive Code Editor**: Write musical commands using a built-in code editor powered by Monaco Editor.
- **Chord Playback**: Play and hear custom chord progressions in real-time.
- **Downloadable Audio**: Save your compositions as `.wav` files for future use or sharing.
- **Real-time Audio Rendering**: Audio playback is powered by Tone.js.

## Getting Started

### 1. Writing Your Music Code
- Use the code editor to write your musical instructions. Example code:

    ```plaintext
    setTempo(120)
    chord Am minor 1m
    chord Em minor 1m
    chord F major 1m
    chord C major 1m
    ```

- **Commands**:
  - `setTempo(tempo)`: Sets the tempo (speed) of the music in beats per minute (BPM). Example: `setTempo(120)`
  - `chord [root][type] [duration]`: Plays a chord with the specified root note, chord type, and duration. Example: `chord C major 1m`
  - **Supported Chord Types**: `major`, `minor`, `diminished`, `augmented`
  - **Duration**: Specifies how long the chord is played. Common values include:
    - `1m`: One measure
    - `2n`: Half note
    - `4n`: Quarter note

### 2. Playing Your Composition
- Click the **"Run Code"** button to hear your music composition. The app will parse and play the musical commands through your browser's audio output.

### 3. Downloading Your Composition
- After the playback is complete, the **"Download Audio"** button will be enabled. Click this button to download your composition as a `.wav` file.

## Example Code Snippets

### Basic Chord Progression
```plaintext
setTempo(120)
chord Am minor 1m
chord Em minor 1m
chord F major 1m
chord C major 1m

