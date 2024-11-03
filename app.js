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
    const synth = new Tone.Synth().toDestination(); // Single synth for testing
    const commands = input.split('\n');
    Tone.Transport.bpm.value = 120; // Default tempo

    commands.forEach((command, index) => {
        if (command.startsWith('setTempo')) {
            const tempoMatch = command.match(/\d+/);
            if (tempoMatch) {
                Tone.Transport.bpm.value = parseInt(tempoMatch[0]);
                console.log("Tempo set to:", Tone.Transport.bpm.value);
            }
        } else if (command.startsWith('play')) {
            const [_, note, duration] = command.split(' ');
            if (note && duration) {
                const delay = Tone.Time(duration).toSeconds() * index;
                Tone.Transport.schedule(() => {
                    console.log("Playing note:", note, "for duration:", duration);
                    synth.triggerAttackRelease(note, duration);
                }, `+${delay}`);
            }
        } else if (command.startsWith('rest')) {
            // Placeholder for rest duration; no sound is played.
            console.log("Rest for duration:", command.split(' ')[1]);
        }
    });

    // Start the transport
    Tone.Transport.start("+0.1"); // Add a slight delay to ensure timing
}


