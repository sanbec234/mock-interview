// src/speech-recognition.d.ts
interface SpeechRecognitionResult {
    transcript: string;
    confidence: number;
  }
  
  interface SpeechRecognitionResultList extends Array<SpeechRecognitionResult> {}
  
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  
  interface SpeechRecognition {
    onresult: (event: SpeechRecognitionEvent) => void;
    start(): void;
    stop(): void;
    // Add other methods and properties as needed
  }
  
  declare var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
  
  declare var webkitSpeechRecognition: SpeechRecognition;
  