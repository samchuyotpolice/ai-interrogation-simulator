
import '../types';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Scenario, ChatMessage, Feedback, InvestigationSession, GeminiChat, InterrogateeRole, DifficultyLevel,
    PREDEFINED_INVESTIGATION_TOPICS, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent,
    SpeechSynthesisVoice, SessionContextV2, SimpleChatMessage, AvatarControlPayload,
    ToolName, ToolCallRequest, UserCommand, UserCommandType, InterruptionType, InterruptionTypeDisplay, // Added InterruptionType, InterruptionTypeDisplay
    ForceEmotionalStatePayload, RevealSpecificInfoHintPayload, TriggerInterruptionPayload, // Added TriggerInterruptionPayload
    AIAgent, LoadedAIAgent, KeyMoment, AIAgentType, SuspectProfile,
    Theme, ChatMessageSubType // Import Theme and ChatMessageSubType from types
} from '../types';
import { UI_TEXT, DEFAULT_AGENT_ID, loadAiAgents } from '../constants';
import * as GeminiService from '../services/GeminiService';
import Button from './common/Button';
import Input from './common/Input';
import LoadingSpinner from './common/LoadingSpinner';
import ChatBubble from './ChatBubble';
import Modal from './common/Modal';
import Select from './common/Select';
import ToggleSwitch from './common/ToggleSwitch'; // Import ToggleSwitch
// import { Theme } from '../App'; // Removed to break circular dependency
import '../live-audio';
import '../live-audio-visuals-3d';
import { GdmLiveAudio, LiveAudioState } from '../live-audio'; // Imported LiveAudioState
import { GdmLiveAudioVisuals3D } from '../live-audio-visuals-3d'; // Ensure GdmLiveAudioVisuals3D is imported

// Basic SVG Icons
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const HintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" clipRule="evenodd" /></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a.75.75 0 01-.75-.75V6.32L6.002 9.42a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.062 0l5.25 5.25a.75.75 0 01-1.061 1.06L12.75 6.32v11.68a.75.75 0 01-.75.75z" /></svg>;
const MicListeningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 006.75-6.75v-1.5a6.75 6.75 0 00-13.5 0v1.5A6.75 6.75 0 0012 18.75zM12 7.5A2.25 2.25 0 0114.25 5.25v1.5A2.25 2.25 0 0112 9V7.5z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const ClearLogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.288.255A1.037 1.037 0 017.38 7.608l.008.007a1.037 1.037 0 001.036.953h.008a1.037 1.037 0 001.035-.953l.008-.007A1.037 1.037 0 0110.5 6.63l.008-.007M6.382 5.79A48.13 48.13 0 0112 5.135M12 5.135V4.5A2.25 2.25 0 0114.25 2.25h1.5A2.25 2.25 0 0118 4.5v.635m-6.382 0c-1.153 0-2.243.096-3.288.255A1.037 1.037 0 007.38 7.608l.008.007a1.037 1.037 0 011.036.953h.008a1.037 1.037 0 011.035-.953l.008-.007A1.037 1.037 0 0010.5 6.63l.008-.007M17.618 5.79A48.13 48.13 0 0012 5.135" /></svg>;


interface TraineeViewProps {
  traineeId: string;
  onSessionComplete: (session: InvestigationSession) => void;
  theme: Theme;
}

type ViewState =
  'initial_setup_agent_selection' |
  'initial_setup_interrogatee_role' |
  'initial_setup_difficulty' |
  'initial_setup_topic' |
  'initial_setup_review' |
  'generating_scenario' |
  'scenario_ready' |
  'investigation_active' |
  'generating_feedback' |
  'feedback_ready' |
  'error' |
  'generating_hint';

// Use LiveAudioState directly for visual state consistency
type LiveAudioVisualIndicatorState = LiveAudioState;


const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSynthesisAPI = window.speechSynthesis;

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const callable = (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return callable as (...args: Parameters<F>) => void; // Ensure correct typing for void return
}


const TraineeView: React.FC<TraineeViewProps> = ({ traineeId, onSessionComplete, theme }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<InterrogateeRole | ''>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | ''>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [availableAgents, setAvailableAgents] = useState<LoadedAIAgent[]>([]);


  const [currentSession, setCurrentSession] = useState<InvestigationSession | null>(null);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [viewState, setViewState] = useState<ViewState>('initial_setup_agent_selection');
  const [error, setError] = useState<string | null>(null);
  const [liveAudioError, setLiveAudioError] = useState<string | null>(null);

  const [geminiChatInstance, setGeminiChatInstance] = useState<GeminiChat | null>(null);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState<boolean>(false);
  const [isScenarioDetailsModalOpen, setIsScenarioDetailsModalOpen] = useState<boolean>(false);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechRecognitionInstance, setSpeechRecognitionInstance] = useState<SpeechRecognition | null>(null);
  const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeechApiSupported, setIsSpeechApiSupported] = useState(true);
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);

  const [isAISpeechOutputEnabled, setIsAISpeechOutputEnabled] = useState<boolean>(!!speechSynthesisAPI);
  const [isRegularTtsMuted, setIsRegularTtsMuted] = useState<boolean>(false);

  const [userWantsLiveAudio, setUserWantsLiveAudio] = useState<boolean>(false);
  const [isLiveAudioModeActive, setIsLiveAudioModeActive] = useState<boolean>(false);
  const [liveAudioVisualState, setLiveAudioVisualState] = useState<LiveAudioVisualIndicatorState>(LiveAudioState.IDLE);
  const liveAudioElementRef = useRef<GdmLiveAudio>(null);
  const visuals3dRef = useRef<GdmLiveAudioVisuals3D>(null);

  const [trainerInterventionForNextTurn, setTrainerInterventionForNextTurn] = useState<UserCommand | null>(null);

  const [inputAudioNodeForVisualizer, setInputAudioNodeForVisualizer] = useState<AudioNode | null>(null);
  const [outputAudioNodeForVisualizer, setOutputAudioNodeForVisualizer] = useState<AudioNode | null>(null);
  const [currentAvatarDirectives, setCurrentAvatarDirectives] = useState<AvatarControlPayload | null>(null);
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);


  const [usedHintsCount, setUsedHintsCount] = useState<number>(0);
  const [investigationLog, setInvestigationLog] = useState<string>(""); // New for trainee log
  const [investigationLogSearchTerm, setInvestigationLogSearchTerm] = useState<string>(""); // New for log search
  const [investigationLogSearchOccurrences, setInvestigationLogSearchOccurrences] = useState<number>(0); // New for log search results
  const [isClearLogConfirmModalOpen, setIsClearLogConfirmModalOpen] = useState<boolean>(false); // New for log clearing


  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [chatMessages, isAiTyping]);

  const addMessageToChatInternal = useCallback((text: string, sender: 'user' | 'ai' | 'system', subType?: ChatMessageSubType) => {
    setChatMessages(prev => [...prev, { id: `msg-${Date.now()}-${Math.random()}`, text, sender, timestamp: Date.now(), subType }]);
  }, []);

  const handleUserInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  }, []); // setUserInput from useState is stable
  
  const handleInvestigationLogSearchTermChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setInvestigationLogSearchTerm(term);
    if (term.trim() === "") {
      setInvestigationLogSearchOccurrences(0);
    } else {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); // Escape special regex chars
      const matches = investigationLog.match(regex);
      setInvestigationLogSearchOccurrences(matches ? matches.length : 0);
    }
  }, [investigationLog]); // Re-create if investigationLog changes, to use its latest value

  useEffect(() => {
    const fetchAgents = async () => {
        const agents = await loadAiAgents();
        setAvailableAgents(agents);
        if (agents.length > 0) {
            const defaultAgent = agents.find(a => a.isDefault && a.id === DEFAULT_AGENT_ID) || agents.find(a => a.id === DEFAULT_AGENT_ID) || agents[0];
            if (defaultAgent && (!selectedAgentId || !agents.find(a => a.id === selectedAgentId))) {
                 setSelectedAgentId(defaultAgent.id);
            } else if (!selectedAgentId && agents.length > 0) {
                 setSelectedAgentId(agents[0].id); // Select first if no default/specific found
            }
        }
    };
    fetchAgents();
  }, []);


  useEffect(() => {
    if (!process.env.API_KEY) {
        setError(UI_TEXT.errorApiKeyMissing);
        setLiveAudioError(UI_TEXT.errorApiKeyMissing + " " + UI_TEXT.featureLiveAudioErrorGeneric);
        console.warn(UI_TEXT.errorApiKeyMissing);
    }

    let recognition: SpeechRecognition | null = null;

    if (!SpeechRecognitionAPI || !speechSynthesisAPI) {
        setIsSpeechApiSupported(false);
        console.warn(UI_TEXT.featureSpeechNotSupported);
        setIsAISpeechOutputEnabled(false);
    } else {
        setIsSpeechApiSupported(true);
    }

    if (SpeechRecognitionAPI && isSpeechApiSupported) {
      recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'he-IL';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          setUserInput(transcript);
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error", event.error, event.message);
          const errorMessage = `${UI_TEXT.featureVoiceInputError}: ${event.error}`;
          addMessageToChatInternal(errorMessage, 'system');
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              setMicrophonePermissionError(UI_TEXT.featureMicrophonePermissionDenied);
          }
      };
      recognition.onend = () => setIsListening(false);
      setSpeechRecognitionInstance(recognition);
    }

    if (speechSynthesisAPI && isSpeechApiSupported) {
        const loadVoices = () => {
            const voices = speechSynthesisAPI.getVoices();
            setSpeechSynthesisVoices(voices);
        };
        if (speechSynthesisAPI.getVoices().length === 0) {
            speechSynthesisAPI.onvoiceschanged = loadVoices;
        } else {
            loadVoices();
        }
    } else {
        setIsAISpeechOutputEnabled(false);
    }

    return () => {
        if (speechSynthesisAPI) {
            speechSynthesisAPI.cancel();
            speechSynthesisAPI.onvoiceschanged = null;
        }
        if (recognition) {
            recognition.abort();
        }
    };
  }, [addMessageToChatInternal, isSpeechApiSupported]);

  useEffect(() => {
    if (isLiveAudioModeActive || isRegularTtsMuted || !isAISpeechOutputEnabled || !isSpeechApiSupported || !speechSynthesisAPI || chatMessages.length === 0) {
        if (speechSynthesisAPI) speechSynthesisAPI.cancel();
        return;
    }

    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage.sender === 'ai') {
        const textToSpeak = lastMessage.text.trim();
        if (!textToSpeak) return;

        speechSynthesisAPI.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        let selectedVoice: SpeechSynthesisVoice | undefined = undefined;
        const hebrewVoices = speechSynthesisVoices.filter(v => v.lang.startsWith('he-IL') || v.lang.startsWith('he'));
        if (hebrewVoices.length > 0) {
            selectedVoice = hebrewVoices.find(v => v.lang === 'he-IL' && v.localService) || hebrewVoices.find(v => v.lang === 'he-IL') || hebrewVoices[0];
        }
        if (selectedVoice) utterance.voice = selectedVoice;
        else utterance.lang = 'he-IL';

        speechSynthesisAPI.speak(utterance);
    }
  }, [chatMessages, isAISpeechOutputEnabled, isSpeechApiSupported, speechSynthesisVoices, isRegularTtsMuted, isLiveAudioModeActive]);

 useEffect(() => {
    const liveAudioNode = liveAudioElementRef.current;
    if (liveAudioNode) {
      const castedLiveAudioNode = liveAudioNode as unknown as HTMLElement;

      const handleAiSpeechFromLiveAPI = (event: Event) => {
        const customEvent = event as CustomEvent<{ text: string | null, directives: AvatarControlPayload | null | undefined }>;
        if (customEvent.detail.text && isLiveAudioModeActive) {
            addMessageToChatInternal(customEvent.detail.text, 'ai');
        }
        setCurrentAvatarDirectives(customEvent.detail.directives || null);
      };

      const handleLiveAudioStatusUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<{ status: string, code?: string, error?: string, oldState?: string }>;
        console.log("[TraineeView] Live Audio Status Event:", customEvent.detail);
        const stateCode = customEvent.detail.code?.toLowerCase() as LiveAudioVisualIndicatorState || LiveAudioState.IDLE;
        setLiveAudioVisualState(stateCode);

        // Add chat messages for specific state changes and errors
        let userFriendlyMessage: string | null = null;
        let isError = false;

        switch (stateCode) {
            case LiveAudioState.REQUESTING_MIC:
                userFriendlyMessage = UI_TEXT.liveAudioConnectingMic;
                break;
            case LiveAudioState.MIC_ACCESS_GRANTED:
                 if (customEvent.detail.oldState?.toLowerCase() !== LiveAudioState.MIC_ACCESS_GRANTED) { // Avoid spamming on repeated grants
                    userFriendlyMessage = UI_TEXT.liveAudioMicAccessSuccess;
                 }
                break;
            case LiveAudioState.CONNECTING_AI:
                userFriendlyMessage = UI_TEXT.liveAudioConnectingAIService;
                break;
            case LiveAudioState.AI_SESSION_OPEN:
                userFriendlyMessage = UI_TEXT.liveAudioConnectedAIService;
                setIsLiveAudioModeActive(true);
                if (liveAudioNode.inputNodeForVisualizer) setInputAudioNodeForVisualizer(liveAudioNode.inputNodeForVisualizer);
                if (liveAudioNode.outputNodeForVisualizer) setOutputAudioNodeForVisualizer(liveAudioNode.outputNodeForVisualizer);
                break;
            case LiveAudioState.MIC_ACCESS_DENIED:
                userFriendlyMessage = UI_TEXT.liveAudioErrorMicPermissionDetail;
                isError = true;
                break;
            case LiveAudioState.AI_SESSION_CONNECT_FAILED:
            case LiveAudioState.API_SESSION_ERROR_CALLBACK:
                userFriendlyMessage = UI_TEXT.liveAudioErrorConnectionDetail + (customEvent.detail.error ? ` (${customEvent.detail.error})` : '');
                isError = true;
                break;
            case LiveAudioState.API_KEY_MISSING:
                 userFriendlyMessage = UI_TEXT.errorApiKeyMissing;
                 isError = true;
                 break;    
            case LiveAudioState.ERROR: // Generic error or specific error reported by gdm-live-audio
                userFriendlyMessage = customEvent.detail.error ? `${UI_TEXT.liveAudioErrorGenericDetail} (${customEvent.detail.error})` : UI_TEXT.liveAudioErrorGenericDetail;
                isError = true;
                break;
            case LiveAudioState.CLOSING_SESSION:
                 // Message for user-initiated stop is handled in handleToggleLiveAudio
                 // This handles AI-initiated or error-initiated session close
                 if (customEvent.detail.oldState?.toLowerCase() !== LiveAudioState.IDLE && userWantsLiveAudio) { // If user didn't explicitly stop
                    userFriendlyMessage = UI_TEXT.liveAudioSessionEndedByAI;
                 }
                 break;
            case LiveAudioState.IDLE:
                 // Only show message if it was actively closed, not on initial load
                if (customEvent.detail.oldState?.toLowerCase() === LiveAudioState.CLOSING_SESSION && !userWantsLiveAudio) { // Check if user intended to stop
                    // Message already handled by handleToggleLiveAudio or other specific error
                } else if (customEvent.detail.oldState && customEvent.detail.oldState.toLowerCase() !== LiveAudioState.IDLE && isError) {
                    // This means an error led to IDLE, message already sent.
                }
                break;
        }

        if (userFriendlyMessage) {
            addMessageToChatInternal(userFriendlyMessage, 'system');
        }

        if (isError) {
            setLiveAudioError(userFriendlyMessage || UI_TEXT.featureLiveAudioErrorGeneric);
            setIsLiveAudioModeActive(false);
            setUserWantsLiveAudio(false); // Turn off the toggle if an error occurred
        } else {
            setLiveAudioError(null); // Clear previous errors if current state is not an error
             if (stateCode === LiveAudioState.AI_SESSION_OPEN || stateCode === LiveAudioState.STREAMING_USER_AUDIO) {
                setIsLiveAudioModeActive(true);
            } else if (stateCode === LiveAudioState.IDLE || stateCode === LiveAudioState.CLOSING_SESSION) {
                setIsLiveAudioModeActive(false);
                // Don't automatically set userWantsLiveAudio to false here, as it might be an AI-initiated close
            }
        }
      };
      castedLiveAudioNode.addEventListener('ai-speech', handleAiSpeechFromLiveAPI as EventListener);
      castedLiveAudioNode.addEventListener('live-audio-status', handleLiveAudioStatusUpdate as EventListener);

      return () => {
        castedLiveAudioNode.removeEventListener('ai-speech', handleAiSpeechFromLiveAPI as EventListener);
        castedLiveAudioNode.removeEventListener('live-audio-status', handleLiveAudioStatusUpdate as EventListener);
      };
    }
  }, [isLiveAudioModeActive, addMessageToChatInternal, userWantsLiveAudio]); // Added userWantsLiveAudio dependency

  useEffect(() => {
    const handleTrainerCommand = (event: Event) => {
        const customEvent = event as CustomEvent<{ sessionId: string, command: UserCommand }>;
        if (viewState === 'investigation_active' && currentSession && customEvent.detail.sessionId === currentSession.id) {
            const { command } = customEvent.detail;
            setTrainerInterventionForNextTurn(command);
            
            let systemMessageText = `התקבלה התערבות מדריך. ההשפעה תחול בתגובה הבאה של ה-AI.`;
            let messageSubType: ChatMessageSubType = 'intervention_notification';

            if (command.commandType === UserCommandType.TRIGGER_INTERRUPTION) {
                const payload = command.payload as TriggerInterruptionPayload;
                const interruptionTypeDisplay = InterruptionTypeDisplay[payload.interruptionType] || payload.interruptionType;
                systemMessageText = `--- ${interruptionTypeDisplay}: ${payload.details} ---`;
                messageSubType = 'interruption_event';
            }
            addMessageToChatInternal(systemMessageText, 'system', messageSubType);
        }
    };

    window.addEventListener('trainer-intervention-command', handleTrainerCommand);
    return () => {
        window.removeEventListener('trainer-intervention-command', handleTrainerCommand);
    };
  }, [viewState, currentSession, addMessageToChatInternal]);


  const debouncedSaveLog = useCallback(
    debounce((sessionId: string, log: string, currentViewState: ViewState) => {
      if (currentViewState === 'investigation_active' && log.trim() !== "") { // Pass viewState to ensure correct condition check and check if log is not empty
        localStorage.setItem(`investigation_log_${sessionId}`, log);
        console.log('Investigation log saved (debounced)');
      } else if (currentViewState === 'investigation_active' && log.trim() === "") {
        localStorage.removeItem(`investigation_log_${currentSession!.id}`); // Use currentSession safely here as it's part of the condition
        console.log('Investigation log cleared as it was empty (debounced)');
      }
    }, 1000),
    [currentSession] // currentSession is needed for removing log item
  );

  useEffect(() => {
    if (currentSession?.id && investigationLog !== undefined && viewState === 'investigation_active') {
      // Load log on session start/viewState change to active
      const savedLog = localStorage.getItem(`investigation_log_${currentSession.id}`);
      if (savedLog && investigationLog === "") { // Only load if current log is empty to avoid overwriting ongoing typing
        setInvestigationLog(savedLog);
      }
    }
  }, [currentSession?.id, viewState]); // Load log when session becomes active

  useEffect(() => {
    // Save log using debounce when investigationLog changes
    if (currentSession?.id && investigationLog !== undefined && viewState === 'investigation_active') {
      debouncedSaveLog(currentSession.id, investigationLog, viewState);
    }
  }, [investigationLog, currentSession?.id, viewState, debouncedSaveLog]);


  const resetSetup = () => {
    const defaultAgent = availableAgents.find(a => a.isDefault && a.id === DEFAULT_AGENT_ID) || availableAgents.find(a => a.id === DEFAULT_AGENT_ID) || (availableAgents.length > 0 ? availableAgents[0] : null);
    setSelectedAgentId(defaultAgent ? defaultAgent.id : '');
    setSelectedRole('');
    setSelectedDifficulty('');
    setSelectedTopic('');
    setCustomTopic('');
    setCurrentScenario(null);
    setChatMessages([]);
    setCurrentSession(null);
    setGeminiChatInstance(null);
    setError(null);
    setLiveAudioError(null);
    setUserWantsLiveAudio(false);
    setIsLiveAudioModeActive(false);
    setLiveAudioVisualState(LiveAudioState.IDLE);
    setTrainerInterventionForNextTurn(null);
    setInputAudioNodeForVisualizer(null);
    setOutputAudioNodeForVisualizer(null);
    setIsRegularTtsMuted(false);
    setUsedHintsCount(0);
    setInvestigationLog(""); // Reset investigation log
    setInvestigationLogSearchTerm(""); // Reset log search
    setInvestigationLogSearchOccurrences(0); // Reset log search results
    setCurrentAvatarDirectives(null);
    setIsAiTyping(false);
    setViewState('initial_setup_agent_selection');
  };

  const initiateLiveAudioConnection = async () => {
    if (!process.env.API_KEY) {
        addMessageToChatInternal(UI_TEXT.errorApiKeyMissing + " " + UI_TEXT.featureLiveAudioErrorGeneric, 'system');
        setUserWantsLiveAudio(false);
        setLiveAudioVisualState(LiveAudioState.ERROR); // Ensure visual state reflects this
        return false;
    }
    if (!currentScenario || !currentScenario.fullSystemPromptForChat) {
        addMessageToChatInternal(UI_TEXT.featureLiveAudioErrorNoScenario, 'system');
        setUserWantsLiveAudio(false);
        setLiveAudioVisualState(LiveAudioState.ERROR);
        return false;
    }
    if (liveAudioElementRef.current) {
        setLiveAudioError(null); // Clear previous errors
        liveAudioElementRef.current.initialSystemPrompt = currentScenario.fullSystemPromptForChat;
        try {
            // activateMicrophoneAndStartSession now handles internal state changes and dispatches events.
            // We await it but rely on the event listener (handleLiveAudioStatusUpdate) for UI changes.
            if (typeof (liveAudioElementRef.current as any).activateMicrophoneAndStartSession === 'function') {
                await (liveAudioElementRef.current as any).activateMicrophoneAndStartSession();
                // Success here means the process started; actual connection state comes via event.
                return true; 
            } else {
                addMessageToChatInternal("תכונת השיחה הקולית החיה אינה זמינה במלואה עקב רכיב חסר או לא שלם.", 'system');
                setUserWantsLiveAudio(false);
                setLiveAudioVisualState(LiveAudioState.ERROR);
                return false;
            }
        } catch (e: any) {
            // Errors during the initial attempt (e.g., immediate API key issue, mic access) might be caught here.
            // Other errors (async connection failures) will be caught by the 'live-audio-status' event listener.
            // The message is already added via the event listener from setState in gdm-live-audio.
            console.error("[TraineeView] Error in initiateLiveAudioConnection direct call:", e.message);
            setUserWantsLiveAudio(false); // Ensure toggle is off
            // setLiveAudioVisualState('error'); // Already handled by gdm-live-audio's setState
            return false;
        }
    }
    return false;
  };

  const terminateLiveAudioConnection = () => {
    if (liveAudioElementRef.current) {
        if (typeof (liveAudioElementRef.current as any).stopMicrophoneAndSessionAudio === 'function') {
            (liveAudioElementRef.current as any).stopMicrophoneAndSessionAudio(true); // true to dispatch closing event
        } else {
            console.warn("GdmLiveAudio: stopMicrophoneAndSessionAudio method not available.");
        }
    }
    // Message for user-initiated stop
    addMessageToChatInternal(UI_TEXT.liveAudioStoppedByUser, 'system');
    setLiveAudioVisualState(LiveAudioState.IDLE); // Or 'closing_session' if preferred, then to 'idle' via event
  };

  const handleToggleLiveAudio = async (checked: boolean) => {
    setUserWantsLiveAudio(checked);
    if (checked) {
        if (viewState === 'investigation_active') {
            setIsRegularTtsMuted(true); 
            const success = await initiateLiveAudioConnection();
            if (!success) {
                // Error messages and state changes are handled inside initiateLiveAudioConnection or by the event listener.
                setIsRegularTtsMuted(false); 
                setUserWantsLiveAudio(false); // Reset toggle if initial attempt fails clearly
            }
        } else {
            addMessageToChatInternal(UI_TEXT.featureLiveAudioErrorStartOnlyInInvestigation, 'system');
            setUserWantsLiveAudio(false);
        }
    } else {
        terminateLiveAudioConnection();
        setIsRegularTtsMuted(false);
    }
  };


  const handleGenerateScenario = async () => {
    const agent = availableAgents.find(a => a.id === selectedAgentId);
    if (!agent) {
        setError(UI_TEXT.errorMissingSetupSelection + " (לא נבחר סוכן)");
        setViewState('initial_setup_agent_selection');
        return;
    }

    setError(null);
    setViewState('generating_scenario');

    let scenario: Scenario | null = null;
    const topicToUseForSession = (agent.agentType === 'interrogation') ? (customTopic.trim() || selectedTopic) : agent.name;

    if (agent.agentType === 'interrogation') {
        if (!selectedRole || !selectedDifficulty || (!selectedTopic && !customTopic.trim())) {
            setError(UI_TEXT.errorMissingSetupSelection);
            setViewState('initial_setup_review');
            return;
        }
        scenario = await GeminiService.generateScenario(selectedRole, selectedDifficulty, topicToUseForSession, selectedAgentId);
    } else {
        const baseSystemPrompt = agent.baseSystemPrompt || `אתה סוכן AI בשם ${agent.name}. תפקידך הוא: ${agent.description}`;
        const fullSystemPrompt = GeminiService.getSystemPromptWithExtras(baseSystemPrompt, null, null)
            .replace(/{{INTERROGATEE_ROLE}}/g, "N/A")
            .replace(/{{DIFFICULTY_LEVEL}}/g, "N/A")
            .replace(/{{SCENARIO_DETAILS_FOR_AI}}/g, `אתה ${agent.name}. תיאור: ${agent.description}`)
            .replace(/{{EVIDENCE_DETAILS_FOR_AI}}/g, "אין ראיות רלוונטיות לסוג סוכן זה.")
            .replace(/{{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}/g, agent.personalityTraits && agent.personalityTraits.length > 0 ? `תכונות אישיות: ${agent.personalityTraits.join(', ')}` : "")
            .replace(/{{INTERROGATEE_MOTIVATION_HINT}}/g, "")
            .replace(/{{BEHAVIORAL_DYNAMICS_HINT}}/g, "")
            .replace(/{{TRAINER_INTERVENTION_HINT}}/g, "")
            .replace(/{{INVESTIGATION_PROGRESS_HINT}}/g, "");


        scenario = {
            id: `scenario-custom-${Date.now()}`,
            caseType: agent.name,
            fullCaseDescription: agent.description,
            interrogateeRole: 'N/A',
            interrogateeProfile: { name: agent.name, age: 0, occupation: 'סוכן AI' } as SuspectProfile,
            evidence: { title: 'N/A', items: ['N/A'] },
            fullSystemPromptForChat: fullSystemPrompt,
            userSelectedDifficulty: 'N/A',
            userSelectedTopic: agent.name,
            customAgentId: agent.id,
            agentType: agent.agentType,
            investigationGoals: [`מטרת הסוכן ${agent.name} היא: ${agent.description}`], // Generic goal
        };
    }

    if (scenario && scenario.fullSystemPromptForChat) {
      setCurrentScenario(scenario);
      const newSession: InvestigationSession = {
        id: `session-${Date.now()}`,
        traineeId,
        scenario,
        chatTranscript: [],
        startTime: Date.now(),
        status: 'scenario_ready',
        initialSelections: {
          customAgentId: selectedAgentId,
          agentType: agent.agentType,
          interrogateeRole: agent.agentType === 'interrogation' ? selectedRole || undefined : undefined,
          difficulty: agent.agentType === 'interrogation' ? selectedDifficulty || undefined : undefined,
          topic: topicToUseForSession,
        },
        usedHintsCount: 0,
        lastTrainerCommand: null,
        investigationLog: "", // Initialize log
        trainerCommandLog: [], // Initialize command log
      };
      setCurrentSession(newSession);
      setViewState('scenario_ready');
    } else {
      setError(UI_TEXT.errorGeneratingScenario);
      setViewState('error');
    }
  };

  const handleStartInvestigation = async () => {
    if (!currentScenario || !currentScenario.fullSystemPromptForChat) {
      setError(UI_TEXT.couldNotLoadScenario);
      setViewState('error');
      return;
    }
    setError(null);

    let systemPromptForChat = currentScenario.fullSystemPromptForChat;

    const chat = await GeminiService.startChatWithSuspect(systemPromptForChat);
    if (chat) {
      setGeminiChatInstance(chat);
      setViewState('investigation_active');
      if (currentSession) {
        setCurrentSession(prev => prev ? { ...prev, status: 'active' } : null);
      }
      const chatStartMessage = currentScenario.agentType === 'interrogation'
        ? `התחלת חקירה (טקסט) עם ${currentScenario.interrogateeProfile.name} (${currentScenario.interrogateeRole}).`
        : `התחלת שיחה (טקסט) עם הסוכן: ${currentScenario.interrogateeProfile.name}.`;
      addMessageToChatInternal(chatStartMessage, 'system');

      if (userWantsLiveAudio) {
        setIsRegularTtsMuted(true);
        await initiateLiveAudioConnection();
      }

    } else {
      setError(UI_TEXT.errorStartingChat);
      setViewState('error');
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !geminiChatInstance || !currentSession || !currentScenario) return;
    if (isLiveAudioModeActive) {
        addMessageToChatInternal("לא ניתן לשלוח הודעת טקסט בזמן שיחה קולית חיה פעילה.", "system");
        setUserInput('');
        return;
    }

    const messageToSend = userInput;
    setUserInput('');
    addMessageToChatInternal(messageToSend, 'user');
    setIsAiTyping(true);


    if (currentSession) {
        const updatedTranscript = [...currentSession.chatTranscript, { id: `msg-user-${Date.now()}`, text: messageToSend, sender: 'user' as 'user', timestamp: Date.now() }];
        setCurrentSession(prev => prev ? { ...prev, chatTranscript: updatedTranscript } : null);
    }

    const chatHistoryForContext: SimpleChatMessage[] = chatMessages
        .filter(msg => msg.sender === 'user' || msg.sender === 'ai') // Only user/ai messages for context
        .map(msg => ({ speaker: msg.sender as 'user' | 'ai', text: msg.text }));
    
    // Add the current user message to the context being sent, but not yet to the main chatMessages state used for display
    const currentContext = [...chatHistoryForContext, { speaker: 'user' as 'user', text: messageToSend }];

    const { text: aiResponseText, directives: avatarDirectives } = await GeminiService.sendChatMessage(
      geminiChatInstance,
      messageToSend, // Pass only the current user message, Gemini Service will handle context preamble
      currentScenario,
      currentContext, // Pass combined history
      undefined, 
      undefined, 
      trainerInterventionForNextTurn
    );
    setIsAiTyping(false);
    setTrainerInterventionForNextTurn(null); 
    setCurrentAvatarDirectives(avatarDirectives || null);

    if (aiResponseText) {
      addMessageToChatInternal(aiResponseText, 'ai');
      if (currentSession) {
        const updatedTranscriptWithAI = [...currentSession.chatTranscript, { id: `msg-ai-${Date.now()}`, text: aiResponseText, sender: 'ai' as 'ai', timestamp: Date.now() }];
        setCurrentSession(prev => prev ? { ...prev, chatTranscript: updatedTranscriptWithAI } : null);
      }
    } else {
      addMessageToChatInternal(UI_TEXT.errorSendingMessage, 'system');
    }
  };

  const handleEndInvestigation = async () => {
    setShowEndConfirmModal(false);
    if (!currentSession || !currentScenario) return;
    
    if (isLiveAudioModeActive) {
        terminateLiveAudioConnection();
    }
    if (speechSynthesisAPI) speechSynthesisAPI.cancel();


    if (currentScenario.agentType !== 'interrogation') {
        addMessageToChatInternal(UI_TEXT.sessionEndedNoFeedback, 'system');
        const updatedSession = { ...currentSession, endTime: Date.now(), status: 'completed' as 'completed', feedback: undefined };
        setCurrentSession(updatedSession);
        onSessionComplete(updatedSession);
        setViewState('feedback_ready'); // Or a specific "session_ended_no_feedback_view"
        return;
    }


    setViewState('generating_feedback');
    addMessageToChatInternal(UI_TEXT.investigationEnded, 'system');

    const feedback = await GeminiService.generateFeedbackForSession(
      chatMessages,
      currentScenario.interrogateeRole as InterrogateeRole, // It's interrogation, so role is InterrogateeRole
      currentScenario.userSelectedDifficulty as DifficultyLevel, // Same for difficulty
      currentScenario.userSelectedTopic,
      usedHintsCount 
    );

    if (feedback) {
      const updatedSession = { ...currentSession, endTime: Date.now(), status: 'completed' as 'completed', feedback };
      setCurrentSession(updatedSession);
      onSessionComplete(updatedSession); // Make sure onSessionComplete is called with the final session
      setViewState('feedback_ready');
    } else {
      setError(UI_TEXT.errorGeneratingFeedback);
      const updatedSession = { ...currentSession, endTime: Date.now(), status: 'error' as 'error' }; // Mark as error if feedback fails
      setCurrentSession(updatedSession);
      onSessionComplete(updatedSession);
      setViewState('error');
    }
  };

  const handleToggleSpeechInput = () => {
    if (!isSpeechApiSupported || !speechRecognitionInstance) {
        addMessageToChatInternal(UI_TEXT.featureSpeechNotSupported, 'system');
        return;
    }
    if (microphonePermissionError) {
        addMessageToChatInternal(microphonePermissionError, 'system');
        return;
    }
    if (isListening) {
      speechRecognitionInstance.stop();
    } else {
      try {
        speechRecognitionInstance.start();
      } catch (e: any) {
        console.error("Error starting speech recognition:", e);
        if (e.name === 'NotAllowedError' || e.message?.includes('permission')) {
             setMicrophonePermissionError(UI_TEXT.featureMicrophonePermissionDenied);
             addMessageToChatInternal(UI_TEXT.featureMicrophonePermissionDenied, 'system');
        } else {
            addMessageToChatInternal(`${UI_TEXT.featureVoiceInputError}: ${e.message || e.name}`, 'system');
        }
      }
    }
  };
  
  const handleRequestHint = async () => {
    if (!currentScenario || !geminiChatInstance) {
        addMessageToChatInternal(UI_TEXT.errorGeneratingHint + " (אין תרחיש פעיל)", 'system');
        return;
    }
    const previousViewState = viewState;
    setViewState('generating_hint');
    setIsAiTyping(true); // Show typing indicator for hint generation

    const chatHistoryForHint: SimpleChatMessage[] = chatMessages
        .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
        .map(msg => ({ speaker: msg.sender as 'user' | 'ai', text: msg.text }));
    
    const lastUserMessage = chatMessages.filter(m => m.sender === 'user').pop();

    const hintText = await GeminiService.generateContextualHint(
        chatHistoryForHint,
        currentScenario,
        lastUserMessage?.text
    );
    setIsAiTyping(false);

    if (hintText && !hintText.startsWith(UI_TEXT.errorGeneratingHint)) {
        addMessageToChatInternal(`${hintText}`, 'system', 'hint_response');
        setUsedHintsCount(prev => prev + 1);
        if (currentSession) {
            setCurrentSession(prev => prev ? {...prev, usedHintsCount: prev.usedHintsCount + 1} : null);
        }
    } else {
        addMessageToChatInternal(hintText || UI_TEXT.errorGeneratingHint, 'system');
    }
    setViewState(previousViewState); // Return to previous state (likely investigation_active)
  };

  const handleClearLog = () => {
    setInvestigationLog("");
    if (currentSession?.id) {
        localStorage.removeItem(`investigation_log_${currentSession.id}`);
    }
    setIsClearLogConfirmModalOpen(false);
  };


  // --- Render Functions ---
  const renderInitialSetup = () => {
    const currentAgent = availableAgents.find(a => a.id === selectedAgentId);
    let currentStepTitle = UI_TEXT.setupStepAgentSelection;
    let stepContent = <></>;
    let nextButtonDisabled = false;
    let nextAction = () => {};
    let backAction = () => {};

    const baseCardClass = `p-4 sm:p-6 rounded-xl shadow-xl w-full max-w-lg mx-auto ${theme === 'light' ? 'bg-white border border-secondary-200' : 'themed-card'}`;
    const titleClass = `text-xl sm:text-2xl font-semibold mb-6 text-center ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`;
    
    switch(viewState) {
        case 'initial_setup_agent_selection':
            currentStepTitle = UI_TEXT.setupStepAgentSelection;
            nextButtonDisabled = !selectedAgentId;
            nextAction = () => {
                const agent = availableAgents.find(a => a.id === selectedAgentId);
                if (agent?.agentType === 'interrogation') {
                    setViewState('initial_setup_interrogatee_role');
                } else {
                    setViewState('initial_setup_review'); // Skip to review for non-interrogation
                }
            };
            stepContent = (
                <div className="space-y-4">
                    <Select 
                        label={UI_TEXT.selectAIAgent}
                        value={selectedAgentId}
                        onChange={e => setSelectedAgentId(e.target.value)}
                        options={availableAgents.map(agent => ({ value: agent.id, label: `${agent.name} (${UI_TEXT.getAgentTypeDisplay(agent.agentType)})${agent.isDefault ? ` ${UI_TEXT.agentDefaultLabel}` : ''}` }))}
                    />
                    {currentAgent && (
                        <div className={`p-3 rounded-md text-xs ${theme === 'light' ? 'bg-secondary-100 text-secondary-700 border border-secondary-200' : 'bg-secondary-700 text-secondary-200 border border-secondary-600'}`}>
                            <p><strong>{UI_TEXT.agentDescriptionLabel}</strong> {currentAgent.description}</p>
                            {currentAgent.agentType !== 'interrogation' && currentAgent.conversationStarters && currentAgent.conversationStarters.length > 0 && (
                                <div className="mt-2">
                                    <strong>פותחי שיחה מוצעים:</strong>
                                    <ul className="list-disc pl-5 rtl:pr-5 rtl:pl-0">
                                        {currentAgent.conversationStarters.slice(0,3).map((starter, i) => <li key={i}>{starter}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
            break;
        case 'initial_setup_interrogatee_role':
            currentStepTitle = UI_TEXT.setupStepInterrogateeRole;
            nextButtonDisabled = !selectedRole;
            nextAction = () => setViewState('initial_setup_difficulty');
            backAction = () => setViewState('initial_setup_agent_selection');
            stepContent = (
                <Select
                    label={UI_TEXT.selectInterrogateeRole}
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as InterrogateeRole)}
                    options={[
                        { value: InterrogateeRole.SUSPECT, label: UI_TEXT.roleSuspect },
                        { value: InterrogateeRole.WITNESS, label: UI_TEXT.roleWitness },
                        { value: InterrogateeRole.VICTIM, label: UI_TEXT.roleVictim },
                    ]}
                />
            );
            break;
        case 'initial_setup_difficulty':
            currentStepTitle = UI_TEXT.setupStepDifficulty;
            nextButtonDisabled = !selectedDifficulty;
            nextAction = () => setViewState('initial_setup_topic');
            backAction = () => setViewState('initial_setup_interrogatee_role');
            stepContent = (
                <Select
                    label={UI_TEXT.selectDifficulty}
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value as DifficultyLevel)}
                    options={[
                        { value: DifficultyLevel.EASY, label: UI_TEXT.difficultyEasy },
                        { value: DifficultyLevel.MEDIUM, label: UI_TEXT.difficultyMedium },
                        { value: DifficultyLevel.HARD, label: UI_TEXT.difficultyHard },
                    ]}
                />
            );
            break;
        case 'initial_setup_topic':
            currentStepTitle = UI_TEXT.setupStepTopic;
            nextButtonDisabled = !selectedTopic && !customTopic.trim();
            nextAction = () => setViewState('initial_setup_review');
            backAction = () => setViewState('initial_setup_difficulty');
            stepContent = (
                <div className="space-y-4">
                    <Select
                        label={UI_TEXT.selectTopic}
                        value={selectedTopic}
                        onChange={e => { setSelectedTopic(e.target.value); if (e.target.value) setCustomTopic(''); }}
                        options={PREDEFINED_INVESTIGATION_TOPICS.map(topic => ({ value: topic, label: topic }))}
                        defaultEmptyOption={UI_TEXT.topicPlaceholder}
                    />
                    <Input
                        label={UI_TEXT.customTopicLabel}
                        value={customTopic}
                        onChange={e => { setCustomTopic(e.target.value); if (e.target.value.trim()) setSelectedTopic(''); }}
                        placeholder={UI_TEXT.topicPlaceholder}
                    />
                </div>
            );
            break;
        case 'initial_setup_review':
            const agentForReview = availableAgents.find(a => a.id === selectedAgentId);
            currentStepTitle = UI_TEXT.setupStepReview;
            nextAction = handleGenerateScenario;
            backAction = () => {
                if (agentForReview?.agentType === 'interrogation') {
                    setViewState('initial_setup_topic');
                } else {
                    setViewState('initial_setup_agent_selection');
                }
            };
            stepContent = (
                <div className={`space-y-3 p-4 rounded-md text-sm ${theme === 'light' ? 'bg-secondary-50 border border-secondary-200' : 'themed-bg-accent themed-border'}`}>
                    <p><strong>{UI_TEXT.reviewSelectedAgentLabel}</strong> {agentForReview?.name || UI_TEXT.noDataAvailable}</p>
                    {agentForReview?.agentType === 'interrogation' && (
                        <>
                            <p><strong>{UI_TEXT.reviewSelectedRoleLabel}</strong> {selectedRole || UI_TEXT.noDataAvailable}</p>
                            <p><strong>{UI_TEXT.reviewSelectedDifficultyLabel}</strong> {selectedDifficulty || UI_TEXT.noDataAvailable}</p>
                            <p><strong>{UI_TEXT.reviewSelectedTopicLabel}</strong> {customTopic.trim() || selectedTopic || UI_TEXT.noDataAvailable}</p>
                        </>
                    )}
                     {agentForReview?.agentType !== 'interrogation' && (
                        <p><strong>תיאור הסוכן:</strong> {agentForReview?.description || UI_TEXT.noDataAvailable}</p>
                    )}
                </div>
            );
            break;
    }

    return (
        <div className={baseCardClass}>
            <h2 className={titleClass}>{currentStepTitle}</h2>
            {error && <p className="text-red-500 text-sm mb-4 text-center" role="alert">{error}</p>}
            {stepContent}
            <div className={`mt-8 flex ${viewState === 'initial_setup_agent_selection' ? 'justify-center' : 'justify-between'}`}>
                {viewState !== 'initial_setup_agent_selection' && (
                    <Button variant="secondary" onClick={backAction}>{UI_TEXT.backButton}</Button>
                )}
                <Button onClick={nextAction} disabled={nextButtonDisabled}>
                    {viewState === 'initial_setup_review' ? UI_TEXT.generateScenarioButton : UI_TEXT.nextButton}
                </Button>
            </div>
        </div>
    );
  };

  const renderGeneratingScenario = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <LoadingSpinner message={UI_TEXT.generatingScenario} size="lg"/>
    </div>
  );

  const renderScenarioReady = () => {
    if (!currentScenario) return renderErrorWithMessage(UI_TEXT.noScenario);
    const isInterrogationAgent = currentScenario.agentType === 'interrogation';
    const title = isInterrogationAgent ? UI_TEXT.caseDetails : UI_TEXT.agentDetails;
    const profileTitle = isInterrogationAgent ? UI_TEXT.interrogateeProfileTitle : UI_TEXT.appName; // Generic for agent
    const startButtonText = isInterrogationAgent ? UI_TEXT.startInvestigationCall : UI_TEXT.startSessionCall;

    return (
        <div className={`p-4 sm:p-6 rounded-xl shadow-xl max-w-2xl mx-auto ${theme === 'light' ? 'bg-white border border-secondary-200' : 'themed-card'}`}>
            <h2 className={`text-2xl font-semibold mb-2 text-center ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`}>{title}</h2>
             <p className={`text-sm text-center mb-6 ${theme === 'light' ? 'text-secondary-600' : 'text-secondary-400'}`}>
                {isInterrogationAgent
                    ? `נושא: ${currentScenario.userSelectedTopic}, רמה: ${currentScenario.userSelectedDifficulty}`
                    : `סוכן: ${currentScenario.caseType}`
                }
            </p>
            
            <div className="space-y-4 text-sm">
                <div className={`p-3 rounded-md ${theme === 'light' ? 'bg-secondary-50 border border-secondary-200' : 'themed-bg-accent themed-border'}`}>
                    <h3 className={`font-semibold mb-1 ${theme === 'light' ? 'text-secondary-800' : 'text-secondary-100'}`}>{isInterrogationAgent ? UI_TEXT.caseTypeLabel : "שם הסוכן"}:</h3>
                    <p>{currentScenario.caseType}</p>
                </div>
                <div className={`p-3 rounded-md ${theme === 'light' ? 'bg-secondary-50 border border-secondary-200' : 'themed-bg-accent themed-border'}`}>
                    <h3 className={`font-semibold mb-1 ${theme === 'light' ? 'text-secondary-800' : 'text-secondary-100'}`}>{isInterrogationAgent ? UI_TEXT.fullCaseDescriptionLabel : "תיאור הסוכן"}:</h3>
                    <p className="whitespace-pre-wrap">{currentScenario.fullCaseDescription}</p>
                </div>
                 {isInterrogationAgent && currentScenario.interrogateeProfile && (
                    <div className={`p-3 rounded-md ${theme === 'light' ? 'bg-secondary-50 border border-secondary-200' : 'themed-bg-accent themed-border'}`}>
                        <h3 className={`font-semibold mb-1 ${theme === 'light' ? 'text-secondary-800' : 'text-secondary-100'}`}>{profileTitle}:</h3>
                        <p><strong>{UI_TEXT.profileNameLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).name}</p>
                        <p><strong>{UI_TEXT.profileAgeLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).age}</p>
                        <p><strong>{UI_TEXT.profileOccupationLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).occupation}</p>
                        {/* More profile details can be added here if needed, like address, etc. */}
                    </div>
                )}
                 {currentScenario.investigationGoals && currentScenario.investigationGoals.length > 0 && (
                    <div className={`p-3 rounded-md ${theme === 'light' ? 'bg-secondary-50 border border-secondary-200' : 'themed-bg-accent themed-border'}`}>
                        <h3 className={`font-semibold mb-1 ${theme === 'light' ? 'text-secondary-800' : 'text-secondary-100'}`}>{UI_TEXT.investigationGoalsTitle}</h3>
                        <ul className="list-disc list-inside pl-4 rtl:pr-4 rtl:pl-0">
                            {currentScenario.investigationGoals.map((goal, index) => <li key={index}>{goal}</li>)}
                        </ul>
                    </div>
                )}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 rtl:sm:space-x-reverse">
                <Button onClick={handleStartInvestigation} size="lg" className="w-full sm:w-auto">{startButtonText}</Button>
                <Button variant="secondary" onClick={resetSetup} size="lg" className="w-full sm:w-auto">{UI_TEXT.backToDashboard}</Button>
            </div>
        </div>
    );
  };

  const renderInvestigationActive = () => {
    if (!currentScenario) return renderErrorWithMessage(UI_TEXT.noScenario);
    const isInterrogationAgent = currentScenario.agentType === 'interrogation';
    const dynamicChatTitle = isInterrogationAgent 
        ? UI_TEXT.chatWithInterrogateeDynamic((currentScenario.interrogateeProfile as SuspectProfile).name || currentScenario.interrogateeRole, true)
        : UI_TEXT.chatWithAgentDynamic(currentScenario.caseType);

    const mainPanelClasses = `flex-1 flex flex-col overflow-hidden rounded-xl shadow-lg ${theme === 'light' ? 'bg-white border border-secondary-200' : 'themed-card'}`;
    const headerClasses = `p-3 border-b ${theme === 'light' ? 'bg-secondary-50 border-secondary-200' : 'themed-bg-accent themed-border'}`;
    const chatAreaClasses = `flex-1 overflow-y-auto p-3 space-y-3`;
    const inputAreaClasses = `p-3 border-t ${theme === 'light' ? 'bg-secondary-50 border-secondary-200' : 'themed-bg-accent themed-border'}`;

    const infoPanelClasses = `w-full lg:w-1/3 xl:w-1/4 p-4 rounded-xl shadow-lg space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] ${theme === 'light' ? 'bg-white border border-secondary-200' : 'themed-card'}`;
    const infoTitleClass = `text-md font-semibold ${theme === 'light' ? 'text-primary-600' : 'text-primary-400'}`;
    const infoSectionClass = `p-2 rounded-md text-xs ${theme === 'light' ? 'bg-secondary-100 border border-secondary-200' : 'bg-secondary-700 bg-opacity-50 border border-secondary-600'}`;
    
    return (
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-150px)] sm:h-[calc(100vh-180px)]">
            <div className={mainPanelClasses}>
                <header className={headerClasses}>
                    <div className="flex justify-between items-center">
                        <h2 className={`text-lg font-semibold ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`}>{dynamicChatTitle}</h2>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                             <ToggleSwitch 
                                id="live-audio-toggle" 
                                label={UI_TEXT.featureLiveAudioToggleLabel} 
                                checked={userWantsLiveAudio} 
                                onChange={handleToggleLiveAudio} 
                                title={UI_TEXT.featureLiveAudioToggleLabel}
                                labelClassName='text-xs'
                            />
                            {currentScenario.agentType === 'interrogation' &&
                                <Button variant="ghost" size="sm" onClick={handleRequestHint} icon={<HintIcon />} isLoading={viewState === 'generating_hint'} disabled={viewState === 'generating_hint'}>
                                    {UI_TEXT.requestHintButton}
                                </Button>
                            }
                        </div>
                    </div>
                     {userWantsLiveAudio && (
                        <p className={`text-xs mt-1 ${liveAudioError ? 'text-red-500' : (theme === 'light' ? 'text-green-600' : 'text-green-400')}`}>
                            {liveAudioError || UI_TEXT.featureLiveAudioVisualizerStatus(liveAudioVisualState)}
                        </p>
                    )}
                </header>

                <div className={chatAreaClasses} role="log" aria-live="polite">
                    {chatMessages.map(msg => <ChatBubble key={msg.id} message={msg} theme={theme} />)}
                    {isAiTyping && (
                        <div className="flex justify-start">
                             <div className={`px-4 py-3 rounded-xl max-w-xl shadow-md ${theme === 'light' ? 'bg-secondary-200 text-secondary-800' : 'bg-secondary-700 text-secondary-100'}`}>
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <div className={`dot-pulse ${theme === 'light' ? 'bg-secondary-500' : 'bg-secondary-300'}`}></div>
                                    <div className={`dot-pulse delay-150 ${theme === 'light' ? 'bg-secondary-500' : 'bg-secondary-300'}`}></div>
                                    <div className={`dot-pulse delay-300 ${theme === 'light' ? 'bg-secondary-500' : 'bg-secondary-300'}`}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef}></div>
                </div>

                <div className={inputAreaClasses}>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {isSpeechApiSupported && (
                             <Button 
                                variant="ghost" 
                                onClick={handleToggleSpeechInput} 
                                disabled={isLiveAudioModeActive} 
                                title={isListening ? UI_TEXT.featureVoiceInputStop : UI_TEXT.featureVoiceInputStart}
                                className={isListening ? (theme === 'light' ? 'text-red-500 bg-red-100' : 'text-red-300 bg-red-700') : ''}
                            >
                                {isListening ? <MicListeningIcon /> : <MicIcon />}
                            </Button>
                        )}
                        <Input
                            type="text"
                            value={userInput}
                            onChange={handleUserInput}
                            onKeyPress={(e) => e.key === 'Enter' && !isLiveAudioModeActive && handleSendMessage()}
                            placeholder={isLiveAudioModeActive ? "שיחה קולית פעילה..." : UI_TEXT.typeYourMessage}
                            className="flex-grow"
                            disabled={isLiveAudioModeActive || isAiTyping || viewState === 'generating_hint'}
                            aria-label={UI_TEXT.typeYourMessage}
                        />
                        <Button onClick={handleSendMessage} disabled={isLiveAudioModeActive || !userInput.trim() || isAiTyping || viewState === 'generating_hint'} icon={<SendIcon />} title={UI_TEXT.sendMessage}>
                           {UI_TEXT.sendMessage}
                        </Button>
                    </div>
                </div>
            </div>

            <div className={infoPanelClasses}>
                <Button 
                    variant="danger" 
                    onClick={() => setShowEndConfirmModal(true)} 
                    className="w-full mb-3"
                    size="md"
                >
                    {isInterrogationAgent ? UI_TEXT.endInvestigationCall : UI_TEXT.endSessionCall}
                </Button>
                 <Button variant="secondary" onClick={() => setIsScenarioDetailsModalOpen(true)} className="w-full mb-3" size="sm">
                    {isInterrogationAgent ? UI_TEXT.showScenarioDetails : UI_TEXT.showAgentDetails}
                </Button>

                {isInterrogationAgent && (
                <>
                    <h3 className={infoTitleClass}>{UI_TEXT.interrogateeProfileTitle}</h3>
                    <div className={infoSectionClass}>
                        <p><strong>{UI_TEXT.profileNameLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).name}</p>
                        <p><strong>{UI_TEXT.profileAgeLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).age}</p>
                        <p><strong>{UI_TEXT.profileOccupationLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).occupation}</p>
                         {(currentScenario.interrogateeProfile as SuspectProfile).address && <p><strong>{UI_TEXT.profileAddressLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).address}</p>}
                    </div>
                    {(currentScenario.interrogateeProfile as SuspectProfile).criminalRecord?.details && (
                        <>
                            <h3 className={infoTitleClass}>{(currentScenario.interrogateeProfile as SuspectProfile).criminalRecord?.title || UI_TEXT.criminalRecordTitle}</h3>
                            <div className={infoSectionClass}>
                                <p>{(currentScenario.interrogateeProfile as SuspectProfile).criminalRecord?.details}</p>
                            </div>
                        </>
                    )}
                    {(currentScenario.interrogateeProfile as SuspectProfile).intel?.details && (
                         <>
                            <h3 className={infoTitleClass}>{(currentScenario.interrogateeProfile as SuspectProfile).intel?.title || UI_TEXT.intelTitle}</h3>
                            <div className={infoSectionClass}>
                                <p>{(currentScenario.interrogateeProfile as SuspectProfile).intel?.details}</p>
                            </div>
                        </>
                    )}
                    {currentScenario.evidence?.items[0] !== 'N/A' && (
                         <>
                            <h3 className={infoTitleClass}>{currentScenario.evidence.title || UI_TEXT.evidenceInHandTitle}</h3>
                            <div className={infoSectionClass}>
                                <ul className="list-disc list-inside pl-4 rtl:pr-4 rtl:pl-0">
                                    {currentScenario.evidence.items.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                        </>
                    )}
                </>
                )}
                 {!isInterrogationAgent && (
                    <>
                        <h3 className={infoTitleClass}>{UI_TEXT.agentDetails}</h3>
                        <div className={infoSectionClass}>
                            <p><strong>שם הסוכן:</strong> {currentScenario.caseType}</p>
                            <p><strong>תיאור:</strong> {currentScenario.fullCaseDescription}</p>
                        </div>
                    </>
                )}
                 {currentScenario.investigationGoals && currentScenario.investigationGoals.length > 0 && (
                    <>
                        <h3 className={infoTitleClass}>{UI_TEXT.investigationGoalsTitle}</h3>
                        <div className={infoSectionClass}>
                            <ul className="list-disc list-inside pl-4 rtl:pr-4 rtl:pl-0">
                                {currentScenario.investigationGoals.map((goal, index) => <li key={index}>{goal}</li>)}
                            </ul>
                        </div>
                    </>
                )}
                 {isInterrogationAgent && (
                    <div className="mt-4">
                        <h3 className={infoTitleClass}>{UI_TEXT.investigationLogTitle}</h3>
                        <div className="relative mb-2">
                             <Input 
                                type="text" 
                                value={investigationLogSearchTerm} 
                                onChange={handleInvestigationLogSearchTermChange} 
                                placeholder={UI_TEXT.investigationLogSearchPlaceholder}
                                className="pl-8 rtl:pr-8"
                                containerClassName="w-full"
                            />
                            <div className="absolute inset-y-0 left-2 rtl:right-2 rtl:left-auto flex items-center pointer-events-none">
                                <SearchIcon />
                            </div>
                        </div>
                        {investigationLogSearchTerm.trim() !== "" && <p className="text-xs mb-1">{UI_TEXT.investigationLogSearchResults(investigationLogSearchOccurrences)}</p>}
                        <textarea 
                            value={investigationLog}
                            onChange={(e) => setInvestigationLog(e.target.value)}
                            rows={6}
                            className={`w-full p-2 border rounded-md text-sm themed-input`}
                            placeholder="רשום כאן הערות, תובנות או שאלות להמשך..."
                        />
                        <Button variant="ghost" size="sm" onClick={() => setIsClearLogConfirmModalOpen(true)} className="mt-1 text-xs" icon={<ClearLogIcon />} disabled={!investigationLog.trim()}>
                            נקה יומן
                        </Button>
                    </div>
                 )}
            </div>
        </div>
    );
  };
  
  const renderGeneratingFeedback = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <LoadingSpinner message={UI_TEXT.generatingFeedback} size="lg"/>
    </div>
  );

  const renderFeedbackReady = () => {
    if (!currentSession || (!currentSession.feedback && currentScenario?.agentType === 'interrogation')) return renderErrorWithMessage(UI_TEXT.errorGeneratingFeedback);
    
    const cardClass = `p-4 sm:p-6 rounded-xl shadow-xl max-w-2xl mx-auto ${theme === 'light' ? 'bg-white border border-secondary-200' : 'themed-card'}`;
    const titleClass = `text-2xl font-semibold mb-6 text-center ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`;
    const sectionTitleClass = `text-lg font-semibold mt-4 mb-2 ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-200'}`;

    if (currentScenario?.agentType !== 'interrogation') {
        return (
            <div className={cardClass}>
                <h2 className={titleClass}>{UI_TEXT.sessionEndedNoFeedback}</h2>
                <p className="text-sm text-center mb-6">
                    הסשן עם הסוכן "{currentScenario.caseType}" הסתיים.
                </p>
                <Button onClick={resetSetup} className="w-full max-w-xs mx-auto block">{UI_TEXT.backToDashboard}</Button>
            </div>
        );
    }
    // Specific to interrogation feedback
    const feedback = currentSession.feedback!;

    return (
        <div className={`${cardClass} text-sm`}>
            <h2 className={titleClass}>{UI_TEXT.investigationFeedback}</h2>
            <div className={`p-4 rounded-md mb-6 text-center ${theme === 'light' ? 'bg-primary-50 border border-primary-200' : 'bg-primary-700 bg-opacity-30 border border-primary-600'}`}>
                <p className={`text-lg font-medium ${theme === 'light' ? 'text-primary-600' : 'text-primary-300'}`}>{UI_TEXT.overallScore}</p>
                <p className={`text-4xl font-bold ${theme === 'light' ? 'text-primary-700' : 'text-primary-200'}`}>{feedback.overallScore} / 10</p>
            </div>

            <div className={`p-3 rounded-md mb-4 ${theme === 'light' ? 'bg-secondary-50 border border-secondary-200' : 'themed-bg-accent themed-border'}`}>
                <h3 className={sectionTitleClass}>סיכום והמלצות</h3>
                <p className="whitespace-pre-wrap">{feedback.summary}</p>
            </div>

            {feedback.keyMoments && feedback.keyMoments.length > 0 && (
                 <div className={`p-3 rounded-md mb-4 ${theme === 'light' ? 'bg-secondary-50 border border-secondary-200' : 'themed-bg-accent themed-border'}`}>
                    <h3 className={sectionTitleClass}>{UI_TEXT.feedbackKeyMomentsTitle}</h3>
                    <ul className="list-disc list-inside space-y-1 pl-4 rtl:pr-4 rtl:pl-0">
                        {feedback.keyMoments.map((moment: KeyMoment, index: number) => (
                            <li key={index}>
                                <strong>{moment.momentDescription}:</strong> {moment.significance}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

             <div className={`p-3 rounded-md ${theme === 'light' ? 'bg-secondary-50 border border-secondary-200' : 'themed-bg-accent themed-border'}`}>
                <h3 className={sectionTitleClass}>הערכת פרמטרים</h3>
                <ul className="space-y-2">
                    {feedback.parameters.map((param, index) => (
                        <li key={index} className={`p-2 rounded ${theme === 'light' ? 'bg-white border border-secondary-100' : 'bg-secondary-700 border border-secondary-600'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold">{param.name}</span>
                                <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${param.score >= 7 ? (theme === 'light' ? 'bg-green-100 text-green-700' : 'bg-green-700 text-green-100') : param.score >= 4 ? (theme === 'light' ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-700 text-yellow-100') : (theme === 'light' ? 'bg-red-100 text-red-700' : 'bg-red-700 text-red-100')}`}>
                                    {param.score} / 10
                                </span>
                            </div>
                            <p className={`text-xs ${theme === 'light' ? 'text-secondary-600' : 'text-secondary-300'}`}>{param.evaluation}</p>
                        </li>
                    ))}
                </ul>
            </div>
            <Button onClick={resetSetup} className="w-full mt-8" size="lg">{UI_TEXT.backToDashboard}</Button>
        </div>
    );
  };

  const renderError = () => renderErrorWithMessage(error || "אירעה שגיאה לא צפויה.");
  const renderErrorWithMessage = (message: string) => (
    <div className={`p-6 rounded-xl shadow-xl max-w-md mx-auto text-center ${theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-900 bg-opacity-30 border border-red-700'}`}>
      <h2 className={`text-xl font-semibold mb-3 ${theme === 'light' ? 'text-red-700' : 'text-red-300'}`}>שגיאה</h2>
      <p className={`${theme === 'light' ? 'text-red-600' : 'text-red-200'} mb-6`}>{message}</p>
      <Button onClick={resetSetup} variant="danger">{UI_TEXT.backToDashboard}</Button>
    </div>
  );

  const renderScenarioDetailsModal = () => {
    if (!currentScenario) return null;
    const isInterrogationAgent = currentScenario.agentType === 'interrogation';

    return (
        <Modal 
            isOpen={isScenarioDetailsModalOpen} 
            onClose={() => setIsScenarioDetailsModalOpen(false)} 
            title={isInterrogationAgent ? UI_TEXT.scenarioDetails : UI_TEXT.agentDetails}
            size="xl"
        >
            <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto">
                <p><strong>{isInterrogationAgent ? UI_TEXT.caseTypeLabel : "שם הסוכן"}:</strong> {currentScenario.caseType}</p>
                <p><strong>{isInterrogationAgent ? UI_TEXT.fullCaseDescriptionLabel : "תיאור הסוכן"}:</strong> <span className="whitespace-pre-wrap">{currentScenario.fullCaseDescription}</span></p>
                {currentScenario.location && <p><strong>{UI_TEXT.locationLabel}:</strong> {currentScenario.location}</p>}
                {currentScenario.dateTime && <p><strong>{UI_TEXT.dateTimeLabel}:</strong> {currentScenario.dateTime}</p>}
                
                {isInterrogationAgent && currentScenario.interrogateeProfile && (
                    <>
                        <h4 className={`font-semibold mt-2 ${theme === 'light' ? 'text-primary-600' : 'text-primary-400'}`}>{UI_TEXT.interrogateeProfileTitle}</h4>
                        <div className={`p-2 rounded-md ${theme === 'light' ? 'bg-secondary-50 border border-secondary-100' : 'bg-secondary-700 border border-secondary-600'}`}>
                            <p><strong>{UI_TEXT.profileNameLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).name}</p>
                            <p><strong>{UI_TEXT.profileAgeLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).age}</p>
                            <p><strong>{UI_TEXT.profileOccupationLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).occupation}</p>
                            {(currentScenario.interrogateeProfile as SuspectProfile).address && <p><strong>{UI_TEXT.profileAddressLabel}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).address}</p>}
                            {(currentScenario.interrogateeProfile as SuspectProfile).criminalRecord?.details && <p><strong>{(currentScenario.interrogateeProfile as SuspectProfile).criminalRecord?.title}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).criminalRecord?.details}</p>}
                            {(currentScenario.interrogateeProfile as SuspectProfile).intel?.details && <p><strong>{(currentScenario.interrogateeProfile as SuspectProfile).intel?.title}:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).intel?.details}</p>}
                            {(currentScenario.interrogateeProfile as SuspectProfile).victimDetails && <p><strong>{UI_TEXT.victimDetailsTitle}</strong> {(currentScenario.interrogateeProfile as SuspectProfile).victimDetails}</p>}
                            {(currentScenario.interrogateeProfile as SuspectProfile).witnessDetails && <p><strong>{UI_TEXT.witnessDetailsTitle}</strong> {(currentScenario.interrogateeProfile as SuspectProfile).witnessDetails}</p>}
                            {(currentScenario.interrogateeProfile as SuspectProfile).underlyingMotivation && <p><strong>מניע נסתר:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).underlyingMotivation}</p>}
                            {(currentScenario.interrogateeProfile as SuspectProfile).behavioralDynamics?.potentialShifts && <p><strong>שינויי התנהגות אפשריים:</strong> {(currentScenario.interrogateeProfile as SuspectProfile).behavioralDynamics?.potentialShifts}</p>}
                            {(currentScenario.interrogateeProfile as SuspectProfile).behavioralDynamics?.hiddenTruths && ((currentScenario.interrogateeProfile as SuspectProfile).behavioralDynamics?.hiddenTruths?.length || 0) > 0 && 
                                <p><strong>אמיתות נסתרות:</strong> {((currentScenario.interrogateeProfile as SuspectProfile).behavioralDynamics?.hiddenTruths || []).join('; ')}</p>}
                        </div>
                    </>
                )}
                {currentScenario.evidence?.items[0] !== 'N/A' && (
                     <>
                        <h4 className={`font-semibold mt-2 ${theme === 'light' ? 'text-primary-600' : 'text-primary-400'}`}>{currentScenario.evidence.title || UI_TEXT.evidenceItemsTitle}</h4>
                         <div className={`p-2 rounded-md ${theme === 'light' ? 'bg-secondary-50 border border-secondary-100' : 'bg-secondary-700 border border-secondary-600'}`}>
                            <ul className="list-disc list-inside pl-4 rtl:pr-4 rtl:pl-0">
                                {currentScenario.evidence.items.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </>
                )}
                {currentScenario.fullSystemPromptForChat && (
                    <>
                        <h4 className={`font-semibold mt-2 ${theme === 'light' ? 'text-primary-600' : 'text-primary-400'}`}>{UI_TEXT.systemPromptLabel}</h4>
                         <div className={`p-2 rounded-md text-xs max-h-40 overflow-y-auto ${theme === 'light' ? 'bg-secondary-50 border border-secondary-100' : 'bg-secondary-700 border border-secondary-600'}`}>
                            <pre className="whitespace-pre-wrap">{currentScenario.fullSystemPromptForChat}</pre>
                        </div>
                    </>
                )}
            </div>
            <div className="mt-4 flex justify-end">
                <Button onClick={() => setIsScenarioDetailsModalOpen(false)}>{UI_TEXT.closeButton}</Button>
            </div>
        </Modal>
    );
  };
  
  const renderEndConfirmModal = () => {
    if (!currentScenario) return null;
    const confirmMessage = currentScenario.agentType === 'interrogation' ? UI_TEXT.confirmEndInvestigation : UI_TEXT.confirmEndSession;
    return (
        <Modal isOpen={showEndConfirmModal} onClose={() => setShowEndConfirmModal(false)} title={confirmMessage}>
            <p className="text-sm">
                {confirmMessage}
            </p>
            <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                <Button variant="secondary" onClick={() => setShowEndConfirmModal(false)}>{UI_TEXT.cancel}</Button>
                <Button variant="danger" onClick={handleEndInvestigation}>{UI_TEXT.yes}</Button>
            </div>
        </Modal>
    );
  };

  const renderClearLogConfirmModal = () => (
    <Modal isOpen={isClearLogConfirmModalOpen} onClose={() => setIsClearLogConfirmModalOpen(false)} title={UI_TEXT.confirmClearLogTitle}>
        <p className="text-sm">{UI_TEXT.confirmClearLogMessage}</p>
        <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
            <Button variant="secondary" onClick={() => setIsClearLogConfirmModalOpen(false)}>{UI_TEXT.cancel}</Button>
            <Button variant="danger" onClick={handleClearLog}>{UI_TEXT.delete}</Button>
        </div>
    </Modal>
  );

  const renderCurrentView = () => {
    switch (viewState) {
      case 'initial_setup_agent_selection':
      case 'initial_setup_interrogatee_role':
      case 'initial_setup_difficulty':
      case 'initial_setup_topic':
      case 'initial_setup_review':
        return renderInitialSetup();
      case 'generating_scenario':
        return renderGeneratingScenario();
      case 'scenario_ready':
        return renderScenarioReady();
      case 'investigation_active':
      case 'generating_hint': // generating_hint state will show loading within investigation_active
        return renderInvestigationActive();
      case 'generating_feedback':
        return renderGeneratingFeedback();
      case 'feedback_ready':
        return renderFeedbackReady();
      case 'error':
        return renderError();
      default:
        return <div className="text-center p-8">טוען או מצב לא ידוע...</div>;
    }
  };

  return (
    <div className={`p-1 sm:p-2 md:p-4 trainee-view ${theme === 'light' ? 'bg-secondary-100' : 'bg-secondary-900'} min-h-[calc(100vh-64px)]`} dir="rtl">
      {renderScenarioDetailsModal()}
      {renderEndConfirmModal()}
      {renderClearLogConfirmModal()}
      
      {renderCurrentView()}

      <gdm-live-audio ref={liveAudioElementRef} style={{ display: 'none' }}></gdm-live-audio>
      {userWantsLiveAudio && (
        <gdm-live-audio-visuals-3d
          ref={visuals3dRef}
          inputNode={inputAudioNodeForVisualizer}
          outputNode={outputAudioNodeForVisualizer}
          currentAvatarExpression={currentAvatarDirectives?.avatarExpression}
          currentAvatarGesture={currentAvatarDirectives?.avatarGesture}
        >
        </gdm-live-audio-visuals-3d>
      )}
    </div>
  );
};

export default TraineeView;
