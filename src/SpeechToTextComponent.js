import { useState, useEffect, useRef } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { saveAs } from 'file-saver';

const SPEECH_KEY = process.env.REACT_APP_SPEECH_KEY;
const SPEECH_REGION = process.env.REACT_APP_SPEECH_REGION;

const SpeechToTextComponent = () => {
  const [isListening, setIsListening] = useState(false);
  const speechConfig = useRef(null);
  const audioConfig = useRef(null);
  const recognizer = useRef(null);
  const [recognizingTranscript, setRecognizingTranscript] = useState('');
  const [recognizedTranscript, setRecognizedTranscript] = useState('');

  useEffect(() => {
    speechConfig.current = sdk.SpeechConfig.fromSubscription(
      SPEECH_KEY,
      SPEECH_REGION
    );
    speechConfig.current.speechRecognitionLanguage = 'en-US';

    audioConfig.current = sdk.AudioConfig.fromDefaultMicrophoneInput();
    recognizer.current = new sdk.SpeechRecognizer(
      speechConfig.current,
      audioConfig.current
    );

    recognizer.current.recognized = (s, e) => {
      const result = e.result;
      if (result.reason === sdk.ResultReason.RecognizedSpeech) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const newText = `[${timestamp}] ${result.text}\n`;
        setRecognizedTranscript((prevTranscript) => prevTranscript + newText);
      }
    };

    recognizer.current.recognizing = (s, e) => {
      const result = e.result;
      if (result.reason === sdk.ResultReason.RecognizingSpeech) {
        setRecognizingTranscript(result.text);
      }
    };

    recognizer.current.startContinuousRecognitionAsync(() => {
      setIsListening(true);
    });

    return () => {
      recognizer.current.stopContinuousRecognitionAsync(() => {
        setIsListening(false);
      });
    };
  }, []);

  const pauseListening = () => {
    setIsListening(false);
    recognizer.current.stopContinuousRecognitionAsync();
  };

  const resumeListening = () => {
    if (!isListening) {
      setIsListening(true);
      recognizer.current.startContinuousRecognitionAsync();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    recognizer.current.stopContinuousRecognitionAsync(() => {
      saveTranscript(recognizedTranscript);
    });
  };

  const saveTranscript = (transcript) => {
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'transcript.txt');
  };

  return (
    <div>
      <button onClick={resumeListening}>Resume Listening</button>
      <button onClick={pauseListening}>Pause Listening</button>
      <button onClick={stopListening}>Stop Listening</button>

      <div>
        <div>Recognizing Transcript: {recognizingTranscript}</div>
        <div>Recognized Transcript: {recognizedTranscript}</div>
      </div>
    </div>
  );
};

export default SpeechToTextComponent;
