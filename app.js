// Configure Monaco Editor loader path using CDN
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' } });

// Load and initialize Monaco Editor
require(['vs/editor/editor.main'], function() {
    console.log("Monaco Editor loaded.");
    const editor = monaco.editor.create(document.getElementById('editor'), {
        value: `setTempo(120)\ntrack1 {\n    C4 1/4, D4 1/8, E4 1/4, rest 1/8\n}`,
        language: 'javascript',
        theme: 'vs-dark'
    });

    // Add event listener to run code when the button is clicked
    document.getElementById('run-code').addEventListener('click', async () => {
        try {
            // Resume AudioContext after a user interaction
            if (Tone.context.state !== 'running') {
                console.log("Resuming AudioContext...");
                await Tone.context.resume();
                console.log("AudioContext resumed.");
            }
            const code = editor.getValue();
            parseAndPlay(code);
        } catch (error) {
            console.error("Error resuming AudioContext:", error);
        }
    });
});

// Function to parse and play code using Tone.js
function parseAndPlay(input) {
    console.log("Parsing code and playing...");
    const melodySynth = new Tone.PolySynth(Tone.Synth).toDestination(); // PolySynth for chords
    const bassSynth = new Tone.Synth().toDestination(); // Bass synth for bassline
    const commands = input.split('\n');
    Tone.Transport.bpm.value = 120; // Default tempo

    // Define the bassline for each chord
    const bassline = {
        'Am': 'A2', // 5th fret E string
        'Em': 'E2', // 7th fret A string
        'F': 'F2',  // 3rd fret D string
        'C': 'C2'   // 3rd fret A string
    };

    let currentMeasure = 0; // Track the current measure

    commands.forEach((command, index) => {
        if (command.startsWith('setTempo')) {
            const tempoMatch = command.match(/\d+/);
            if (tempoMatch) {
                Tone.Transport.bpm.value = parseInt(tempoMatch[0]);
                console.log("Tempo set to:", Tone.Transport.bpm.value);
            }
        } else if (command.startsWith('chord')) {
            const [_, chord, type, duration] = command.split(' ');
            if (chord && type && duration) {
                const chordNotes = generateChordNotes(chord, type);
                const delay = Tone.Time('1m').toSeconds() * currentMeasure; // Play at the start of the measure

                // Schedule the chord notes
                if (chordNotes) {
                    Tone.Transport.schedule(() => {
                        console.log("Playing chord:", chordNotes.join(', '), "for duration:", duration);
                        melodySynth.triggerAttackRelease(chordNotes, duration);
                    }, `+${delay}`);
                }

                // Schedule the bass note at the start of the measure if it matches the chord
                if (bassline[chord]) {
                    Tone.Transport.schedule(() => {
                        console.log("Playing bass note:", bassline[chord], "at the start of the measure");
                        bassSynth.triggerAttackRelease(bassline[chord], '1n'); // '1n' = whole note
                    }, `+${delay}`);
                }

                currentMeasure += 1; // Increment to the next measure
            }
        } else if (command.startsWith('rest')) {
            console.log("Rest for duration:", command.split(' ')[1]);
        }
    });

    // Start the transport
    Tone.Transport.start("+0.1"); // Add a slight delay to ensure timing
}

// Helper function to generate notes for common chords
function generateChordNotes(root, type) {
    const semitoneMap = {
        major: [0, 4, 7], // Root, major third, perfect fifth
        minor: [0, 3, 7], // Root, minor third, perfect fifth
        diminished: [0, 3, 6], // Root, minor third, diminished fifth
        augmented: [0, 4, 8] // Root, major third, augmented fifth
    };

    const semitones = semitoneMap[type];
    if (!semitones) {
        console.error("Unsupported chord type:", type);
        return null;
    }

    const rootMatch = root.match(/([A-G]#?)(\d)/);
    if (!rootMatch) {
        console.error("Invalid root note format:", root);
        return null;
    }

    const rootPitch = rootMatch[1];
    const rootOctave = parseInt(rootMatch[2]);
    const notes = semitones.map(semitone => transposeNoteBySemitones(rootPitch, rootOctave, semitone));
    return notes;
}

// Helper function to transpose a note by semitones
function transposeNoteBySemitones(pitch, octave, semitones) {
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let currentIndex = noteOrder.indexOf(pitch);
    if (currentIndex === -1) return null;

    let newIndex = currentIndex + semitones;
    let newOctave = octave;

    if (newIndex >= noteOrder.length) {
        newIndex -= noteOrder.length;
        newOctave += 1;
    } else if (newIndex < 0) {
        newIndex += noteOrder.length;
        newOctave -= 1;
    }

    return `${noteOrder[newIndex]}${newOctave}`;
}







