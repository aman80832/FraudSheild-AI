import VoicePhishing from "../components/VoicePhishing";

function VoiceAnalyzer() {
  return (
    <div className="voice-analyzer-page">
      <div className="voice-analyzer-header">
        <span>🛡️ FRAUDSHIELD AI</span>

        <h1>Voice Phishing Protection</h1>

        <p>
          Analyze suspicious conversations and detect
          social-engineering and voice-phishing signals
          before you share sensitive information.
        </p>
      </div>

      <VoicePhishing />
    </div>
  );
}

export default VoiceAnalyzer;