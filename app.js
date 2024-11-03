// Configure Monaco Editor loader path using CDN
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' } });

// Load and initialize Monaco Editor
require(['vs/editor/editor.main'], function() {
    console.log("Monaco Editor loaded.");
    const editor = monaco.editor.create(document.getElementById('editor'), {
        value: `setTempo(120)\nchord Am minor 1m\nchord Em minor 1m\nchord F major 1m\nchord C major 1m\n`,
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

// Initialize Tone.js and Web Audio components
const melodySynth = new Tone.PolySynth(Tone.Synth).toDestination();
const bassSynth = new Tone.Synth().toDestination();

// Create an OfflineAudioContext for recording
const context = Tone.context;
let recorder;
let recordedChunks = [];
let downloadUrl = '';

// Function to parse, play, and record audio
async function parseAndPlay(input) {
    console.log("Parsing code and playing...");

    // Reset recorded chunks
    recordedChunks = [];

    // Create a MediaStreamDestination to record the audio
    const destination = context.createMediaStreamDestination();
    melodySynth.connect(destination);
    bassSynth.connect(destination);

    // Create a MediaRecorder to capture the stream
    recorder = new MediaRecorder(destination.stream);
    recorder.ondataavailable = event => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    recorder.onstop = exportWav;

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

    // Start recording
    recorder.start();

    // Start the transport and stop it after the audio is complete
    Tone.Transport.start("+0.1"); // Add a slight delay to ensure timing
    Tone.Transport.scheduleOnce(() => {
        Tone.Transport.stop();
        recorder.stop();
    }, `+${currentMeasure * Tone.Time('1m').toSeconds()}`); // Stop after all measures
}

// Function to export recorded audio to a .wav file
function exportWav() {
    const blob = new Blob(recordedChunks, { type: 'audio/wav' });
    downloadUrl = URL.createObjectURL(blob);
    const downloadButton = document.getElementById('download-audio');
    downloadButton.href = downloadUrl;
    downloadButton.download = 'output.wav';
    downloadButton.disabled = false; // Enable the button for user download
    console.log("Audio ready for download.");
}
// Add an event listener for the download button
document.getElementById('download-audio').addEventListener('click', () => {
    if (downloadUrl) {
        // Create an anchor element for download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = 'output.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log("Download started.");
    } else {
        console.error("No audio URL found. Please generate audio first.");
    }
});

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
