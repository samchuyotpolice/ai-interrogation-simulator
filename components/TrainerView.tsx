
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    MockTrainee, Scenario, InvestigationSession, UserRole, InterrogateeRole, DifficultyLevel, User,
    UserCommand, UserCommandType, ForceEmotionalStatePayload, RevealSpecificInfoHintPayload, SendWhisperPayload, AIAgent, LoadedAIAgent,
    Feedback, AIAgentType, Theme, TrainerCommandLogEntry, SuspectProfile, AIAgentTypeValues,
    ChatMessage, ChatMessageSubType,
    GeminiJsonSuspectProfile,
    GeminiJsonScenario,
    PREDEFINED_INVESTIGATION_TOPICS,
    InterruptionType, InterruptionTypeDisplay, TriggerInterruptionPayload, InitialSelections, KeyMoment,
    ToolName // Import ToolName directly
} from '../types';
import { UI_TEXT, MOCK_TRAINEES_DATA, loadAiAgents, DEFAULT_AGENT_ID, DEFAULT_AGENT_BASE_PROMPT_STORAGE_KEY, CUSTOM_AGENTS_STORAGE_KEY, MANUAL_SCENARIOS_STORAGE_KEY, GEMINI_MODEL_TEXT } from '../constants';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import Select from './common/Select';
import * as GeminiService from '../services/GeminiService';
import type { AgentConfigGenerationResult } from '../services/GeminiService';
import ChatBubble from './ChatBubble';
import LoadingSpinner from './common/LoadingSpinner';
import ToggleSwitch from './common/ToggleSwitch';

// --- SVG Icons ---
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.98 9.98 0 0010 18a9.98 9.98 0 006.125-2.095 1.23 1.23 0 00.41-1.412A3.938 3.938 0 0013.25 12.5H6.75a3.938 3.938 0 00-3.285 1.993z" /></svg>;
const ProgressIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const InterventionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.25 12A2.25 2.25 0 007.5 9.75h5A2.25 2.25 0 0014.75 12v.75H5.25v-.75zM8.277 3.53a.75.75 0 00-1.054-.011L4.012 6.25H3.75A2.25 2.25 0 001.5 8.5v3.75A2.25 2.25 0 003.75 14.5h12.5A2.25 2.25 0 0018.5 12.25V8.5A2.25 2.25 0 0016.25 6.25h-.262l-3.21-2.732a.75.75 0 00-1.055.012L10 5.372 8.277 3.53z" /></svg>;
const AgentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9.043 2.543a.75.75 0 01.914 0l1.25 1.042a.75.75 0 01.127.359V5.5a.75.75 0 01-1.5 0V4.836l-.586.487a.75.75 0 01-.914 0l-.586-.487V5.5a.75.75 0 01-1.5 0V3.944a.75.75 0 01.127-.359L9.043 2.543zM3.25 5.5a.75.75 0 000 1.5h.043L3.75 8H3a.75.75 0 000 1.5h.75l-.457 1a.75.75 0 000 1.5H3a.75.75 0 000 1.5h.75A2.25 2.25 0 006 15.75v1.5a.75.75 0 001.5 0v-1.5a2.25 2.25 0 002.25-2.25h1.5A2.25 2.25 0 0013.5 15.75v1.5a.75.75 0 001.5 0v-1.5a2.25 2.25 0 002.25-2.25h.75a.75.75 0 000-1.5h-.257l-.457-1h.757a.75.75 0 000-1.5H16.25l.457-1H16.75a.75.75 0 000-1.5h-.043L16.25 8H17a.75.75 0 000-1.5h-.75A2.25 2.25 0 0014 4.25V2.75a.75.75 0 00-1.5 0V4.25a2.25 2.25 0 00-2.25 2.25H9A2.25 2.25 0 006.75 4.25V2.75a.75.75 0 00-1.5 0V4.25A2.25 2.25 0 003 6.25H2.25a.75.75 0 000-1.5h.75l.457-1H2.25zM12.75 8a.75.75 0 000 1.5h.043L12.75 11H13.5a.75.75 0 000-1.5h-.707l.043-1H12.75zM7.25 8a.75.75 0 000 1.5h.707l-.043 1H6.5a.75.75 0 000 1.5h.043L6.5 11H7.25a.75.75 0 000-1.5H6.543l.043-1H7.25z" /></svg>;
const ScenariosIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm9.5 4.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-3 0a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-5.25.75a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V6.75zm1.5 2.25a.75.75 0 00-1.5 0v.01a.75.75 0 001.5 0V9z" clipRule="evenodd" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.078 2.25c-.217 0-.424.032-.622.092L6.07 3.511a.75.75 0 01-.577.132l-1.686.47A.75.75 0 003 4.757V6.16a.75.75 0 00.223.53l1.74 1.896a.75.75 0 00.528.223l1.896.002a.75.75 0 00.531-.223l1.74-1.896A.75.75 0 0011.002 6.16V4.757a.75.75 0 00-.638-.732l-1.686-.47a.75.75 0 01-.577-.132l-1.383-.784A4.126 4.126 0 0111.078 2.25zM10 12a.75.75 0 00-1.295-.495l-3.368 4.123A.75.75 0 005.874 17h8.252a.75.75 0 00.539-1.267l-3.368-4.123A.75.75 0 0010 12zM12.232 4.282a.75.75 0 011.06 0l4.343 4.343a.75.75 0 11-1.06 1.06l-4.343-4.343a.75.75 0 010-1.06zm-4.463 0a.75.75 0 010 1.06L3.426 9.685a.75.75 0 01-1.06-1.06l4.343-4.343a.75.75 0 011.061 0z" clipRule="evenodd" /></svg>;
const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.177-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1H8.75zM10 4.5a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V5.25A.75.75 0 0110 4.5z" clipRule="evenodd" /></svg>;
const ViewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const CloneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M7 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H7zM3 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2zM17 7a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V7z" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.5 13.5A1.5 1.5 0 017 15h6a1.5 1.5 0 010 3H7a1.5 1.5 0 01-1.5-1.5V13.5z" /><path fillRule="evenodd" d="M13.293 2.707a1 1 0 010 1.414L7.414 10.001H14a1 1 0 110 2H5a1 1 0 01-1-1V3.414l5.879-5.879a1 1 0 011.414 0l3 3z" clipRule="evenodd" /></svg>;
const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.323 11.25a.75.75 0 010-1.06l1.403-1.403a.75.75 0 00-1.06-1.06l-1.403 1.403a.75.75 0 11-1.06-1.06l1.403-1.403a.75.75 0 00-1.06-1.06l-1.403 1.403a.75.75 0 11-1.06-1.06l1.403-1.403a.75.75 0 00-1.06-1.06L9.68 3.597a.75.75 0 10-1.06 1.06l1.403 1.403a.75.75 0 11-1.06 1.06L7.56 5.717a.75.75 0 00-1.06 1.06l1.403 1.403a.75.75 0 11-1.06 1.06L5.44 7.837a.75.75 0 10-1.06 1.06l1.403 1.403a.75.75 0 010 1.06l-2.074 2.074a.75.75 0 001.06 1.06L6.84 12.36a2.625 2.625 0 003.712 0l2.073 2.074a.75.75 0 001.06-1.06l-2.073-2.074a2.625 2.625 0 000-3.712l2.073-2.074a.75.75 0 001.06 1.06l-1.403 1.403zM10 16.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 2c-4.418 0-8 3.134-8 7s3.582 7 8 7c.286 0 .565-.02.84-.058l1.465 1.465A.75.75 0 0013.25 18V16.3a.75.75 0 00-.472-.696A6.967 6.967 0 0010 16c-3.866 0-7-2.686-7-6s3.134-6 7-6c3.866 0 7 2.686 7 6 0 1.22-.382 2.34-.993 3.321a.75.75 0 00-.27.525v2.586a.75.75 0 001.28.53l.363-.363.003-.002.016-.016.02-.02.008-.008.006-.006.002-.002.001-.001c.216-.201.403-.42.57-.655A8.966 8.966 0 0018 9c0-3.866-3.582-7-8-7z" clipRule="evenodd" /></svg>;
const LogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 2a.75.75 0 01.75.75v1.5H13.5a.75.75 0 010 1.5H6.75v1.5H13.5a.75.75 0 010 1.5H6.75v1.5H13.5a.75.75 0 010 1.5H6.75V17A.75.75 0 016 17.75H2.25A.75.75 0 011.5 17V2.75A.75.75 0 012.25 2H6zm8.25.75V11.5h1.5V2.75a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75z" clipRule="evenodd" /></svg>;
const AIAssistantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9.816 4.721a.75.75 0 01.006 1.059L5.95 9.25h11.8a.75.75 0 010 1.5H5.95l3.873 3.47a.75.75 0 11-1.007 1.118l-5.25-4.706a.75.75 0 010-1.118l5.25-4.706a.75.75 0 011.001-.06z" /><path d="M12.75 5.5a.75.75 0 000-1.5H6.5a.75.75 0 000 1.5h6.25zM4.75 10a.75.75 0 000-1.5H1.5a.75.75 0 000 1.5h3.25zM12.75 14.5a.75.75 0 000-1.5H6.5a.75.75 0 000 1.5h6.25z" /></svg>; // Placeholder, better icon needed
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const EyeSlashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.72-1.72A10.004 10.004 0 0010 17c-4.257 0-7.893-2.66-9.336-6.41a1.65 1.65 0 010-1.18c.241-.65.578-1.256 1-1.797L3.28 2.22zM10 6.5A3.5 3.5 0 0113.5 10c0 .604-.158 1.168-.43 1.656l-1.59-1.59A3.504 3.504 0 0110 6.5z" /><path fillRule="evenodd" d="M10 3a10.004 10.004 0 00-9.336 6.41.147.38.147.805 0 1.186A10.003 10.003 0 007.4 14.1l1.547-1.547A5.004 5.004 0 015 10c0-1.73.872-3.243 2.193-4.141L5.803 4.47A9.954 9.954 0 002.583 6.94 9.962 9.962 0 0010 3z" clipRule="evenodd" /></svg>;

interface TrainerViewProps {
  currentTrainer: User;
  theme: Theme;
}

type TrainerActiveTab = 'userManagement' | 'traineeProgress' | 'liveIntervention' | 'aiAgentManagement' | 'manualScenarioBuilder' | 'systemSettings';

type AgentModalTab = 'settings' | 'assistant' | 'knowledge' | 'starters' | 'capabilities' | 'actions';
const AGENT_MODAL_TABS_ORDER: AgentModalTab[] = ['settings', 'assistant', 'knowledge', 'starters', 'capabilities', 'actions'];


const initialUserFormData: Partial<MockTrainee> = { name: '', email: '', password: '', role: UserRole.TRAINEE };
const initialAgentFormData: Partial<AIAgent> = {
    id: '', name: '', description: '', baseSystemPrompt: '', personalityTraits: [], agentType: 'custom_task',
    conversationStarters: [], recommendedModel: '', 
    capabilities: { webSearch: false, imageGeneration: false, toolUsage: true } // Ensure all fields present
};
const initialScenarioFormData: Partial<Scenario> & {
    interrogateeProfile_name?: string;
    interrogateeProfile_age?: string; // Keep as string for input, parse later
    interrogateeProfile_occupation?: string;
    evidence_items_string?: string; // For textarea input
    investigationGoals_string?: string;
} = {
    caseType: '', fullCaseDescription: '', interrogateeRole: InterrogateeRole.SUSPECT, userSelectedDifficulty: DifficultyLevel.MEDIUM, userSelectedTopic: '',
    interrogateeProfile_name: '', interrogateeProfile_age: '', interrogateeProfile_occupation: '', evidence_items_string: '', investigationGoals_string: '',
    isManuallyCreated: true, agentType: 'interrogation' // Default for manual scenario is interrogation
};


const TrainerView: React.FC<TrainerViewProps> = ({ currentTrainer, theme }) => {
  const [activeTab, setActiveTab] = useState<TrainerActiveTab>('userManagement');
  const [users, setUsers] = useState<MockTrainee[]>([]);
  const [aiAgents, setAiAgents] = useState<LoadedAIAgent[]>([]);
  const [manualScenarios, setManualScenarios] = useState<Scenario[]>([]);
  const [defaultAgentPromptOverride, setDefaultAgentPromptOverride] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // User Management Modals & State
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [userFormData, setUserFormData] = useState<Partial<MockTrainee>>(initialUserFormData);
  const [editingUser, setEditingUser] = useState<MockTrainee | null>(null);
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Agent Management Modals & State
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
  const [agentModalTab, setAgentModalTab] = useState<AgentModalTab>('settings');
  const [agentFormData, setAgentFormData] = useState<Partial<AIAgent>>(initialAgentFormData);
  const [editingAgent, setEditingAgent] = useState<LoadedAIAgent | null>(null);
  const [aiAssistantDescription, setAiAssistantDescription] = useState<string>('');
  const [aiAssistantSuggestions, setAiAssistantSuggestions] = useState<AgentConfigGenerationResult | null>(null);
  const [aiAssistantRefinement, setAiAssistantRefinement] = useState<string>('');
  const [isAgentPromptModalOpen, setIsAgentPromptModalOpen] = useState<boolean>(false);
  const [viewingAgentPrompt, setViewingAgentPrompt] = useState<string>('');
  
  // Manual Scenario Modals & State
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [scenarioFormData, setScenarioFormData] = useState(initialScenarioFormData);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);

  // Deletion Confirmation Modal
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'user' | 'agent' | 'scenario' } | null>(null);

  // Trainee Progress
  const [traineeSessions, setTraineeSessions] = useState<InvestigationSession[]>([]);
  const [selectedSessionForFeedback, setSelectedSessionForFeedback] = useState<InvestigationSession | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [filterTraineeId, setFilterTraineeId] = useState<string>('all');
  
  // Live Intervention
  const [activeInterventionSessionId, setActiveInterventionSessionId] = useState<string | null>(null); // Mocked for now
  const [interventionChatMessages, setInterventionChatMessages] = useState<ChatMessage[]>([]);
  const [trainerCommandLog, setTrainerCommandLog] = useState<TrainerCommandLogEntry[]>([]);
  const [interventionCommandType, setInterventionCommandType] = useState<UserCommandType | ''>('');
  const [interventionPayload, setInterventionPayload] = useState<string>('');
  const [interruptionType, setInterruptionType] = useState<InterruptionType>(InterruptionType.PHONE_CALL);
  const [interruptionDetails, setInterruptionDetails] = useState<string>('');


  const isSystemAdmin = currentTrainer.role === UserRole.SYSTEM_ADMIN;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [interventionChatMessages]);

  const loadUsers = useCallback(() => {
    const storedUsers = localStorage.getItem('app_all_trainees_data');
    try {
        const parsedUsers = storedUsers ? JSON.parse(storedUsers) : MOCK_TRAINEES_DATA;
        if (Array.isArray(parsedUsers)) {
             setUsers(parsedUsers.map((u: any) => ({
                ...u,
                sessions: Array.isArray(u.sessions) ? u.sessions : []
            })));
        } else {
            console.warn("'app_all_trainees_data' was not an array, resetting to MOCK_TRAINEES_DATA.");
            setUsers(MOCK_TRAINEES_DATA.map(u => ({...u, sessions: u.sessions || []})));
            localStorage.setItem('app_all_trainees_data', JSON.stringify(MOCK_TRAINEES_DATA));
        }
    } catch (e) {
        console.error("Error parsing users from localStorage, using MOCK_TRAINEES_DATA:", e);
        setUsers(MOCK_TRAINEES_DATA.map(u => ({...u, sessions: u.sessions || []})));
    }
  }, []);

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    try {
        const agents = await loadAiAgents();
        setAiAgents(agents);
        const defaultPrompt = localStorage.getItem(DEFAULT_AGENT_BASE_PROMPT_STORAGE_KEY);
        if (defaultPrompt) {
            setDefaultAgentPromptOverride(defaultPrompt);
        } else {
            const defaultAgentFromFile = agents.find(a => a.id === DEFAULT_AGENT_ID && a.isDefault);
            setDefaultAgentPromptOverride(defaultAgentFromFile?.baseSystemPrompt || '');
        }
    } catch (e) {
        setError(UI_TEXT.errorLoadingData + ` (סוכנים): ${(e as Error).message}`);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const loadManualScenarios = useCallback(() => {
    const storedScenarios = localStorage.getItem(MANUAL_SCENARIOS_STORAGE_KEY);
    try {
        const parsedScenarios = storedScenarios ? JSON.parse(storedScenarios) : [];
        if (Array.isArray(parsedScenarios)) {
            setManualScenarios(parsedScenarios);
        } else {
            console.warn(`'${MANUAL_SCENARIOS_STORAGE_KEY}' from localStorage is not an array. Initializing as empty.`);
            setManualScenarios([]);
            localStorage.setItem(MANUAL_SCENARIOS_STORAGE_KEY, JSON.stringify([]));
        }
    } catch (e) {
        console.error(`Error parsing '${MANUAL_SCENARIOS_STORAGE_KEY}' from localStorage:`, e);
        setManualScenarios([]);
    }
  }, []);

  useEffect(() => {
    if (isSystemAdmin) { // Only load these if admin
      loadUsers();
      loadAgents();
      loadManualScenarios();
    }
    // Load trainee sessions for progress tab for all trainers/admins
    const allStoredUsers = localStorage.getItem('app_all_trainees_data');
    let allSessions: InvestigationSession[] = [];
    if (allStoredUsers) {
        try {
            const parsed = JSON.parse(allStoredUsers) as MockTrainee[];
            if (Array.isArray(parsed)) {
                parsed.forEach(user => {
                    if (user.sessions && Array.isArray(user.sessions)) {
                        allSessions = allSessions.concat(user.sessions.filter(s => s.status === 'completed'));
                    }
                });
            }
        } catch (e) { console.error("Error loading trainee sessions for progress:", e); }
    }
    setTraineeSessions(allSessions.sort((a,b) => (b.endTime || 0) - (a.endTime || 0)));

  }, [loadUsers, loadAgents, loadManualScenarios, isSystemAdmin]);

  const saveUsersToStorage = (updatedUsers: MockTrainee[]) => {
    localStorage.setItem('app_all_trainees_data', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };
  
  const saveCustomAgentsToStorage = (updatedAgents: LoadedAIAgent[]) => {
    const customAgentsToStore = updatedAgents.filter(agent => !agent.isDefault);
    localStorage.setItem(CUSTOM_AGENTS_STORAGE_KEY, JSON.stringify(customAgentsToStore));
    setAiAgents(updatedAgents); // Update state with all agents (default and custom)
  };

  const saveManualScenariosToStorage = (updatedScenarios: Scenario[]) => {
    localStorage.setItem(MANUAL_SCENARIOS_STORAGE_KEY, JSON.stringify(updatedScenarios));
    setManualScenarios(updatedScenarios);
  };
  
  // User Management Handlers
  const handleOpenUserModal = (user: MockTrainee | null = null) => {
    setEditingUser(user);
    setUserFormData(user ? { ...user } : initialUserFormData);
    setConfirmPassword(user ? user.password || '' : '');
    setError(null);
    setIsUserModalOpen(true);
  };

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = () => {
    if (!userFormData.name || !userFormData.email || (!editingUser && !userFormData.password)) {
      setError(UI_TEXT.errorFieldsMissing);
      return;
    }
    if (!editingUser && userFormData.password !== confirmPassword) {
      setError(UI_TEXT.errorPasswordsDontMatch);
      return;
    }
    const emailExists = users.some(u => u.email.toLowerCase() === userFormData.email?.toLowerCase() && u.id !== editingUser?.id);
    if (emailExists) {
        setError(UI_TEXT.errorEmailExists);
        return;
    }

    let updatedUsers;
    if (editingUser) {
      updatedUsers = users.map(u => u.id === editingUser.id ? { ...editingUser, ...userFormData } as MockTrainee : u);
    } else {
      const newUser: MockTrainee = {
        id: `user-${Date.now()}`,
        name: userFormData.name!,
        email: userFormData.email!,
        password: userFormData.password!,
        role: userFormData.role || UserRole.TRAINEE,
        sessions: [],
      };
      updatedUsers = [...users, newUser];
    }
    saveUsersToStorage(updatedUsers);
    setIsUserModalOpen(false);
    setError(null);
  };
  
  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
        case UserRole.TRAINEE: return UI_TEXT.roleTrainee;
        case UserRole.TRAINER: return UI_TEXT.roleTrainer;
        case UserRole.SYSTEM_ADMIN: return UI_TEXT.roleSystemAdmin;
        default: return role; // Fallback
    }
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    const userToChange = users.find(u => u.id === userId);
    if (userToChange) {
        if (window.confirm(UI_TEXT.confirmRoleChangeMessage(userToChange.name, getRoleLabel(newRole)))) {
            const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
            saveUsersToStorage(updatedUsers);
        }
    }
  };


  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if(userToDelete){
        setItemToDelete({ id: userId, name: userToDelete.name, type: 'user' });
        setIsDeleteConfirmModalOpen(true);
    }
  };
  
  // Agent Management Handlers
  const handleOpenAgentModal = (agent: LoadedAIAgent | null = null) => {
    setEditingAgent(agent);
    setAgentFormData(agent ? { ...agent } : { ...initialAgentFormData });
    setAiAssistantSuggestions(null);
    setAiAssistantDescription('');
    setAiAssistantRefinement('');
    setAgentModalTab('settings');
    setError(null);
    setIsAgentModalOpen(true);
  };
  
  const handleAgentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        if (name.startsWith('capability-')) {
            const capName = name.split('-')[1] as keyof AIAgent['capabilities'];
            setAgentFormData(prev => ({
                ...prev,
                capabilities: { ...(prev.capabilities || { webSearch: false, imageGeneration: false, toolUsage: true }), [capName]: checked }
            }));
        }
    } else if (name === "personalityTraits" || name === "conversationStarters") {
        setAgentFormData(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()).filter(Boolean) }));
    } else {
        setAgentFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveAgent = () => {
    if (!agentFormData.name || !agentFormData.baseSystemPrompt) {
        setError(UI_TEXT.errorFieldsMissing + " (שם סוכן והנחיית בסיס נדרשים)");
        return;
    }
    let updatedAgents;
    if (editingAgent && editingAgent.id !== DEFAULT_AGENT_ID) { // Can't "edit" the base default agent other than its local override
        if (!editingAgent.isEditable && editingAgent.isDefault === false) { // Loaded from file, not default, not editable
            setError("לא ניתן לערוך סוכן זה שנטען מקובץ ומוגדר כלא ניתן לעריכה.");
            return;
        }
        updatedAgents = aiAgents.map(a => a.id === editingAgent.id ? { ...editingAgent, ...agentFormData, isDefault: false, isEditable: true } as LoadedAIAgent : a);
    } else if (!editingAgent) { // New custom agent
        const newAgent: LoadedAIAgent = {
            id: `custom-agent-${Date.now()}`,
            name: agentFormData.name!,
            description: agentFormData.description || '',
            baseSystemPrompt: agentFormData.baseSystemPrompt!,
            personalityTraits: agentFormData.personalityTraits || [],
            agentType: agentFormData.agentType || 'custom_task',
            conversationStarters: agentFormData.conversationStarters || [],
            recommendedModel: agentFormData.recommendedModel || undefined,
            capabilities: {
                webSearch: agentFormData.capabilities?.webSearch === undefined ? false : agentFormData.capabilities.webSearch,
                imageGeneration: agentFormData.capabilities?.imageGeneration === undefined ? false : agentFormData.capabilities.imageGeneration,
                toolUsage: agentFormData.capabilities?.toolUsage === undefined ? true : agentFormData.capabilities.toolUsage,
            },
            isDefault: false,
            isEditable: true,
        };
        updatedAgents = [...aiAgents, newAgent];
    } else { // Editing default agent's local override
        if(editingAgent.id === DEFAULT_AGENT_ID) {
            localStorage.setItem(DEFAULT_AGENT_BASE_PROMPT_STORAGE_KEY, agentFormData.baseSystemPrompt || '');
            setDefaultAgentPromptOverride(agentFormData.baseSystemPrompt || '');
            // Refresh agents list to reflect the override
            loadAgents(); 
            setIsAgentModalOpen(false);
            setError(null);
            alert(UI_TEXT.defaultAgentOverrideSaved);
            return;
        }
        // Should not reach here for default agent if logic is correct
        setError("שגיאה לא צפויה בעדכון סוכן.");
        return;
    }
    saveCustomAgentsToStorage(updatedAgents);
    setIsAgentModalOpen(false);
    setError(null);
  };

  const handleDeleteAgent = (agentId: string) => {
    const agentToDelete = aiAgents.find(a => a.id === agentId);
    if(agentToDelete && !agentToDelete.isDefault){ // Can only delete custom agents
        setItemToDelete({ id: agentId, name: agentToDelete.name, type: 'agent' });
        setIsDeleteConfirmModalOpen(true);
    } else if (agentToDelete?.isDefault) {
        alert("לא ניתן למחוק סוכני ברירת מחדל.");
    }
  };

  const handleCloneAgent = (agentToClone: LoadedAIAgent) => {
    const clonedAgent: LoadedAIAgent = {
        ...agentToClone,
        id: `custom-agent-clone-${Date.now()}`,
        name: `${agentToClone.name} ${UI_TEXT.clonedAgentNameSuffix}`,
        isDefault: false,
        isEditable: true,
    };
    saveCustomAgentsToStorage([...aiAgents, clonedAgent]);
  };

  const handleViewAgentPrompt = (agent: LoadedAIAgent) => {
    setViewingAgentPrompt(agent.baseSystemPrompt);
    setIsAgentPromptModalOpen(true);
  };

  const handleGenerateAgentConfigFromAI = async () => {
    if (!aiAssistantDescription.trim()) {
        setError("אנא ספק תיאור עבור הסוכן.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const suggestions = await GeminiService.generateAgentConfigurationFromDescription(aiAssistantDescription);
        if (suggestions) {
            setAiAssistantSuggestions(suggestions);
        } else {
            setError(UI_TEXT.agentAssistantNoSuggestions);
        }
    } catch (e) {
        setError(UI_TEXT.agentAssistantError + `: ${(e as Error).message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRefineAgentConfigFromAI = async () => {
    if (!aiAssistantSuggestions) {
        setError("יש ליצור הצעה ראשונית לפני שניתן לשפר אותה.");
        return;
    }
    if (!aiAssistantRefinement.trim()) {
        setError("אנא ספק הנחיות לשיפור.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const refinedSuggestions = await GeminiService.refineAgentConfiguration(aiAssistantSuggestions, aiAssistantRefinement);
        if (refinedSuggestions) {
            setAiAssistantSuggestions(refinedSuggestions);
        } else {
            setError(UI_TEXT.agentAssistantNoSuggestions + " (לאחר שיפור)");
        }
    } catch (e) {
        setError(UI_TEXT.agentAssistantError + ` (שיפור): ${(e as Error).message}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  const applyAIAssistantSuggestions = () => {
    if (aiAssistantSuggestions) {
        setAgentFormData(prev => ({
            ...prev,
            name: aiAssistantSuggestions.name,
            description: aiAssistantSuggestions.description,
            baseSystemPrompt: aiAssistantSuggestions.baseSystemPrompt,
            personalityTraits: aiAssistantSuggestions.personalityTraits,
            // Keep other fields like agentType, capabilities, etc., from existing form data or defaults
            agentType: prev.agentType || 'custom_task',
            conversationStarters: prev.conversationStarters || [],
            recommendedModel: prev.recommendedModel || '',
            capabilities: prev.capabilities || { webSearch: false, imageGeneration: false, toolUsage: true },
        }));
        setAgentModalTab('settings'); // Switch to settings tab to see applied suggestions
    }
  };

  // Manual Scenario Handlers
  const handleOpenScenarioModal = (scenario: Scenario | null = null) => {
    setEditingScenario(scenario);
    if (scenario) {
        const profile = scenario.interrogateeProfile as SuspectProfile;
        setScenarioFormData({
            ...scenario,
            interrogateeProfile_name: profile.name,
            interrogateeProfile_age: profile.age?.toString() || '',
            interrogateeProfile_occupation: profile.occupation,
            evidence_items_string: scenario.evidence.items.join('\n'),
            investigationGoals_string: scenario.investigationGoals?.join('\n') || '',
        });
    } else {
        setScenarioFormData(initialScenarioFormData);
    }
    setError(null);
    setIsScenarioModalOpen(true);
  };

  const handleScenarioFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setScenarioFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveScenario = () => {
    const { 
        caseType, fullCaseDescription, interrogateeRole, userSelectedDifficulty, userSelectedTopic,
        interrogateeProfile_name, interrogateeProfile_age, interrogateeProfile_occupation,
        evidence_items_string, investigationGoals_string, agentType
    } = scenarioFormData;

    if (!caseType || !fullCaseDescription || !interrogateeRole || !userSelectedDifficulty || !userSelectedTopic || !interrogateeProfile_name || !interrogateeProfile_age || !interrogateeProfile_occupation) {
        setError(UI_TEXT.errorFieldsMissing);
        return;
    }

    const profile: SuspectProfile = {
        name: interrogateeProfile_name,
        age: parseInt(interrogateeProfile_age, 10) || 0,
        occupation: interrogateeProfile_occupation,
        // Add other profile fields if your form supports them (criminalRecord, intel, etc.)
    };

    const scenarioToSave: Scenario = {
        id: editingScenario ? editingScenario.id : `manual-scenario-${Date.now()}`,
        caseType: caseType!,
        fullCaseDescription: fullCaseDescription!,
        interrogateeRole: interrogateeRole as InterrogateeRole,
        interrogateeProfile: profile,
        evidence: { title: UI_TEXT.evidenceInHandTitle, items: evidence_items_string?.split('\n').filter(Boolean) || ['N/A'] },
        userSelectedDifficulty: userSelectedDifficulty as DifficultyLevel,
        userSelectedTopic: userSelectedTopic!,
        customAgentId: DEFAULT_AGENT_ID, // Manual scenarios usually use default interrogation agent
        agentType: scenarioFormData.agentType || 'interrogation',
        investigationGoals: investigationGoals_string?.split('\n').filter(Boolean) || [],
        isManuallyCreated: true,
    };
    
    let updatedScenarios;
    if (editingScenario) {
        updatedScenarios = manualScenarios.map(s => s.id === editingScenario.id ? scenarioToSave : s);
    } else {
        updatedScenarios = [...manualScenarios, scenarioToSave];
    }
    saveManualScenariosToStorage(updatedScenarios);
    setIsScenarioModalOpen(false);
    setError(null);
  };

  const handleDeleteScenario = (scenarioId: string) => {
    const scenarioToDelete = manualScenarios.find(s => s.id === scenarioId);
     if(scenarioToDelete){
        setItemToDelete({ id: scenarioId, name: scenarioToDelete.caseType, type: 'scenario' });
        setIsDeleteConfirmModalOpen(true);
    }
  };

  // General Deletion Confirmation
  const confirmDeletion = () => {
    if (!itemToDelete) return;
    switch (itemToDelete.type) {
        case 'user':
            saveUsersToStorage(users.filter(u => u.id !== itemToDelete.id));
            alert(UI_TEXT.userDeletedSuccessfully);
            break;
        case 'agent':
            saveCustomAgentsToStorage(aiAgents.filter(a => a.id !== itemToDelete.id));
            alert(UI_TEXT.agentDeletedSuccessfully);
            break;
        case 'scenario':
            saveManualScenariosToStorage(manualScenarios.filter(s => s.id !== itemToDelete.id));
            alert(UI_TEXT.manualScenarioDeletedSuccessfully);
            break;
    }
    setIsDeleteConfirmModalOpen(false);
    setItemToDelete(null);
  };
  
  // System Settings Handlers
  const handleClearLocalStorageItem = (key: string, itemName: string) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את "${itemName}" מ-localStorage? פעולה זו אינה הפיכה.`)) {
        localStorage.removeItem(key);
        alert(`"${itemName}" נמחק בהצלחה.`);
        // Reload relevant data
        if (key === 'app_all_trainees_data') loadUsers();
        if (key === CUSTOM_AGENTS_STORAGE_KEY) loadAgents();
        if (key === MANUAL_SCENARIOS_STORAGE_KEY) loadManualScenarios();
        if (key === DEFAULT_AGENT_BASE_PROMPT_STORAGE_KEY) {
            setDefaultAgentPromptOverride('');
            loadAgents(); // Reload agents to get original default prompt
        }
        if (key === 'app_all_ai_generated_scenarios') { /* no specific state to update here */ }
        if (key === 'app_all_sessions_archive_v2') setTraineeSessions([]); // Or refetch trainee sessions
    }
  };

  const handleResetMockUsers = () => {
    if (window.confirm(UI_TEXT.confirmResetMockUsersMessage)) {
        localStorage.setItem('app_all_trainees_data', JSON.stringify(MOCK_TRAINEES_DATA));
        loadUsers(); // Reload users to reflect reset
        alert(UI_TEXT.mockUsersResetSuccess);
    }
  };

  // Live Intervention Handlers
  const handleSendInterventionCommand = () => {
    if (!activeInterventionSessionId || !interventionCommandType || !interventionPayload.trim()) {
        alert("אנא בחר סשן, סוג פקודה, ומלא את פרטי הפקודה.");
        return;
    }
    let payloadObject: UserCommand['payload'];
    switch (interventionCommandType) {
        case UserCommandType.FORCE_EMOTIONAL_STATE:
            payloadObject = { emotionalState: interventionPayload, targetSessionId: activeInterventionSessionId };
            break;
        case UserCommandType.REVEAL_SPECIFIC_INFO_HINT:
            payloadObject = { infoToRevealHint: interventionPayload, targetSessionId: activeInterventionSessionId };
            break;
        case UserCommandType.SEND_WHISPER:
            payloadObject = { whisperText: interventionPayload, targetSessionId: activeInterventionSessionId };
            break;
        case UserCommandType.INCREASE_RESISTANCE:
        case UserCommandType.DECREASE_RESISTANCE:
            payloadObject = { targetSessionId: activeInterventionSessionId }; // No specific text payload needed for these
            break;
        case UserCommandType.TRIGGER_INTERRUPTION:
            payloadObject = { interruptionType, details: interruptionDetails, targetSessionId: activeInterventionSessionId };
            break;
        default:
            alert("סוג פקודה לא חוקי.");
            return;
    }

    const command: UserCommand = { commandType: interventionCommandType, payload: payloadObject };
    GeminiService.sendCommandToSession(activeInterventionSessionId, command);
    
    // Log command for trainer's view
    const newLogEntry: TrainerCommandLogEntry = { command, timestamp: Date.now() };
    setTrainerCommandLog(prev => [...prev, newLogEntry]);
    
    // Add to intervention chat view
    let commandTextDisplay = `${UI_TEXT.sendCommandButton}: ${interventionCommandType}`;
    if(interventionCommandType === UserCommandType.TRIGGER_INTERRUPTION){
        commandTextDisplay = `${UI_TEXT.triggerInterruptionButton}: ${InterruptionTypeDisplay[interruptionType]} - ${interruptionDetails}`;
    } else if (interventionPayload.trim()){
         commandTextDisplay += ` - ${interventionPayload}`;
    }
    setInterventionChatMessages(prev => [...prev, {
        id: `trainer-cmd-${Date.now()}`,
        sender: 'system',
        text: commandTextDisplay,
        timestamp: Date.now(),
        subType: 'intervention_notification'
    }]);
    
    setInterventionPayload(''); // Clear input after sending
    // Do not clear interruptionDetails/Type unless command is specifically trigger interruption
    if (interventionCommandType === UserCommandType.TRIGGER_INTERRUPTION) {
        setInterruptionDetails('');
    }
  };
  
  const handleMockSessionSelect = (sessionId: string) => {
    setActiveInterventionSessionId(sessionId);
    // For demo, load a recent completed session's chat or mock one
    const recentSession = traineeSessions.find(s => s.id === sessionId || s.status === 'completed');
    if (recentSession) {
        setInterventionChatMessages(recentSession.chatTranscript);
        setTrainerCommandLog(recentSession.trainerCommandLog || []);
    } else {
        setInterventionChatMessages([
            { id: 'mock-start', sender: 'system', text: `טוען צ'אט עבור סשן ${sessionId}... (דמו)`, timestamp: Date.now()}
        ]);
        setTrainerCommandLog([]);
    }
  };

  // Trainee Progress Handlers
  const filteredTraineeSessions = useMemo(() => {
    if (filterTraineeId === 'all') return traineeSessions;
    return traineeSessions.filter(session => session.traineeId === filterTraineeId);
  }, [traineeSessions, filterTraineeId]);

  const overallStats = useMemo(() => {
    const completedSessions = traineeSessions.filter(s => s.status === 'completed' && s.feedback);
    if (completedSessions.length === 0) return { totalSimulations: 0, averageScore: 0 };
    const totalScore = completedSessions.reduce((sum, s) => sum + (s.feedback?.overallScore || 0), 0);
    return {
        totalSimulations: completedSessions.length,
        averageScore: parseFloat((totalScore / completedSessions.length).toFixed(1))
    };
  }, [traineeSessions]);

  const traineeSpecificStats = useMemo(() => {
    const stats: { [traineeId: string]: { name: string, count: number, totalScore: number, averageScore: number } } = {};
    users.filter(u => u.role === UserRole.TRAINEE).forEach(trainee => {
        const sessions = traineeSessions.filter(s => s.traineeId === trainee.id && s.status === 'completed' && s.feedback);
        if (sessions.length > 0) {
            const totalScore = sessions.reduce((sum, s) => sum + (s.feedback?.overallScore || 0), 0);
            stats[trainee.id] = {
                name: trainee.name,
                count: sessions.length,
                totalScore,
                averageScore: parseFloat((totalScore / sessions.length).toFixed(1))
            };
        } else {
            stats[trainee.id] = { name: trainee.name, count: 0, totalScore: 0, averageScore: 0 };
        }
    });
    return stats;
  }, [traineeSessions, users]);


  // Tabs definition
  const tabs = [
    { id: 'userManagement', label: UI_TEXT.manageUsersTab, icon: <UsersIcon />, adminOnly: true },
    { id: 'traineeProgress', label: UI_TEXT.traineeProgressTab, icon: <ProgressIcon />, adminOnly: false },
    { id: 'liveIntervention', label: UI_TEXT.liveInterventionTab, icon: <InterventionIcon />, adminOnly: false },
    { id: 'aiAgentManagement', label: UI_TEXT.manageAIAgentsTab, icon: <AgentsIcon />, adminOnly: true },
    { id: 'manualScenarioBuilder', label: UI_TEXT.manualScenarioBuilderTab, icon: <ScenariosIcon />, adminOnly: true },
    { id: 'systemSettings', label: UI_TEXT.settingsSystemTab, icon: <SettingsIcon />, adminOnly: true },
  ].filter(tab => !tab.adminOnly || isSystemAdmin);

  // Render Functions
  const renderTabContent = () => {
    if (isLoading) return <LoadingSpinner message="טוען נתונים..." />;
    if (error) return <p className="text-red-500 p-4">{error}</p>;

    switch (activeTab) {
      case 'userManagement':
        return renderUserManagement();
      case 'traineeProgress':
        return renderTraineeProgress();
      case 'liveIntervention':
        return renderLiveIntervention();
      case 'aiAgentManagement':
        return renderAIAgentManagement();
      case 'manualScenarioBuilder':
        return renderManualScenarioBuilder();
      case 'systemSettings':
        return renderSystemSettings();
      default:
        return <p>אנא בחר לשונית.</p>;
    }
  };
  
  const renderUserManagement = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`}>{UI_TEXT.manageUsersTab}</h3>
        <Button onClick={() => handleOpenUserModal(null)} icon={<AddIcon />}>{UI_TEXT.addUserButton}</Button>
      </div>
      <div className="overflow-x-auto themed-card p-1 rounded-lg">
        <table className="min-w-full divide-y themed-border">
          <thead className={theme === 'light' ? 'bg-secondary-50' : 'bg-secondary-700'}>
            <tr>
              <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">שם</th>
              <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">אימייל</th>
              <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">תפקיד</th>
              <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">פעולות</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'light' ? 'divide-secondary-200' : 'divide-secondary-700'}`}>
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm themed-text-content">{user.name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm themed-text-content">{user.email}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm themed-text-content">
                    <Select 
                        value={user.role} 
                        onChange={(e) => handleChangeUserRole(user.id, e.target.value as UserRole)}
                        options={Object.values(UserRole).filter(r => r !== UserRole.NONE).map(role => ({ value: role, label: getRoleLabel(role) }))}
                        className="text-xs p-1"
                        aria-label={UI_TEXT.ariaLabelEditUserRole(user.name)}
                    />
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm space-x-2 rtl:space-x-reverse">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenUserModal(user)} icon={<EditIcon />} title={`${UI_TEXT.edit} ${user.name}`}></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} icon={<DeleteIcon />} className="text-red-500 hover:text-red-700" title={UI_TEXT.ariaLabelDeleteUser(user.name)}></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTraineeProgress = () => (
    <div>
        <h3 className={`text-xl font-semibold mb-4 ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`}>{UI_TEXT.traineeProgressTab}</h3>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6`}>
            <div className="themed-card p-4 rounded-lg">
                <h4 className="font-semibold themed-text-primary mb-2">{UI_TEXT.overallStatsTitle}</h4>
                <p>{UI_TEXT.totalSimulations}: {overallStats.totalSimulations}</p>
                <p>{UI_TEXT.averageScoreLabel} ({UI_TEXT.overallScore}): {overallStats.averageScore > 0 ? overallStats.averageScore : UI_TEXT.noDataAvailable}</p>
            </div>
             <div className="themed-card p-4 rounded-lg">
                <h4 className="font-semibold themed-text-primary mb-2">{UI_TEXT.filterByTraineeLabel}</h4>
                <Select
                    value={filterTraineeId}
                    onChange={(e) => setFilterTraineeId(e.target.value)}
                    options={[
                        { value: 'all', label: UI_TEXT.allTraineesFilterOption },
                        ...users.filter(u => u.role === UserRole.TRAINEE).map(trainee => ({ value: trainee.id, label: trainee.name }))
                    ]}
                />
            </div>
        </div>
        {filterTraineeId !== 'all' && traineeSpecificStats[filterTraineeId] && (
            <div className="themed-card p-4 rounded-lg mb-6">
                <h4 className="font-semibold themed-text-primary mb-2">{UI_TEXT.traineeSpecificStatsTitle(traineeSpecificStats[filterTraineeId].name)}</h4>
                <p>{UI_TEXT.totalSimulations}: {traineeSpecificStats[filterTraineeId].count}</p>
                <p>{UI_TEXT.averageScoreLabel}: {traineeSpecificStats[filterTraineeId].averageScore > 0 ? traineeSpecificStats[filterTraineeId].averageScore : UI_TEXT.noDataAvailable}</p>
            </div>
        )}

        <div className="overflow-x-auto themed-card p-1 rounded-lg">
            <table className="min-w-full divide-y themed-border">
                <thead className={theme === 'light' ? 'bg-secondary-50' : 'bg-secondary-700'}>
                    <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase">חניך</th>
                        <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase">נושא תרחיש</th>
                        <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase">תאריך</th>
                        <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase">ציון</th>
                        <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase">פעולות</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'light' ? 'divide-secondary-200' : 'divide-secondary-700'}`}>
                    {filteredTraineeSessions.length > 0 ? filteredTraineeSessions.map(session => {
                        const traineeName = users.find(u => u.id === session.traineeId)?.name || 'לא ידוע';
                        return (
                            <tr key={session.id}>
                                <td className="px-4 py-2 text-sm themed-text-content">{traineeName}</td>
                                <td className="px-4 py-2 text-sm themed-text-content">{session.scenario.userSelectedTopic} ({session.scenario.agentType === 'interrogation' ? session.scenario.interrogateeRole : session.scenario.caseType})</td>
                                <td className="px-4 py-2 text-sm themed-text-content">{new Date(session.startTime).toLocaleDateString('he-IL')}</td>
                                <td className="px-4 py-2 text-sm themed-text-content">{session.feedback?.overallScore || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm">
                                    {session.feedback && 
                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedSessionForFeedback(session); setIsFeedbackModalOpen(true); }} icon={<ViewIcon />}>
                                            {UI_TEXT.viewFeedbackButton}
                                        </Button>
                                    }
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr><td colSpan={5} className="px-4 py-3 text-center themed-text-content">{UI_TEXT.noDataAvailable}</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderLiveIntervention = () => (
    <div>
        <h3 className={`text-xl font-semibold mb-4 ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`}>{UI_TEXT.liveInterventionTab}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Control Panel */}
            <div className="md:col-span-1 themed-card p-4 rounded-lg space-y-4">
                <Select
                    label="בחר סשן חניך פעיל (דמו):"
                    value={activeInterventionSessionId || ""}
                    onChange={(e) => handleMockSessionSelect(e.target.value)}
                    options={
                        traineeSessions.filter(s => s.status === 'completed').slice(0,5) // Show some recent completed for demo
                        .map(s => ({ value: s.id, label: `${users.find(u=>u.id === s.traineeId)?.name || 'חניך לא ידוע'} - ${s.scenario.caseType} (${new Date(s.startTime).toLocaleTimeString()})`}))
                    }
                    defaultEmptyOption={UI_TEXT.selectActiveSessionPlaceholder}
                />
                
                <Select
                    label="סוג פקודה:"
                    value={interventionCommandType}
                    onChange={(e) => {
                        setInterventionCommandType(e.target.value as UserCommandType);
                        if (e.target.value !== UserCommandType.TRIGGER_INTERRUPTION) {
                            setInterventionPayload(''); // Clear text payload if not needed
                        }
                    }}
                    options={[
                        { value: UserCommandType.FORCE_EMOTIONAL_STATE, label: "אכוף מצב רגשי" },
                        { value: UserCommandType.REVEAL_SPECIFIC_INFO_HINT, label: "רמוז על מידע" },
                        { value: UserCommandType.INCREASE_RESISTANCE, label: "הגבר התנגדות" },
                        { value: UserCommandType.DECREASE_RESISTANCE, label: "הפחת התנגדות" },
                        { value: UserCommandType.SEND_WHISPER, label: "שלח 'לחישה' ל-AI" },
                        { value: UserCommandType.TRIGGER_INTERRUPTION, label: UI_TEXT.triggerInterruptionButton },
                    ]}
                    defaultEmptyOption="בחר סוג פקודה..."
                />

                {interventionCommandType === UserCommandType.TRIGGER_INTERRUPTION ? (
                    <>
                        <Select
                            label={UI_TEXT.interruptionTypeLabel}
                            value={interruptionType}
                            onChange={(e) => setInterruptionType(e.target.value as InterruptionType)}
                            options={Object.values(InterruptionType).map(it => ({ value: it, label: InterruptionTypeDisplay[it] }))}
                        />
                        <Input
                            label="פרטי ההפרעה:"
                            value={interruptionDetails}
                            onChange={(e) => setInterruptionDetails(e.target.value)}
                            placeholder={UI_TEXT.interruptionDetailsPlaceholder}
                        />
                    </>
                ) : (interventionCommandType === UserCommandType.INCREASE_RESISTANCE || interventionCommandType === UserCommandType.DECREASE_RESISTANCE) ? null : (
                     <Input
                        label="פרטי הפקודה (טקסט):"
                        value={interventionPayload}
                        onChange={(e) => setInterventionPayload(e.target.value)}
                        placeholder={
                            interventionCommandType === UserCommandType.FORCE_EMOTIONAL_STATE ? UI_TEXT.enterEmotionalStatePlaceholder :
                            interventionCommandType === UserCommandType.REVEAL_SPECIFIC_INFO_HINT ? UI_TEXT.enterInfoHintPlaceholder :
                            interventionCommandType === UserCommandType.SEND_WHISPER ? UI_TEXT.enterWhisperPlaceholder : "הזן פרטים..."
                        }
                        disabled={!interventionCommandType}
                    />
                )}
                <Button onClick={handleSendInterventionCommand} disabled={!activeInterventionSessionId || !interventionCommandType || (interventionCommandType !== UserCommandType.INCREASE_RESISTANCE && interventionCommandType !== UserCommandType.DECREASE_RESISTANCE && interventionCommandType !== UserCommandType.TRIGGER_INTERRUPTION && !interventionPayload.trim()) || (interventionCommandType === UserCommandType.TRIGGER_INTERRUPTION && !interruptionDetails.trim())} className="w-full">
                    {UI_TEXT.sendCommandButton}
                </Button>
            </div>

            {/* Chat View & Command Log */}
            <div className="md:col-span-2 themed-card p-4 rounded-lg flex flex-col h-[60vh] md:h-auto">
                <h4 className="font-semibold themed-text-primary mb-2">{UI_TEXT.trainerChatViewTitle}</h4>
                <div className="flex-grow overflow-y-auto border themed-border rounded p-2 mb-2 bg-opacity-20 bg-black">
                     {interventionChatMessages.length === 0 && <p className="text-xs themed-text-secondary text-center p-4">{UI_TEXT.trainerChatViewNoMessages}</p>}
                    {interventionChatMessages.map(msg => <ChatBubble key={msg.id} message={msg} theme={theme} />)}
                     <div ref={chatEndRef}></div>
                </div>
                <h4 className="font-semibold themed-text-primary mb-1 mt-2 text-sm flex items-center"><LogIcon /> <span className="mr-1 rtl:ml-1">היסטוריית פקודות מדריך לסשן זה:</span></h4>
                <div className="text-xs overflow-y-auto max-h-28 border themed-border rounded p-1 space-y-1 bg-opacity-20 bg-black">
                    {trainerCommandLog.length === 0 && <p className="themed-text-secondary p-2">אין פקודות עדיין.</p>}
                    {trainerCommandLog.map(entry => (
                        <div key={entry.timestamp} className="themed-text-secondary">
                           [{new Date(entry.timestamp).toLocaleTimeString()}]: {entry.command.commandType}
                           {entry.command.payload && (entry.command.payload as ForceEmotionalStatePayload).emotionalState && ` - ${(entry.command.payload as ForceEmotionalStatePayload).emotionalState}`}
                           {entry.command.payload && (entry.command.payload as RevealSpecificInfoHintPayload).infoToRevealHint && ` - ${(entry.command.payload as RevealSpecificInfoHintPayload).infoToRevealHint}`}
                           {entry.command.payload && (entry.command.payload as SendWhisperPayload).whisperText && ` - ${(entry.command.payload as SendWhisperPayload).whisperText}`}
                           {entry.command.payload && (entry.command.payload as TriggerInterruptionPayload).interruptionType && ` - ${InterruptionTypeDisplay[(entry.command.payload as TriggerInterruptionPayload).interruptionType]}: ${(entry.command.payload as TriggerInterruptionPayload).details}`}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
  
  const renderAIAgentManagement = () => (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`}>{UI_TEXT.agentManagementTitle}</h3>
            <Button onClick={() => handleOpenAgentModal(null)} icon={<AddIcon />}>{UI_TEXT.addNewAgentButton}</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiAgents.map(agent => (
                <div key={agent.id} className="themed-card p-4 rounded-lg flex flex-col justify-between">
                    <div>
                        <h4 className={`font-semibold themed-text-primary text-lg`}>{agent.name} <span className="text-xs themed-text-secondary">({UI_TEXT.getAgentTypeDisplay(agent.agentType)})</span></h4>
                        <p className="text-xs themed-text-secondary mt-0.5 mb-1">
                            {agent.isDefault ? UI_TEXT.agentStatusDefaultFromFile : UI_TEXT.agentStatusCustomLocal }
                            {!agent.isDefault && agent.isEditable ? ` | ${UI_TEXT.agentStatusEditable}` : agent.isDefault ? "" : ` | ${UI_TEXT.agentStatusNotEditable}`}
                        </p>
                        <p className="text-sm themed-text-content mb-2 flex-grow min-h-[40px]">{agent.description}</p>
                        {agent.personalityTraits && agent.personalityTraits.length > 0 && 
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-700 text-blue-200'}`}>{UI_TEXT.agentPersonalityAwareBadge}</span>
                        }
                    </div>
                    <div className="flex items-center space-x-1 rtl:space-x-reverse mt-2">
                        {agent.id === DEFAULT_AGENT_ID ? (
                             <Button variant="ghost" size="sm" onClick={() => handleOpenAgentModal(agent)} icon={<EditIcon />} title={UI_TEXT.viewOrEditDefaultAgentPromptButton}>
                                {UI_TEXT.viewOrEditDefaultAgentPromptButton}
                            </Button>
                        ) : agent.isEditable ? (
                            <Button variant="ghost" size="sm" onClick={() => handleOpenAgentModal(agent)} icon={<EditIcon />} title={`${UI_TEXT.editAgentButton} ${agent.name}`}>
                                {UI_TEXT.edit}
                            </Button>
                        ) : (
                             <Button variant="ghost" size="sm" onClick={() => handleViewAgentPrompt(agent)} icon={<ViewIcon />} title={`${UI_TEXT.viewPromptButton} ${agent.name}`}>
                                {UI_TEXT.viewPromptButton}
                            </Button>
                        )}
                        {!agent.isDefault && (
                             <>
                                <Button variant="ghost" size="sm" onClick={() => handleCloneAgent(agent)} icon={<CloneIcon />} title={UI_TEXT.ariaLabelCloneAgent(agent.name)}>{UI_TEXT.cloneAgentButton}</Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteAgent(agent.id)} icon={<DeleteIcon />} className="text-red-500 hover:text-red-700" title={UI_TEXT.ariaLabelDeleteAgent(agent.name)}></Button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
        {aiAgents.length === 0 && <p className="text-center themed-text-content py-8">{UI_TEXT.errorNoCustomAgents}</p>}
    </div>
  );

  const renderManualScenarioBuilder = () => (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`}>{UI_TEXT.manualScenarioBuilderTab}</h3>
            <Button onClick={() => handleOpenScenarioModal(null)} icon={<AddIcon />}>{UI_TEXT.addNewManualScenarioButton}</Button>
        </div>
        {manualScenarios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {manualScenarios.map(scenario => (
                    <div key={scenario.id} className="themed-card p-4 rounded-lg flex flex-col justify-between">
                        <div>
                            <h4 className="font-semibold themed-text-primary text-lg">{scenario.caseType}</h4>
                            <p className="text-xs themed-text-secondary mb-1">נושא: {scenario.userSelectedTopic}, רמה: {scenario.userSelectedDifficulty}</p>
                            <p className="text-sm themed-text-content mb-2 flex-grow min-h-[60px]">{scenario.fullCaseDescription.substring(0,100)}...</p>
                        </div>
                        <div className="flex items-center space-x-1 rtl:space-x-reverse mt-2">
                             <Button variant="ghost" size="sm" onClick={() => handleOpenScenarioModal(scenario)} icon={<EditIcon />}>{UI_TEXT.edit}</Button>
                             <Button variant="ghost" size="sm" onClick={() => handleDeleteScenario(scenario.id)} icon={<DeleteIcon />} className="text-red-500 hover:text-red-700">{UI_TEXT.delete}</Button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-center themed-text-content py-8">{UI_TEXT.noDataAvailable}</p>
        )}
    </div>
  );

  const renderSystemSettings = () => (
    <div>
        <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`}>{UI_TEXT.settingsSystemTab}</h3>
        <div className="space-y-6">
            <div className="themed-card p-4 rounded-lg">
                <h4 className="font-semibold themed-text-primary mb-3">{UI_TEXT.dataManagementSectionTitle}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Button variant="danger" size="sm" onClick={() => handleClearLocalStorageItem('app_all_sessions_archive_v2', UI_TEXT.clearAllSessionsButton)}>{UI_TEXT.clearAllSessionsButton}</Button>
                    <Button variant="danger" size="sm" onClick={() => handleClearLocalStorageItem(DEFAULT_AGENT_BASE_PROMPT_STORAGE_KEY, UI_TEXT.resetDefaultAgentOverrideButton)}>{UI_TEXT.resetDefaultAgentOverrideButton}</Button>
                    <Button variant="danger" size="sm" onClick={handleResetMockUsers}>{UI_TEXT.resetMockUsersButton}</Button>
                    <Button variant="danger" size="sm" onClick={() => handleClearLocalStorageItem(CUSTOM_AGENTS_STORAGE_KEY, "נקה סוכני AI מותאמים")}>נקה סוכני AI מותאמים</Button>
                    <Button variant="danger" size="sm" onClick={() => handleClearLocalStorageItem(MANUAL_SCENARIOS_STORAGE_KEY, "נקה תרחישים ידניים")}>נקה תרחישים ידניים</Button>
                    <Button variant="danger" size="sm" onClick={() => handleClearLocalStorageItem('app_all_ai_generated_scenarios', "נקה ארכיון תרחישי AI")}>נקה ארכיון תרחישי AI</Button>
                </div>
            </div>
            <div className="themed-card p-4 rounded-lg">
                <h4 className="font-semibold themed-text-primary mb-2">{UI_TEXT.apiStatusTitle}</h4>
                <p className="themed-text-content">{UI_TEXT.apiKeyStatusLabel} <span className={process.env.API_KEY ? 'text-green-500' : 'text-red-500'}>{process.env.API_KEY ? UI_TEXT.apiKeyLoaded : UI_TEXT.apiKeyMissing}</span></p>
            </div>
        </div>
    </div>
  );


  // Main component render
  return (
    <div className={`p-4 ${theme === 'light' ? 'bg-secondary-100' : 'bg-secondary-900'} min-h-full`}>
      <div className="mb-6 flex flex-wrap border-b themed-border">
        {tabs.map(tabInfo => (
          <button
            key={tabInfo.id}
            onClick={() => setActiveTab(tabInfo.id as TrainerActiveTab)}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-3 text-sm font-medium focus:outline-none transition-colors duration-150
              ${activeTab === tabInfo.id 
                ? (theme === 'light' ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-primary-400 text-primary-300 bg-secondary-700') 
                : (theme === 'light' ? 'border-transparent text-secondary-500 hover:text-primary-600 hover:bg-secondary-50' : 'border-transparent text-secondary-400 hover:text-primary-300 hover:bg-secondary-700')}
              ${activeTab === tabInfo.id ? 'border-b-2' : ''}
            `}
            aria-current={activeTab === tabInfo.id ? "page" : undefined}
          >
            {tabInfo.icon}
            <span>{tabInfo.label}</span>
          </button>
        ))}
      </div>
      {renderTabContent()}

      {/* User Modal */}
      {isUserModalOpen && (
        <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? UI_TEXT.edit : UI_TEXT.addNewUserModalTitle}>
            <div className="space-y-3">
                <Input name="name" label={UI_TEXT.fullNameLabel} value={userFormData.name || ''} onChange={handleUserFormChange} required />
                <Input name="email" label={UI_TEXT.emailLabel} type="email" value={userFormData.email || ''} onChange={handleUserFormChange} required />
                <Input name="password" label={UI_TEXT.passwordLabel} type="password" value={userFormData.password || ''} onChange={handleUserFormChange} required={!editingUser} />
                {!editingUser && <Input name="confirmPassword" label={UI_TEXT.confirmPasswordLabel} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />}
                <Select name="role" label={UI_TEXT.userRole} value={userFormData.role || UserRole.TRAINEE} onChange={handleUserFormChange}
                    options={Object.values(UserRole).filter(r => r !== UserRole.NONE).map(role => ({ value: role, label: getRoleLabel(role) }))}
                />
                {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
                <Button variant="secondary" onClick={() => setIsUserModalOpen(false)}>{UI_TEXT.cancel}</Button>
                <Button onClick={handleSaveUser}>{UI_TEXT.save}</Button>
            </div>
        </Modal>
      )}

      {/* AI Agent Modal */}
      {isAgentModalOpen && (
        <Modal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} title={editingAgent && editingAgent.id === DEFAULT_AGENT_ID ? UI_TEXT.editDefaultAgentPromptTitle : editingAgent ? UI_TEXT.editAgentButton : UI_TEXT.addNewAgentButton} size="2xl">
            <div className="mb-4 border-b themed-border flex">
                {AGENT_MODAL_TABS_ORDER.map(tabKey => {
                    let tabLabel: string = tabKey; // Fallback
                    if (tabKey === 'settings') tabLabel = UI_TEXT.agentModalTitleSettings;
                    else if (tabKey === 'assistant') tabLabel = UI_TEXT.agentModalTitleAssistant;
                    else if (tabKey === 'knowledge') tabLabel = UI_TEXT.agentModalTitleKnowledge;
                    else if (tabKey === 'starters') tabLabel = UI_TEXT.agentModalTitleConversationStarters; // Corrected key
                    else if (tabKey === 'capabilities') tabLabel = UI_TEXT.agentModalTitleCapabilities;
                    else if (tabKey === 'actions') tabLabel = UI_TEXT.agentModalTitleActions;
                    
                    return (
                         <button key={tabKey}
                            onClick={() => setAgentModalTab(tabKey)}
                            className={`px-3 py-2 text-xs font-medium focus:outline-none ${agentModalTab === tabKey ? (theme === 'light' ? 'border-primary-500 text-primary-600' : 'border-primary-400 text-primary-300') : (theme === 'light' ? 'border-transparent text-secondary-500 hover:text-primary-600' : 'border-transparent text-secondary-400 hover:text-primary-300')} ${agentModalTab === tabKey ? 'border-b-2' : ''}`}
                        >
                            {tabLabel}
                        </button>
                    );
                })}
            </div>
            
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

            {/* Agent Modal - Settings Tab */}
            {agentModalTab === 'settings' && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                <Input name="name" label={UI_TEXT.agentNameLabel} value={agentFormData.name || ''} onChange={handleAgentFormChange} required 
                    disabled={editingAgent?.id === DEFAULT_AGENT_ID || (editingAgent && !editingAgent.isDefault && !editingAgent.isEditable)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select name="agentType" label={UI_TEXT.agentTypeLabel} value={agentFormData.agentType || 'custom_task'} onChange={handleAgentFormChange}
                        options={AIAgentTypeValues.map(type => ({ value: type, label: UI_TEXT.agentTypeOptions[type] || type }))}
                        disabled={editingAgent?.id === DEFAULT_AGENT_ID || (editingAgent && !editingAgent.isDefault && !editingAgent.isEditable)}
                    />
                    <Input name="recommendedModel" label={UI_TEXT.agentRecommendedModelLabel} value={agentFormData.recommendedModel || ''} onChange={handleAgentFormChange} placeholder={GEMINI_MODEL_TEXT}
                        disabled={editingAgent?.id === DEFAULT_AGENT_ID || (editingAgent && !editingAgent.isDefault && !editingAgent.isEditable)}
                    />
                </div>
                <label className={`block text-sm font-medium ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.agentDescriptionLabel}</label>
                <textarea name="description" value={agentFormData.description || ''} onChange={handleAgentFormChange} rows={2} className="themed-input w-full text-sm"
                    disabled={editingAgent?.id === DEFAULT_AGENT_ID || (editingAgent && !editingAgent.isDefault && !editingAgent.isEditable)}
                />
                <label className={`block text-sm font-medium ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.agentBaseSystemPromptLabel}</label>
                <textarea name="baseSystemPrompt" value={agentFormData.baseSystemPrompt || ''} onChange={handleAgentFormChange} rows={editingAgent?.id === DEFAULT_AGENT_ID ? 10 : 6} className="themed-input w-full text-xs" placeholder={UI_TEXT.agentBaseSystemPromptPlaceholder}
                     disabled={editingAgent && !editingAgent.isDefault && !editingAgent.isEditable && editingAgent.id !== DEFAULT_AGENT_ID}
                />
                 {editingAgent?.id === DEFAULT_AGENT_ID && <p className="text-xs themed-text-secondary">{UI_TEXT.defaultAgentOverrideNotice}</p>}
                 {editingAgent && !editingAgent.isDefault && !editingAgent.isEditable && <p className="text-xs text-orange-400">{UI_TEXT.agentNonEditableFromFileNotice}</p>}
                
                <Input name="personalityTraits" label={UI_TEXT.agentPersonalityTraitsLabel} value={(agentFormData.personalityTraits || []).join(', ')} onChange={handleAgentFormChange} placeholder={UI_TEXT.agentPersonalityTraitsPlaceholder}
                    disabled={editingAgent?.id === DEFAULT_AGENT_ID || (editingAgent && !editingAgent.isDefault && !editingAgent.isEditable)}
                />
            </div>
            )}

            {/* Agent Modal - AI Assistant Tab */}
            {agentModalTab === 'assistant' && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                <label className={`block text-sm font-medium ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.agentAssistantDescribeLabel}</label>
                <textarea value={aiAssistantDescription} onChange={(e) => setAiAssistantDescription(e.target.value)} rows={4} className="themed-input w-full text-sm" placeholder="לדוגמה: סוכן שעוזר לכתוב מיילים מקצועיים באנגלית..." />
                <Button onClick={handleGenerateAgentConfigFromAI} isLoading={isLoading} icon={<AIAssistantIcon/>}>{UI_TEXT.agentAssistantGetSuggestionsButton}</Button>
                
                {aiAssistantSuggestions && (
                    <div className={`mt-4 p-3 rounded-md themed-bg-accent space-y-2 text-xs`}>
                        <h5 className="font-semibold themed-text-primary">{UI_TEXT.agentAssistantGetSuggestionsButton}</h5>
                        <p><strong>{UI_TEXT.agentAssistantSuggestedNameLabel}</strong> {aiAssistantSuggestions.name}</p>
                        <p><strong>{UI_TEXT.agentAssistantSuggestedDescriptionLabel}</strong> {aiAssistantSuggestions.description}</p>
                        <p><strong>{UI_TEXT.agentAssistantSuggestedPersonalityTraitsLabel}</strong> {aiAssistantSuggestions.personalityTraits.join(', ')}</p>
                        <div>
                            <strong>{UI_TEXT.agentAssistantSuggestedBasePromptLabel}</strong>
                            <pre className="whitespace-pre-wrap bg-opacity-50 bg-black p-1 rounded max-h-32 overflow-y-auto">{aiAssistantSuggestions.baseSystemPrompt}</pre>
                        </div>
                        <label className={`block text-sm font-medium mt-2 ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.agentAssistantRefineInstructionsLabel}</label>
                        <textarea value={aiAssistantRefinement} onChange={(e) => setAiAssistantRefinement(e.target.value)} rows={2} className="themed-input w-full text-sm" placeholder="למשל: הפוך את ההנחיה ליותר רשמית, הוסף תכונת אישיות 'סבלני'..." />
                        <div className="flex space-x-2 rtl:space-x-reverse">
                            <Button onClick={handleRefineAgentConfigFromAI} isLoading={isLoading} size="sm">{UI_TEXT.agentAssistantRefineSuggestionsButton}</Button>
                            <Button onClick={applyAIAssistantSuggestions} variant="secondary" size="sm">{UI_TEXT.agentAssistantApplySuggestionsButton}</Button>
                        </div>
                    </div>
                )}
            </div>
            )}
            
            {/* Agent Modal - Other Tabs (Placeholders) */}
            {agentModalTab === 'knowledge' && (
                <div className="space-y-3 text-sm themed-text-content">
                    <p>{UI_TEXT.agentKnowledgeUploadLabel}</p>
                    <Input type="file" multiple disabled />
                    <p className="text-xs">{UI_TEXT.agentKnowledgeBackendNotice}</p>
                </div>
            )}
            {agentModalTab === 'starters' && (
                <div className="space-y-3">
                    <label className={`block text-sm font-medium ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.agentConversationStartersLabel}</label>
                    <textarea name="conversationStarters" value={(agentFormData.conversationStarters || []).join('\n')} onChange={(e) => setAgentFormData(prev => ({ ...prev, conversationStarters: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))} rows={4} className="themed-input w-full text-sm" placeholder={UI_TEXT.agentConversationStartersPlaceholder}
                         disabled={editingAgent?.id === DEFAULT_AGENT_ID || (editingAgent && !editingAgent.isDefault && !editingAgent.isEditable)}
                    />
                </div>
            )}
             {agentModalTab === 'capabilities' && (
                <div className="space-y-2">
                    <ToggleSwitch id="cap-webSearch" label={UI_TEXT.agentCapabilityWebSearchLabel} checked={agentFormData.capabilities?.webSearch || false} onChange={(c) => handleAgentFormChange({ target: { name: 'capability-webSearch', checked: c, type: 'checkbox'} } as any)} disabled />
                    <ToggleSwitch id="cap-imageGen" label={UI_TEXT.agentCapabilityImageGenerationLabel} checked={agentFormData.capabilities?.imageGeneration || false} onChange={(c) => handleAgentFormChange({ target: { name: 'capability-imageGeneration', checked: c, type: 'checkbox'} } as any)} disabled={editingAgent?.id === DEFAULT_AGENT_ID || (editingAgent && !editingAgent.isDefault && !editingAgent.isEditable)}/>
                    <ToggleSwitch id="cap-toolUsage" label={UI_TEXT.agentCapabilityToolUsageLabel} checked={agentFormData.capabilities?.toolUsage === undefined ? true : agentFormData.capabilities?.toolUsage} onChange={(c) => handleAgentFormChange({ target: { name: 'capability-toolUsage', checked: c, type: 'checkbox'} } as any)} disabled={editingAgent?.id === DEFAULT_AGENT_ID || (editingAgent && !editingAgent.isDefault && !editingAgent.isEditable)}/>
                </div>
            )}
            {agentModalTab === 'actions' && (
                 <div className="space-y-3 text-sm themed-text-content">
                    <p>{UI_TEXT.agentActionsAvailableToolsTitle}</p>
                    <ul className="list-disc pl-5 rtl:pr-5">
                        {Object.values(ToolName).map(tool => <li key={tool as string}>{tool as string}</li>)}
                    </ul>
                    <p className="text-xs">{UI_TEXT.agentActionsCustomizationNotice}</p>
                </div>
            )}


            <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
                <Button variant="secondary" onClick={() => setIsAgentModalOpen(false)}>{UI_TEXT.cancel}</Button>
                {agentModalTab === 'settings' && (!editingAgent || editingAgent.isEditable || editingAgent.id === DEFAULT_AGENT_ID) && <Button onClick={handleSaveAgent}>{UI_TEXT.save}</Button>}
                 {editingAgent?.id === DEFAULT_AGENT_ID && agentModalTab === 'settings' &&
                    <Button variant="ghost" onClick={() => {
                        localStorage.removeItem(DEFAULT_AGENT_BASE_PROMPT_STORAGE_KEY);
                        setDefaultAgentPromptOverride(aiAgents.find(a=>a.id===DEFAULT_AGENT_ID)?.baseSystemPrompt || '');
                        loadAgents();
                        alert(UI_TEXT.settingsTab_defaultAgentOverrideResetSuccess);
                    }} icon={<ResetIcon />}>{UI_TEXT.resetToOriginalButton}</Button>
                }
            </div>
        </Modal>
      )}

      {/* Manual Scenario Modal */}
      {isScenarioModalOpen && (
        <Modal isOpen={isScenarioModalOpen} onClose={() => setIsScenarioModalOpen(false)} title={editingScenario ? UI_TEXT.edit : UI_TEXT.addNewManualScenarioButton} size="xl">
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                <Input name="caseType" label={UI_TEXT.manualScenarioNameLabel} value={scenarioFormData.caseType || ''} onChange={handleScenarioFormChange} required />
                <label className={`block text-sm font-medium ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.manualScenarioDescriptionLabel}</label>
                <textarea name="fullCaseDescription" value={scenarioFormData.fullCaseDescription || ''} onChange={handleScenarioFormChange} rows={3} className="themed-input w-full text-sm" required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select name="interrogateeRole" label={UI_TEXT.manualScenarioInterrogateeRoleLabel} value={scenarioFormData.interrogateeRole || InterrogateeRole.SUSPECT} onChange={handleScenarioFormChange}
                        options={Object.values(InterrogateeRole).map(role => ({ value: role, label: role }))}
                    />
                    <Select name="userSelectedDifficulty" label={UI_TEXT.manualScenarioDifficultyLabel} value={scenarioFormData.userSelectedDifficulty || DifficultyLevel.MEDIUM} onChange={handleScenarioFormChange}
                        options={Object.values(DifficultyLevel).map(level => ({ value: level, label: level }))}
                    />
                </div>
                <Input name="userSelectedTopic" label={UI_TEXT.manualScenarioTopicLabel} value={scenarioFormData.userSelectedTopic || ''} onChange={handleScenarioFormChange} required />
                <h4 className="font-medium themed-text-primary pt-2">פרופיל הנחקר</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input name="interrogateeProfile_name" label={UI_TEXT.profileNameLabel} value={scenarioFormData.interrogateeProfile_name || ''} onChange={handleScenarioFormChange} required />
                    <Input name="interrogateeProfile_age" label={UI_TEXT.profileAgeLabel} type="number" value={scenarioFormData.interrogateeProfile_age || ''} onChange={handleScenarioFormChange} required />
                    <Input name="interrogateeProfile_occupation" label={UI_TEXT.profileOccupationLabel} value={scenarioFormData.interrogateeProfile_occupation || ''} onChange={handleScenarioFormChange} required />
                </div>
                <label className={`block text-sm font-medium ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.evidenceItemsLabel}</label>
                <textarea name="evidence_items_string" value={scenarioFormData.evidence_items_string || ''} onChange={handleScenarioFormChange} rows={3} className="themed-input w-full text-sm" placeholder="כל ראיה בשורה חדשה"/>
                <label className={`block text-sm font-medium ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.manualScenarioGoalsLabel}</label>
                <textarea name="investigationGoals_string" value={scenarioFormData.investigationGoals_string || ''} onChange={handleScenarioFormChange} rows={3} className="themed-input w-full text-sm" placeholder="כל מטרה בשורה חדשה"/>
                 <Select name="agentType" label={UI_TEXT.agentTypeLabel} value={scenarioFormData.agentType || 'interrogation'} onChange={handleScenarioFormChange}
                        options={AIAgentTypeValues.map(type => ({ value: type, label: UI_TEXT.agentTypeOptions[type] || type }))}
                 />
                 {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
                <Button variant="secondary" onClick={() => setIsScenarioModalOpen(false)}>{UI_TEXT.cancel}</Button>
                <Button onClick={handleSaveScenario}>{UI_TEXT.save}</Button>
            </div>
        </Modal>
      )}

      {/* Agent Prompt View Modal */}
      {isAgentPromptModalOpen && (
        <Modal isOpen={isAgentPromptModalOpen} onClose={() => setIsAgentPromptModalOpen(false)} title="צפייה בהנחיית סוכן" size="xl">
            <pre className="whitespace-pre-wrap text-xs bg-opacity-50 bg-black p-2 rounded max-h-[70vh] overflow-y-auto themed-text-content">{viewingAgentPrompt}</pre>
            <div className="mt-4 flex justify-end">
                <Button onClick={() => setIsAgentPromptModalOpen(false)}>{UI_TEXT.closeButton}</Button>
            </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmModalOpen && itemToDelete && (
        <Modal isOpen={isDeleteConfirmModalOpen} onClose={() => setIsDeleteConfirmModalOpen(false)} title={`אישור מחיקת ${itemToDelete.type === 'user' ? 'משתמש' : itemToDelete.type === 'agent' ? 'סוכן' : 'תרחיש'}`}>
            <p>
                {itemToDelete.type === 'user' && UI_TEXT.confirmDeleteUserMessage(itemToDelete.name)}
                {itemToDelete.type === 'agent' && UI_TEXT.confirmDeleteAgentMessage(itemToDelete.name)}
                {itemToDelete.type === 'scenario' && UI_TEXT.confirmDeleteManualScenarioMessage(itemToDelete.name)}
            </p>
            <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
                <Button variant="secondary" onClick={() => setIsDeleteConfirmModalOpen(false)}>{UI_TEXT.cancel}</Button>
                <Button variant="danger" onClick={confirmDeletion}>{UI_TEXT.delete}</Button>
            </div>
        </Modal>
      )}

      {/* Feedback Modal */}
      {isFeedbackModalOpen && selectedSessionForFeedback && selectedSessionForFeedback.feedback && (
        <Modal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} title={UI_TEXT.feedbackDetailsModalTitle} size="xl">
            <div className="max-h-[75vh] overflow-y-auto pr-1 text-sm">
                <div className={`p-3 rounded-md mb-4 text-center ${theme === 'light' ? 'bg-primary-50 border-primary-200' : 'bg-primary-700 bg-opacity-30 border-primary-600'}`}>
                    <p className={`text-md font-medium ${theme === 'light' ? 'text-primary-600' : 'text-primary-300'}`}>{UI_TEXT.overallScore}</p>
                    <p className={`text-3xl font-bold ${theme === 'light' ? 'text-primary-700' : 'text-primary-200'}`}>{selectedSessionForFeedback.feedback.overallScore} / 10</p>
                </div>
                 <div className={`p-2 rounded-md mb-3 ${theme === 'light' ? 'bg-secondary-50 border-secondary-100' : 'bg-secondary-800 border-secondary-700'}`}>
                    <h4 className="font-semibold themed-text-primary mb-1">סיכום והמלצות</h4>
                    <p className="whitespace-pre-wrap">{selectedSessionForFeedback.feedback.summary}</p>
                </div>
                 {selectedSessionForFeedback.feedback.keyMoments && selectedSessionForFeedback.feedback.keyMoments.length > 0 && (
                    <div className={`p-2 rounded-md mb-3 ${theme === 'light' ? 'bg-secondary-50 border-secondary-100' : 'bg-secondary-800 border-secondary-700'}`}>
                        <h4 className="font-semibold themed-text-primary mb-1">{UI_TEXT.feedbackKeyMomentsTitle}</h4>
                        <ul className="list-disc list-inside space-y-1 pl-4 rtl:pr-4 rtl:pl-0">
                            {selectedSessionForFeedback.feedback.keyMoments.map((moment: KeyMoment, index: number) => (
                                <li key={index}>
                                    <strong>{moment.momentDescription}:</strong> {moment.significance}
                                </li>
                            ))}
                        </ul>
                    </div>
                 )}
                 <div className={`p-2 rounded-md ${theme === 'light' ? 'bg-secondary-50 border-secondary-100' : 'bg-secondary-800 border-secondary-700'}`}>
                    <h4 className="font-semibold themed-text-primary mb-1">הערכת פרמטרים</h4>
                    <ul className="space-y-1.5">
                        {selectedSessionForFeedback.feedback.parameters.map((param, index) => (
                            <li key={index} className={`p-1.5 rounded ${theme === 'light' ? 'bg-white border' : 'bg-secondary-700 border border-secondary-600'}`}>
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-medium text-xs">{param.name}</span>
                                    <span className={`font-bold px-1 py-0.5 rounded text-xs ${param.score >= 7 ? (theme==='light' ? 'bg-green-100 text-green-700':'bg-green-700 text-green-100') : param.score >=4 ? (theme==='light'?'bg-yellow-100 text-yellow-700':'bg-yellow-700 text-yellow-100') : (theme==='light'?'bg-red-100 text-red-700':'bg-red-700 text-red-100')}`}>
                                        {param.score} / 10
                                    </span>
                                </div>
                                <p className={`text-xs ${theme === 'light' ? 'text-secondary-600' : 'text-secondary-300'}`}>{param.evaluation}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <Button onClick={() => setIsFeedbackModalOpen(false)}>{UI_TEXT.closeButton}</Button>
            </div>
        </Modal>
      )}

    </div>
  );
};

export default TrainerView;
