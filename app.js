let gumStream;                  // Stream from getUserMedia()
let recorder;                   // WebAudioRecorder object
let input;                      // MediaStreamAudioSourceNode we'll be recording
let encodingType;               // Holds selected encoding for resulting audio (file)
const encodeAfterRecord = true; // When to encode

// A more comprehensive approach for creating the AudioContext
function getAudioContext() {
    return new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext)();
}

let audioContext = getAudioContext();

const encodingTypeSelect = document.getElementById("encodingTypeSelect");
const recordButton = document.getElementById("recordButton");
const stopButton = document.getElementById("stopButton");

// Use addEventListener for consistent event handling across browsers
recordButton.addEventListener("click", startRecording, false);
stopButton.addEventListener("click", stopRecording, false);

function startRecording() {
    console.log("startRecording() called");

    const constraints = { audio: true, video: false };

    // Use the polyfilled navigator.mediaDevices.getUserMedia
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        console.log("getUserMedia() success, stream created, initializing WebAudioRecorder...");

        audioContext = getAudioContext();
        gumStream = stream;

        input = audioContext.createMediaStreamSource(stream);

        recorder = new WebAudioRecorder(input, {
            workerDir: "./", // Path to WebAudioRecorder.js
            encoding: encodingTypeSelect.value,
            onEncoderLoading: function(recorder, encoding) {
                console.log("Loading " + encoding + " encoder...");
            },
            onEncoderLoaded: function(recorder, encoding) {
                console.log(encoding + " encoder loaded");
            }
        });

        recorder.onComplete = function(recorder, blob) {
            console.log("Encoding complete");
            createDownloadLink(blob, recorder.encoding);
        };

        recorder.setOptions({
            timeLimit: 120,
            encodeAfterRecord,
            ogg: { quality: 0.5 },
            mp3: { bitRate: 160 }
        });

        recorder.startRecording();
        console.log("Recording started");

    }).catch(function(err) {
        let message = "Unknown error";
        if (err.code) {
            switch (err.code) {
                case 1:
                    message = "You denied access to the microphone.";
                    break;
                case 5:
                    message = "The microphone is not available.";
                    break;
                default:
                    message = "Error accessing microphone: " + err.code;
            }
        } else {
            message = err.message || "An unknown error occurred.";
        }
        console.error(message);
        recordButton.disabled = false;
        stopButton.disabled = true;
    });

    recordButton.disabled = true;
    stopButton.disabled = false;
}

function stopRecording() {
    console.log("stopRecording() called");

    if (gumStream && gumStream.getAudioTracks) {
        gumStream.getAudioTracks()[0].stop();
    }

    stopButton.disabled = true;
    recordButton.disabled = false;

    if (recorder && recorder.finishRecording) {
        recorder.finishRecording();
    }

    console.log('Recording stopped');
}

function createDownloadLink(blob, encoding) {
    const url = URL.createObjectURL(blob); // Directly use URL.createObjectURL without webkitURL
    const au = document.createElement('audio');
    const li = document.createElement('li');
    const link = document.createElement('a');

    au.controls = true;
    au.src = url;

    link.href = url;
    link.download = new Date().toISOString() + '.' + encoding;
    link.textContent = link.download;

    li.appendChild(au);
    li.appendChild(link);

    const recordingsList = document.getElementById("recordingsList");
    if (recordingsList) {
        recordingsList.appendChild(li);
    }
}

// Helper function to log messages to the console
function __log(e, data) {
    console.log(e + " " + (data || ''));
}
