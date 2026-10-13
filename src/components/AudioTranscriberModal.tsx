import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Volume2,
  Copy,
  Check,
  X,
  RefreshCw,
  FileText,
  Wheat,
  Truck,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Play,
  Languages,
  Edit3,
  Send,
  Keyboard
} from 'lucide-react';
import {
  transcribeAudioBlob,
  parseTextWithGemini,
  TranscriptionResult
} from '../services/transcriptionService';

interface AudioTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFields?: (fields: NonNullable<TranscriptionResult['parsedFields']>) => void;
  language: 'en' | 'hi' | 'pa' | 'ta';
}

export const AudioTranscriberModal: React.FC<AudioTranscriberModalProps> = ({
  isOpen,
  onClose,
  onApplyFields,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'mic' | 'text'>('mic');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>(
    language === 'ta' ? 'Tamil' : language === 'pa' ? 'Punjabi' : language === 'hi' ? 'Hindi' : 'English'
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const handleReset = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    setIsTranscribing(false);
    setRecordingSeconds(0);
    setLiveTranscript('');
    setRecordedBlob(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setTranscriptionResult(null);
    setErrorMsg(null);
  }, []);

  // Clean up timers and audio streams on unmount or close
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Language code helper for Web Speech API
  const getLangCode = (lang: string) => {
    switch (lang) {
      case 'Hindi':
        return 'hi-IN';
      case 'Tamil':
        return 'ta-IN';
      case 'Punjabi':
        return 'pa-IN';
      default:
        return 'en-IN';
    }
  };

  const handleStartRecording = async () => {
    setErrorMsg(null);
    setTranscriptionResult(null);
    setLiveTranscript('');
    setRecordedBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    // Initialize Web Speech API for real-time live browser transcription if available
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let webSpeechActive = false;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getLangCode(selectedLang);

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          const cleaned = currentTranscript.trim();
          if (cleaned) {
            setLiveTranscript(cleaned);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Web Speech API event notice:', e.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
        webSpeechActive = true;
      } catch (e) {
        console.warn('Could not start Web Speech recognition:', e);
      }
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Stop speech recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
        }

        // Send recorded audio to Gemini transcription backend
        await handleTranscribeBlob(fullBlob, liveTranscript);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.warn('Mic access error:', err);
      const isPermissionDenied =
        err instanceof Error &&
        (err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError' ||
          err.message.toLowerCase().includes('permission') ||
          err.message.toLowerCase().includes('not allowed'));

      setErrorMsg(
        isPermissionDenied
          ? 'Microphone permission was not granted by your browser. You can still test voice autofill using the preset buttons below, or use the "Type Statement" tab!'
          : (err instanceof Error ? err.message : 'Could not access microphone.')
      );
    }
  };

  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribeBlob = async (blob: Blob, liveTextHint?: string) => {
    setIsTranscribing(true);
    setErrorMsg(null);

    try {
      const result = await transcribeAudioBlob(blob, selectedLang);

      // If backend transcription succeeded, use it; otherwise fallback to live captured speech text
      if (result.transcript && result.transcript.trim()) {
        setTranscriptionResult(result);
      } else if (liveTextHint && liveTextHint.trim()) {
        // Parse the live speech text with Gemini
        const textResult = await parseTextWithGemini(liveTextHint);
        setTranscriptionResult({
          transcript: liveTextHint,
          parsedFields: textResult.parsedFields,
        });
      } else {
        // If audio was completely silent or empty
        setErrorMsg('No distinct speech was detected in the audio. Please speak clearly into the microphone or try one of the quick demo prompts below.');
      }
      setIsTranscribing(false);
    } catch (err: any) {
      console.warn('Backend audio transcription error, checking live transcript:', err);
      if (liveTextHint && liveTextHint.trim()) {
        const textResult = await parseTextWithGemini(liveTextHint);
        setTranscriptionResult({
          transcript: liveTextHint,
          parsedFields: textResult.parsedFields,
        });
        setIsTranscribing(false);
      } else {
        setErrorMsg(
          err?.message ||
            'Audio transcription encountered an issue. Please try speaking again or use the preset demo prompt below.'
        );
        setIsTranscribing(false);
      }
    }
  };

  // Direct text statement parsing with Gemini
  const handleParseManualText = async () => {
    if (!manualText.trim()) return;
    setIsTranscribing(true);
    setErrorMsg(null);

    try {
      const result = await parseTextWithGemini(manualText);
      setTranscriptionResult(result);
      setIsTranscribing(false);
    } catch (err: any) {
      console.error('Failed to parse text:', err);
      setErrorMsg(err?.message || 'Failed to extract procurement fields.');
      setIsTranscribing(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!transcriptionResult?.transcript) return;
    navigator.clipboard?.writeText(transcriptionResult.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToBooking = () => {
    if (transcriptionResult?.parsedFields && onApplyFields) {
      onApplyFields(transcriptionResult.parsedFields);
      onClose();
    }
  };

  // Quick preset voice samples for testing
  const handleTestSample = async (sampleText: string, sampleLang: string) => {
    setIsTranscribing(true);
    setErrorMsg(null);
    setSelectedLang(sampleLang);
    setLiveTranscript(sampleText);

    try {
      const result = await parseTextWithGemini(sampleText);
      setTranscriptionResult(result);
      setIsTranscribing(false);
    } catch (err) {
      console.error(err);
      setIsTranscribing(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/60 flex items-center justify-center border border-emerald-500/30 text-amber-300">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg font-serif">
                  Kisan Voice & Text Transcriber
                </h3>
                <span className="text-[10px] font-mono font-bold bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full shadow-xs">
                  Gemini Speech AI
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Speak or type in Hindi, Tamil, Punjabi, or English to autofill your procurement pass
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle (Mic vs Type) */}
        <div className="px-6 pt-4 pb-2 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('mic')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'mic'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Microphone</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Type Statement</span>
            </button>
          </div>

          {/* Language Selection */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
            {(['English', 'Hindi', 'Punjabi', 'Tamil'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLang(lang)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedLang === lang
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {lang === 'Hindi'
                  ? 'हिंदी'
                  : lang === 'Punjabi'
                  ? 'ਪੰਜਾਬੀ'
                  : lang === 'Tamil'
                  ? 'தமிழ்'
                  : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {activeTab === 'mic' ? (
            /* Central Recording Deck */
            <div className="bg-gradient-to-b from-stone-50 to-stone-100/60 rounded-2xl p-6 border border-stone-200 text-center relative overflow-hidden">
              {isRecording ? (
                <div className="space-y-4">
                  {/* Live soundwave animation */}
                  <div className="flex items-center justify-center gap-1.5 h-12">
                    {[40, 75, 55, 90, 65, 80, 45, 95, 70, 50, 85, 60].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          height: `${h}%`,
                          animationDelay: `${i * 0.08}s`,
                        }}
                        className="w-1.5 bg-emerald-600 rounded-full animate-pulse transition-all"
                      ></div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-mono font-extrabold text-red-600 flex items-center justify-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                      {formatTimer(recordingSeconds)}
                    </div>
                    <p className="text-xs text-stone-600 font-medium">
                      Listening to your voice... Speak your name, crop, quantity, and vehicle.
                    </p>
                  </div>

                  {/* Real-time live transcript display */}
                  {liveTranscript && (
                    <div className="p-3 bg-white/90 rounded-xl border border-emerald-300 text-xs text-stone-900 text-left font-sans shadow-xs animate-in fade-in">
                      <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Speech Recognition:
                      </span>
                      "{liveTranscript}"
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all hover:scale-105"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    Stop & Transcribe with Gemini
                  </button>
                </div>
              ) : isTranscribing ? (
                <div className="py-8 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-900 text-sm">
                      Transcribing Audio with Gemini AI...
                    </h4>
                    <p className="text-xs text-stone-500 font-mono">
                      Extracting procurement entities across regional languages
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-700/25 border-4 border-emerald-100 hover:scale-105 transition-transform">
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      title="Click to start microphone recording"
                    >
                      <Mic className="w-9 h-9 text-amber-300" />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-900 text-base font-serif">
                      Tap to Record Voice
                    </h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 leading-relaxed">
                      Example: <em>"My name is Balwant Singh, Wheat 45 quintals, tractor trolley HR-05-AR-2291."</em>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4 text-amber-300" />
                    Start Microphone Recording
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Manual Type Tab */
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                Type or Paste Spoken Procurement Statement:
              </label>
              <textarea
                rows={3}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={
                  selectedLang === 'Hindi'
                    ? 'उदा: मेरा नाम बलवंत सिंह है। 45 क्विंटल गेहूं, ट्रैक्टर ट्रॉली HR-05-AR-2291'
                    : selectedLang === 'Tamil'
                    ? 'எ.கா: என் பெயர் குமரன். கோதுமை 50 குவிண்டால், டிராக்டர் TN-01-AB-4092'
                    : selectedLang === 'Punjabi'
                    ? 'ਉਦਾ: ਮੇਰਾ ਨਾਮ ਗੁਰਪ੍ਰੀਤ ਕੌਰ ਹੈ। 60 ਕੁਇੰਟਲ ਝੋਨਾ, ਮਿੰਨੀ ਟਰੱਕ PB-10-BK-7704'
                    : 'e.g. My name is Balwant Singh. Wheat 45 quintals, tractor trolley HR-05-AR-2291'
                }
                className="w-full p-3 text-xs bg-white rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-sans"
              />
              <button
                type="button"
                onClick={handleParseManualText}
                disabled={isTranscribing || !manualText.trim()}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTranscribing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Details with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Transcribe & Extract Fields with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Audio Player if recorded */}
          {audioUrl && !isRecording && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-600 font-medium flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-700" />
                Recorded Audio Playback:
              </span>
              <audio src={audioUrl} controls className="h-8 max-w-[240px]" />
            </div>
          )}

          {/* Transcription Results Card */}
          {transcriptionResult && (
            <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-300 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                    Transcribed Speech Text
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="p-1 rounded-md hover:bg-emerald-200/60 text-emerald-900 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Exact verbatim text */}
              <div className="p-3.5 bg-white rounded-xl border border-emerald-200 text-stone-900 text-sm leading-relaxed font-sans shadow-xs">
                "{transcriptionResult.transcript}"
              </div>

              {/* Extracted Procurement Fields */}
              {transcriptionResult.parsedFields && Object.keys(transcriptionResult.parsedFields).length > 0 ? (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Auto-Extracted Booking Data:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {transcriptionResult.parsedFields.farmerName && (
                      <div className="p-2 bg-white rounded-lg border border-stone-200 shadow-2xs">
                        <span className="text-[10px] text-stone-400 block">Farmer Name</span>
                        <span className="font-bold text-stone-900">
                          {transcriptionResult.parsedFields.farmerName}
                        </span>
                      </div>
                    )}
                    {transcriptionResult.parsedFields.commodity && (
                      <div className="p-2 bg-white rounded-lg border border-stone-200 shadow-2xs">
                        <span className="text-[10px] text-stone-400 block">Commodity</span>
                        <span className="font-bold text-amber-800">
                          {transcriptionResult.parsedFields.commodity}
                        </span>
                      </div>
                    )}
                    {transcriptionResult.parsedFields.quantityQuintals && (
                      <div className="p-2 bg-white rounded-lg border border-stone-200 shadow-2xs">
                        <span className="text-[10px] text-stone-400 block">Quantity</span>
                        <span className="font-bold text-emerald-800">
                          {transcriptionResult.parsedFields.quantityQuintals} qtl
                        </span>
                      </div>
                    )}
                    {transcriptionResult.parsedFields.vehicleNumber && (
                      <div className="p-2 bg-white rounded-lg border border-stone-200 shadow-2xs">
                        <span className="text-[10px] text-stone-400 block">Vehicle</span>
                        <span className="font-bold font-mono text-stone-900">
                          {transcriptionResult.parsedFields.vehicleNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {onApplyFields && (
                    <button
                      type="button"
                      onClick={handleApplyToBooking}
                      className="w-full mt-3 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Auto-Fill & Apply to Farmer Booking Form</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  Transcribed successfully! Could not detect specific numbers or vehicle plate. You can re-record or apply manually.
                </div>
              )}
            </div>
          )}

          {/* Quick Test Samples */}
          <div className="pt-2 border-t border-stone-100">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
              Or Click Any 1-Click Demo Spoken Voice Sample:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  handleTestSample(
                    'My name is Balwant Singh. I want to book wheat procurement for 45 quintals using tractor trolley HR-05-AR-2291.',
                    'English'
                  )
                }
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-stone-800">
                  🌾 English
                </div>
                <div className="text-[10px] text-stone-500 truncate mt-0.5">
                  Balwant Singh, 45 qtl wheat
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleTestSample(
                    'मेरा नाम बलवंत सिंह है। मुझे 45 क्विंटल गेहूं बेचने के लिए ट्रैक्टर ट्रॉली HR-05-AR-2291 से स्लॉट चाहिए।',
                    'Hindi'
                  )
                }
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-stone-800">
                  🌾 हिंदी (Hindi)
                </div>
                <div className="text-[10px] text-stone-500 truncate mt-0.5">
                  बलवंत सिंह, 45 क्विंटल गेहूं
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleTestSample(
                    'என் பெயர் குமரன். கோதுமை 50 குவிண்டால் டிராக்டரில் விநியோகிக்க முன்பதிவு செய்கிறேன். வண்டி எண் TN-01-AB-4092.',
                    'Tamil'
                  )
                }
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-stone-800">
                  🌾 தமிழ் (Tamil)
                </div>
                <div className="text-[10px] text-stone-500 truncate mt-0.5">
                  குமரன், 50 குவிண்டால் கோதுமை
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleTestSample(
                    'ਮੇਰਾ ਨਾਮ ਗੁਰਪ੍ਰੀਤ ਕੌਰ ਹੈ। ਮੈਂ 60 ਕੁਇੰਟਲ ਝੋਨਾ ਮਿੰਨੀ ਟਰੱਕ PB-10-BK-7704 ਵਿੱਚ ਲਿਆਉਣਾ ਚਾਹੁੰਦੀ ਹਾਂ।',
                    'Punjabi'
                  )
                }
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-stone-800">
                  🍚 ਪੰਜਾਬੀ (Punjabi)
                </div>
                <div className="text-[10px] text-stone-500 truncate mt-0.5">
                  ਗੁਰਪ੍ਰੀਤ ਕੌਰ, 60 ਕੁਇੰਟਲ
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Gemini Multilingual Speech Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
