import { useEffect, useRef, useState } from "react";
import axios from "axios";

function VoicePhishing() {
  // =====================================================
  // BASIC STATE
  // =====================================================

  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // AUDIO RECORDING STATE
  // =====================================================

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // =====================================================
  // SPEECH RECOGNITION STATE
  // =====================================================

  const [isTranscribing, setIsTranscribing] =
    useState(false);

  // =====================================================
  // REFERENCES
  // =====================================================

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // =====================================================
  // RECORDING TIMER
  // =====================================================

  useEffect(() => {
    let timer = null;

    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(
          (previousTime) =>
            previousTime + 1
        );
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRecording]);

  // =====================================================
  // FORMAT TIMER
  // =====================================================

  function formatRecordingTime(seconds) {
    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  // =====================================================
  // START SPEECH RECOGNITION
  // =====================================================

  function startSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );

      return false;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;

    // Indian English
    recognition.lang = "en-IN";

    let finalTranscript = "";

    recognition.onstart = () => {
      console.log(
        "Speech recognition started."
      );

      setIsTranscribing(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const text =
          event.results[i][0]
            .transcript;

        if (
          event.results[i].isFinal
        ) {
          finalTranscript +=
            text + " ";
        } else {
          interimTranscript += text;
        }
      }

      setTranscript(
        (
          finalTranscript +
          interimTranscript
        ).trim()
      );
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      if (
        event.error ===
        "not-allowed"
      ) {
        setError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else if (
        event.error ===
        "no-speech"
      ) {
        setError(
          "No speech detected. Please speak clearly and try again."
        );
      } else {
        setError(
          `Speech recognition error: ${event.error}`
        );
      }

      setIsTranscribing(false);
    };

    recognition.onend = () => {
      console.log(
        "Speech recognition stopped."
      );

      setIsTranscribing(false);
    };

    try {
      recognition.start();

      recognitionRef.current =
        recognition;

      return true;
    } catch (error) {
      console.error(
        "Unable to start speech recognition:",
        error
      );

      setError(
        "Unable to start speech recognition."
      );

      return false;
    }
  }

  // =====================================================
  // STOP SPEECH RECOGNITION
  // =====================================================

  function stopSpeechRecognition() {
    if (
      recognitionRef.current
    ) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error(
          "Speech stop error:",
          error
        );
      }

      recognitionRef.current = null;
    }

    setIsTranscribing(false);
  }

  // =====================================================
  // START AUDIO RECORDING
  // =====================================================

  async function startRecording() {
    try {
      setError("");
      setResult(null);
      setTranscript("");
      setRecordingTime(0);

      // -------------------------------------------------
      // CHECK MICROPHONE SUPPORT
      // -------------------------------------------------

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        setError(
          "Microphone recording is not supported by this browser."
        );

        return;
      }

      // -------------------------------------------------
      // REQUEST MICROPHONE
      // -------------------------------------------------

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      // -------------------------------------------------
      // CREATE RECORDER
      // -------------------------------------------------

      const recorder =
        new MediaRecorder(stream);

      audioChunksRef.current =
        [];

      recorder.ondataavailable = (
        event
      ) => {
        if (
          event.data.size > 0
        ) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = () => {
        // Stop microphone
        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        const audioBlob =
          new Blob(
            audioChunksRef.current,
            {
              type: "audio/webm",
            }
          );

        console.log(
          "Audio recording completed."
        );

        console.log(
          "Audio size:",
          audioBlob.size,
          "bytes"
        );

        // Current backend uses transcript.
        // Audio processing will be connected
        // to backend in a later step.
      };

      recorder.onerror = (
        event
      ) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        setError(
          "An error occurred while recording."
        );

        setIsRecording(false);
      };

      // -------------------------------------------------
      // START RECORDER
      // -------------------------------------------------

      recorder.start();

      mediaRecorderRef.current =
        recorder;

      // -------------------------------------------------
      // START SPEECH RECOGNITION
      // -------------------------------------------------

      const speechStarted =
        startSpeechRecognition();

      if (!speechStarted) {
        // Stop audio recorder if speech
        // recognition could not start.

        recorder.stop();

        mediaRecorderRef.current =
          null;

        return;
      }

      setIsRecording(true);

    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      if (
        error.name ===
        "NotAllowedError"
      ) {
        setError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else if (
        error.name ===
        "NotFoundError"
      ) {
        setError(
          "No microphone was found on this device."
        );
      } else {
        setError(
          "Unable to access the microphone."
        );
      }
    }
  }

  // =====================================================
  // STOP AUDIO RECORDING
  // =====================================================

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (recorder) {
      if (
        recorder.state ===
        "recording"
      ) {
        recorder.stop();
      }

      mediaRecorderRef.current =
        null;
    }

    stopSpeechRecognition();

    setIsRecording(false);
  }

  // =====================================================
  // ANALYZE CALL
  // =====================================================

  async function analyzeCall() {
    if (!transcript.trim()) {
      setError(
        "Please record a call or enter a transcript first."
      );

      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      setError(
        "Your session has expired. Please login again."
      );

      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/voice/analyze`,
          {
            transcript:
              transcript.trim(),
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );

      console.log(
        "Voice analysis response:",
        response.data
      );

      if (
        response.data?.analysis
      ) {
        setResult(
          response.data.analysis
        );
      } else {
        setError(
          "The server returned an invalid analysis response."
        );
      }

    } catch (error) {
      console.error(
        "Voice analysis error:",
        error
      );

      if (
        error.response?.status ===
        401
      ) {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "user"
        );

        setError(
          "Your session has expired. Please login again."
        );

        return;
      }

      if (
        error.code ===
          "ERR_NETWORK" ||
        error.message ===
          "Network Error"
      ) {
        setError(
          "Cannot connect to FraudShield server. Make sure FastAPI is running on port 8000."
        );

        return;
      }

      setError(
        error.response?.data
          ?.detail ||
        "Unable to analyze the call."
      );

    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // CLEAR EVERYTHING
  // =====================================================

  function clearAnalysis() {
    if (isRecording) {
      stopRecording();
    }

    stopSpeechRecognition();

    setTranscript("");
    setResult(null);
    setError("");
    setRecordingTime(0);

    audioChunksRef.current =
      [];
  }

  // =====================================================
  // COMPONENT CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current
      ) {
        try {
          if (
            mediaRecorderRef.current
              .state ===
            "recording"
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error(error);
        }
      }
    };
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <section className="voice-phishing-section">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="section-title">

        <div>

          <h3>
            🎙️ Voice Phishing Detector
          </h3>

          <p>
            Analyze suspicious phone
            conversations for phishing and
            social-engineering signals.
          </p>

        </div>

      </div>


      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div className="voice-card">

        {/* =================================================
            RECORDER
        ================================================= */}

        <div className="voice-recorder">

          <div className="recorder-header">

            <h4>
              🎤 Voice Recorder
            </h4>

            <span
              className={
                isRecording
                  ? "recording-active"
                  : "recording-idle"
              }
            >
              {isRecording
                ? "● Recording"
                : "Ready"}
            </span>

          </div>


          {/* RECORD BUTTON */}

          <div className="recorder-controls">

            {!isRecording ? (

              <button
                type="button"
                className="record-button"
                onClick={
                  startRecording
                }
                disabled={loading}
              >
                🎤 Start Recording
              </button>

            ) : (

              <button
                type="button"
                className="stop-recording-button"
                onClick={
                  stopRecording
                }
              >
                ⏹ Stop Recording
              </button>

            )}


            {/* TIMER */}

            {isRecording && (

              <div className="recording-timer">
                🔴{" "}
                {formatRecordingTime(
                  recordingTime
                )}
              </div>

            )}

          </div>


          {/* SPEECH STATUS */}

          {isTranscribing && (

            <div className="transcription-status">
              🎙️ Listening and converting
              speech to text...
            </div>

          )}

          {!isRecording &&
            transcript.trim() && (
              <div className="transcription-success">
                ✅ Speech transcription
                completed.
              </div>
            )}


          <p className="recorder-note">
            Speak clearly while recording.
            Your speech will automatically
            appear in the transcript below.
          </p>

        </div>


        {/* =================================================
            DIVIDER
        ================================================= */}

        <div className="voice-divider">

          <span>
            OR ENTER TRANSCRIPT MANUALLY
          </span>

        </div>


        {/* =================================================
            TRANSCRIPT
        ================================================= */}

        <label>
          Call Transcript
        </label>

        <textarea
          value={transcript}
          onChange={(event) =>
            setTranscript(
              event.target.value
            )
          }
          placeholder={
            "Example: I am calling from your bank. " +
            "Your account will be blocked today. " +
            "Please provide your OTP immediately."
          }
          rows={7}
          disabled={loading}
        />


        {/* CHARACTER COUNT */}

        <div className="transcript-count">
          {transcript.length} characters
        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="voice-error">
            ⚠️ {error}
          </div>

        )}


        {/* =================================================
            ACTION BUTTONS
        ================================================= */}

        <div className="voice-actions">

          <button
            type="button"
            className="analyze-button"
            onClick={
              analyzeCall
            }
            disabled={
              loading ||
              isRecording ||
              !transcript.trim()
            }
          >
            {loading
              ? "🤖 Analyzing..."
              : "🔍 Analyze Call"}
          </button>


          <button
            type="button"
            className="reset-button"
            onClick={
              clearAnalysis
            }
            disabled={loading}
          >
            Clear
          </button>

        </div>

      </div>


      {/* =================================================
          RESULT
      ================================================= */}

      {result && (

        <div className="voice-result">

          {/* HEADER */}

          <div className="voice-result-header">

            <div>

              <h4>
                🤖 FraudShield AI Analysis
              </h4>

              <p>
                Explainable voice-phishing
                assessment
              </p>

            </div>

          </div>


          {/* =================================================
              RISK SCORE
          ================================================= */}

          <div className="voice-score">

            <span>
              Risk Score
            </span>

            <strong>
              {result.risk_score}

              <small>
                /100
              </small>

            </strong>

          </div>


          {/* =================================================
              RISK / DECISION / CONFIDENCE
          ================================================= */}

          <div className="voice-result-grid">

            <div className="voice-result-item">

              <span>
                Risk Level
              </span>

              <strong
                className={
                  result.risk_level ===
                  "HIGH"
                    ? "risk-high"
                    : result.risk_level ===
                      "MEDIUM"
                    ? "risk-medium"
                    : "risk-low"
                }
              >
                {result.risk_level}
              </strong>

            </div>


            <div className="voice-result-item">

              <span>
                Decision
              </span>

              <strong>
                {result.decision}
              </strong>

            </div>


            <div className="voice-result-item">

              <span>
                Confidence
              </span>

              <strong>
                {result.confidence}%
              </strong>

            </div>

          </div>


          {/* =================================================
              MESSAGE
          ================================================= */}

          <div className="voice-message">

            <strong>
              Assessment
            </strong>

            <p>
              {result.message}
            </p>

          </div>


          {/* =================================================
              REASONS
          ================================================= */}

          {result.reasons?.length >
            0 && (

            <div className="voice-reasons">

              <h4>
                🔎 Detected Warning Signs
              </h4>

              <ul>

                {result.reasons.map(
                  (reason, index) => (

                    <li key={index}>
                      ⚠️ {reason}
                    </li>

                  )
                )}

              </ul>

            </div>

          )}


          {/* =================================================
              DETECTED SIGNALS
          ================================================= */}

          {result.detected_signals
            ?.length > 0 && (

            <div className="voice-signals">

              <h4>
                Detected Signals
              </h4>

              <div className="signal-list">

                {result.detected_signals.map(
                  (signal, index) => (

                    <span
                      key={index}
                      className="signal-tag"
                    >
                      {signal.replace(
                        /_/g,
                        " "
                      )}
                    </span>

                  )
                )}

              </div>

            </div>

          )}

        </div>

      )}

    </section>
  );
}

export default VoicePhishing;