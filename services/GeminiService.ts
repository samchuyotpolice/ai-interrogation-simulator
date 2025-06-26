import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { UI_TEXT, GEMINI_MODEL_TEXT, DEFAULT_AGENT_ID, MOCK_POLICE_DATABASE_RECORDS, MOCK_GENERAL_KNOWLEDGE_BASE, MOCK_INTERNAL_ARCHIVES_RECORDS, MOCK_FORENSIC_REPORTS, loadAiAgents } from '../constants'; 
import { 
    Scenario, ChatMessage, Feedback, GeminiJsonScenario, GeminiChat, InterrogateeRole, DifficultyLevel, 
    SuspectProfile, GeminiJsonSuspectProfile, SessionContextV2, AIResponseWithDirectives, AvatarControlPayload, 
    ToolCallRequest, ToolCallResult, ToolName, CheckPoliceDatabaseToolInput, CheckPoliceDatabaseToolOutput, 
    GetCurrentTimeAndDateToolInput, GetCurrentTimeAndDateToolOutput, GeneralKnowledgeCheckToolInput, GeneralKnowledgeCheckToolOutput,
    SearchInternalArchivesToolInput, SearchInternalArchivesToolOutput, RequestForensicAnalysisToolInput, RequestForensicAnalysisToolOutput, // New tool types
    SimpleChatMessage, MockPoliceRecord, UserCommand, UserCommandType, ForceEmotionalStatePayload, RevealSpecificInfoHintPayload, SendWhisperPayload, TriggerInterruptionPayload, InterruptionTypeDisplay, // Added TriggerInterruptionPayload
    AIAgent, LoadedAIAgent, AIAgentType
} from '../types';

const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error(UI_TEXT.errorApiKeyMissing);
}

const parseJsonFromResponse = <T,>(responseText: string): T | null => {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*json)?\s*\n?(.*?)\n?\s*```$/s; 
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original text:", responseText);
    // Attempt to extract textResponse if the full JSON parse fails
    try {
        const textMatch = jsonStr.match(/"textResponse"\s*:\s*"((?:\\.|[^"\\])*)"/); 
        if (textMatch && textMatch[1]) {
             console.warn("Returning only textResponse due to parsing error of full object.");
            // Construct a minimal valid object based on T, assuming T has a textResponse field
            return { textResponse: textMatch[1].replace(/\\"/g, '"') } as unknown as T; 
        }
    } catch (extractionError) {
        console.error("Failed to extract textResponse after initial parsing error:", extractionError);
    }
    // If all else fails, and T is expected to be an object with at least a textResponse field,
    // return the original non-JSON text as the textResponse.
    // This is a last resort to prevent losing the AI's textual output completely.
    console.warn("Returning raw text as textResponse due to complete JSON parsing failure.");
    return { textResponse: responseText } as unknown as T;
  }
};

export const generateScenario = async (
  interrogateeRole: InterrogateeRole,
  difficulty: DifficultyLevel,
  topic: string,
  customAgentId: string // New parameter
): Promise<Scenario | null> => {
  if (!ai) {
    throw new Error(UI_TEXT.errorApiKeyMissing);
  }
  try {
    const allAgents: LoadedAIAgent[] = await loadAiAgents(); 
    const selectedAgentOrDefault = allAgents.find(agent => agent.id === customAgentId) || allAgents.find(a => a.id === DEFAULT_AGENT_ID && a.isDefault);
    
    const defaultFallbackAgent: LoadedAIAgent = { 
        id: DEFAULT_AGENT_ID, 
        name: UI_TEXT.defaultAgentName,
        description: UI_TEXT.defaultAgentDescription,
        baseSystemPrompt: UI_TEXT.scenarioSystemPromptTemplate, 
        isDefault: true, 
        isEditable: false,
        personalityTraits: ["ניטרלי"],
        agentType: 'interrogation' as AIAgentType,
        conversationStarters: [],
        recommendedModel: undefined,
        capabilities: { webSearch: false, imageGeneration: false, toolUsage: true },
    };
    const agentToUse = selectedAgentOrDefault || allAgents.find(a=> a.id === DEFAULT_AGENT_ID) || defaultFallbackAgent;
    
    let personalityTraitsPromptSection = "";
    if (agentToUse.personalityTraits && agentToUse.personalityTraits.length > 0) {
        personalityTraitsPromptSection = `\nתכונות אישיות מיוחדות לדמותך (בנוסף לפרופיל): ${agentToUse.personalityTraits.join(', ')}. עליך לשקף תכונות אלו בהתנהגותך ובתגובותיך.\n`;
    }

    const generationPrompt = UI_TEXT.generateScenarioPrompt
      .replace('{{INTERROGATEE_ROLE}}', interrogateeRole)
      .replace('{{DIFFICULTY_LEVEL}}', difficulty)
      .replace('{{INVESTIGATION_TOPIC}}', topic)
      .replace('{{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}', personalityTraitsPromptSection);


    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: generationPrompt,
      config: {
        responseMimeType: "application/json", 
      },
    });
    
    const geminiScenario = parseJsonFromResponse<GeminiJsonScenario>(response.text);
    if (!geminiScenario) return null;

    let scenarioDetailsForAI = `
תפקידך הוא: ${interrogateeRole}
נושא החקירה: ${geminiScenario.caseType}
תיאור המקרה המלא: ${geminiScenario.fullCaseDescription}
פרופיל ה${interrogateeRole} (את/ה):
  שם: ${geminiScenario.interrogateeProfile.name}
  גיל: ${geminiScenario.interrogateeProfile.age}
  עיסוק: ${geminiScenario.interrogateeProfile.occupation}
  ${geminiScenario.interrogateeProfile.address ? `כתובת: ${geminiScenario.interrogateeProfile.address}\n` : ''}`;
    if (geminiScenario.interrogateeProfile.criminalRecord) {
        scenarioDetailsForAI += `  ${geminiScenario.interrogateeProfile.criminalRecord.title} ${geminiScenario.interrogateeProfile.criminalRecord.details}\n`;
    }
    if (geminiScenario.interrogateeProfile.intel) {
        scenarioDetailsForAI += `  ${geminiScenario.interrogateeProfile.intel.title} ${geminiScenario.interrogateeProfile.intel.details}\n`;
    }
     if (geminiScenario.interrogateeProfile.victimDetails) {
        scenarioDetailsForAI += `  פרטי קורבן: ${geminiScenario.interrogateeProfile.victimDetails}\n`;
    }
    if (geminiScenario.interrogateeProfile.witnessDetails) {
        scenarioDetailsForAI += `  פרטי עדות: ${geminiScenario.interrogateeProfile.witnessDetails}\n`;
    }
    
    let motivationHintForSystemPrompt = "";
    if (geminiScenario.interrogateeProfile.underlyingMotivation && geminiScenario.interrogateeProfile.underlyingMotivation.trim() !== "") {
        motivationHintForSystemPrompt = `\nמניע בסיסי נסתר: ${geminiScenario.interrogateeProfile.underlyingMotivation}. עלייך לפעול באופן עקבי עם מניע זה, גם אם אינך חושף/ת אותו ישירות. מניע זה הוא מרכזי בהתנהגותך.\n`;
        // Also add it to scenarioDetailsForAI for completeness if it's useful for the AI to "know" its own motivation details
        scenarioDetailsForAI += `  מניע בסיסי נסתר (שמור בסוד אלא אם כן נחשף באופן טבעי): ${geminiScenario.interrogateeProfile.underlyingMotivation}\n`;
    }

    let behavioralDynamicsHintForSystemPrompt = "";
    if (geminiScenario.interrogateeProfile.behavioralDynamics) {
        const { potentialShifts, hiddenTruths } = geminiScenario.interrogateeProfile.behavioralDynamics;
        let dynamicsText = "\nדינמיקה התנהגותית מיוחדת:\n";
        if (potentialShifts && potentialShifts.trim() !== "") {
            dynamicsText += `  שינויי התנהגות אפשריים: ${potentialShifts}\n`;
        }
        if (hiddenTruths && hiddenTruths.length > 0) {
            dynamicsText += `  אמיתות נסתרות (שמור בסוד אלא אם כן נחשפות באופן טבעי): ${hiddenTruths.join('; ')}\n`;
        }
        behavioralDynamicsHintForSystemPrompt = dynamicsText;
        // Also add it to scenarioDetailsForAI for completeness
        scenarioDetailsForAI += `${dynamicsText}`;
    }
        
    const fullSystemPrompt = agentToUse.baseSystemPrompt
        .replace(/{{INTERROGATEE_ROLE}}/g, interrogateeRole) 
        .replace(/{{DIFFICULTY_LEVEL}}/g, difficulty)
        .replace(/{{SCENARIO_DETAILS_FOR_AI}}/g, scenarioDetailsForAI.trim())
        .replace(/{{EVIDENCE_DETAILS_FOR_AI}}/g, geminiScenario.evidence.items.map(item => `- ${item}`).join('\n'))
        .replace(/{{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}/g, personalityTraitsPromptSection)
        .replace(/{{INTERROGATEE_MOTIVATION_HINT}}/g, motivationHintForSystemPrompt)
        .replace(/{{BEHAVIORAL_DYNAMICS_HINT}}/g, behavioralDynamicsHintForSystemPrompt)
        .replace(/{{TRAINER_INTERVENTION_HINT}}/g, "") // No intervention at scenario generation
        .replace(/{{INVESTIGATION_PROGRESS_HINT}}/g, ""); // No progress hint at scenario generation


    const interrogateeProfile: SuspectProfile = {
        name: geminiScenario.interrogateeProfile.name,
        age: geminiScenario.interrogateeProfile.age,
        occupation: geminiScenario.interrogateeProfile.occupation,
        address: geminiScenario.interrogateeProfile.address,
        criminalRecord: geminiScenario.interrogateeProfile.criminalRecord,
        intel: geminiScenario.interrogateeProfile.intel,
        victimDetails: geminiScenario.interrogateeProfile.victimDetails,
        witnessDetails: geminiScenario.interrogateeProfile.witnessDetails,
        underlyingMotivation: geminiScenario.interrogateeProfile.underlyingMotivation,
        behavioralDynamics: geminiScenario.interrogateeProfile.behavioralDynamics, // Save behavioral dynamics
    };

    return {
      id: `scenario-${Date.now()}`,
      caseType: geminiScenario.caseType,
      fullCaseDescription: geminiScenario.fullCaseDescription,
      interrogateeRole: interrogateeRole,
      interrogateeProfile: interrogateeProfile,
      evidence: geminiScenario.evidence,
      fullSystemPromptForChat: fullSystemPrompt,
      userSelectedDifficulty: difficulty,
      userSelectedTopic: topic,
      customAgentId: agentToUse.id, 
      agentType: agentToUse.agentType, 
      investigationGoals: geminiScenario.investigationGoals || [], // Add investigation goals
      location: undefined, 
      dateTime: undefined,
    };

  } catch (error) {
    console.error("Error generating scenario:", error);
    if (error instanceof Error && (error.message.includes("SAFETY") || error.message.includes("blocked"))) {
        throw new Error(UI_TEXT.errorGeneratingScenario + " (בעיית בטיחות תוכן או חסימה על ידי המודל)");
    }
    return null;
  }
};

export const getSystemPromptWithExtras = (
    baseSystemPrompt: string, 
    interventionHint: string | null,
    investigationProgressHint: string | null,
    motivationHint?: string | null, // Add motivation hint here
    behavioralDynamicsHint?: string | null // Add behavioral dynamics hint
): string => {
    let prompt = baseSystemPrompt;
    
    if (interventionHint && interventionHint.trim() !== "") {
        const hintText = `\nהנחיית מדריך נוספת (לשקול בתגובתך הבאה ולפעול לפיה, זוהי 'לחישה' שלא גלויה לחניך):\n${interventionHint}\n`;
        prompt = prompt.replace(/{{TRAINER_INTERVENTION_HINT}}/g, hintText);
    } else {
        prompt = prompt.replace(/{{TRAINER_INTERVENTION_HINT}}/g, "");
    }

    if (investigationProgressHint && investigationProgressHint.trim() !== "") {
        const progressText = `\nהערה על התקדמות החקירה (השתמש בה כדי להתאים את התנהגותך בעדינות):\n${investigationProgressHint}\n`;
        prompt = prompt.replace(/{{INVESTIGATION_PROGRESS_HINT}}/g, progressText);
    } else {
        prompt = prompt.replace(/{{INVESTIGATION_PROGRESS_HINT}}/g, "");
    }

    // Replace motivation hint if it exists in the base prompt and is provided
    if (prompt.includes("{{INTERROGATEE_MOTIVATION_HINT}}")) {
        if (motivationHint && motivationHint.trim() !== "") {
             const motivationText = `\nמניע בסיסי נסתר: ${motivationHint}.\n`; // Already detailed in prompt
            prompt = prompt.replace(/{{INTERROGATEE_MOTIVATION_HINT}}/g, motivationText);
        } else {
            prompt = prompt.replace(/{{INTERROGATEE_MOTIVATION_HINT}}/g, ""); 
        }
    }
    
    // Replace behavioral dynamics hint
    if (prompt.includes("{{BEHAVIORAL_DYNAMICS_HINT}}")) {
        if (behavioralDynamicsHint && behavioralDynamicsHint.trim() !== "") {
            const dynamicsText = `\nדינמיקה התנהגותית: ${behavioralDynamicsHint}\n`; // Already detailed in prompt
            prompt = prompt.replace(/{{BEHAVIORAL_DYNAMICS_HINT}}/g, dynamicsText);
        } else {
            prompt = prompt.replace(/{{BEHAVIORAL_DYNAMICS_HINT}}/g, "");
        }
    }

    return prompt;
};


export const startChatWithSuspect = async (systemPrompt: string): Promise<GeminiChat | null> => {
  if (!ai) {
    throw new Error(UI_TEXT.errorApiKeyMissing);
  }
  try {
    // Ensure the initial system prompt for the chat does not contain an unfilled intervention or progress placeholder
    // Motivation and behavioral dynamics hints are now part of the base systemPrompt passed in.
    const cleanSystemPrompt = getSystemPromptWithExtras(systemPrompt, null, null, null, null); 
    const chat: GeminiChat = ai.chats.create({
      model: GEMINI_MODEL_TEXT,
      config: {
        systemInstruction: cleanSystemPrompt,
      }
    });
    return chat;
  } catch (error) {
    console.error("Error starting chat:", error);
    return null;
  }
};

const executeToolCall = async (toolCallRequest: ToolCallRequest): Promise<ToolCallResult> => {
    console.log("MCP Enhanced Tool Call: Executing tool call:", toolCallRequest);
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400)); 

    switch (toolCallRequest.toolName) {
        case ToolName.CHECK_POLICE_DATABASE:
            const dbInput = toolCallRequest.toolInput as CheckPoliceDatabaseToolInput;
            const queryLower = dbInput.query.toLowerCase();
            let foundRecords: MockPoliceRecord[] = [];

            if (dbInput.queryType === 'vehicle_plate') {
                foundRecords = MOCK_POLICE_DATABASE_RECORDS.filter(
                    record => record.type === 'vehicle' && record.identifier.toLowerCase().includes(queryLower)
                );
            } else if (dbInput.queryType === 'person_name') {
                foundRecords = MOCK_POLICE_DATABASE_RECORDS.filter(
                    record => record.type === 'person' && record.identifier.toLowerCase().includes(queryLower)
                );
            } else if (dbInput.queryType === 'phone_number') {
                 foundRecords = MOCK_POLICE_DATABASE_RECORDS.filter(
                    record => record.type === 'person' && record.identifier === dbInput.query 
                );
            }
            
            if (foundRecords.length > 0) {
                const details = foundRecords.map(r => r.details + (r.tags && r.tags.length > 0 ? ` (תגיות: ${r.tags.join(', ')})` : '')).join('\n---\n');
                return {
                    toolName: ToolName.CHECK_POLICE_DATABASE,
                    toolOutput: { 
                        found: true, 
                        details: `נמצאו ${foundRecords.length} רשומות התואמות לשאילתה '${dbInput.query}':\n${details}`
                    }
                };
            } else {
                return {
                    toolName: ToolName.CHECK_POLICE_DATABASE,
                    toolOutput: { 
                        found: false, 
                        details: `לא נמצאו רשומות התואמות לשאילתה '${dbInput.query}' (${dbInput.queryType}).` 
                    }
                };
            }
        
        case ToolName.GET_CURRENT_TIME_AND_DATE:
            const hours = 10 + Math.floor(Math.random() * 8); 
            const minutes = Math.floor(Math.random() * 60);
            const day = Math.floor(Math.random() * 28) + 1;
            const month = Math.floor(Math.random() * 12) + 1;
            const year = new Date().getFullYear() - Math.floor(Math.random() * 2); 
            const date = new Date(year, month -1, day, hours, minutes);
            const formattedDateTime = `יום ${date.toLocaleDateString('he-IL', { weekday: 'long' })}, ${date.toLocaleDateString('he-IL')}, ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
            return {
                toolName: ToolName.GET_CURRENT_TIME_AND_DATE,
                toolOutput: { formattedDateTime }
            };

        case ToolName.GENERAL_KNOWLEDGE_CHECK:
            const qInput = toolCallRequest.toolInput as GeneralKnowledgeCheckToolInput;
            const answer = MOCK_GENERAL_KNOWLEDGE_BASE[qInput.question] || "אין לי מידע ספציפי על שאלה זו במאגר הידע המדומה שלי.";
            return {
                toolName: ToolName.GENERAL_KNOWLEDGE_CHECK,
                toolOutput: { answer, source: "simulated_knowledge_base" }
            };
        
        case ToolName.SEARCH_INTERNAL_ARCHIVES:
            const archiveInput = toolCallRequest.toolInput as SearchInternalArchivesToolInput;
            const searchKeywords = archiveInput.keywords.toLowerCase().split(/\s+/).filter(Boolean);
            const matchingDocs = MOCK_INTERNAL_ARCHIVES_RECORDS.filter(doc => 
                doc.type === 'archive_document' &&
                (doc.keywords || []).some(kw => searchKeywords.some(skw => kw.toLowerCase().includes(skw))) &&
                (archiveInput.archiveType ? doc.tags?.includes(archiveInput.archiveType) || doc.identifier.includes(archiveInput.archiveType) : true)
            );

            if (matchingDocs.length > 0) {
                const excerpts = matchingDocs.slice(0, 2).map(doc => ({
                    title: doc.title || doc.identifier,
                    excerpt: doc.details.substring(0, 150) + "..."
                }));
                return {
                    toolName: ToolName.SEARCH_INTERNAL_ARCHIVES,
                    toolOutput: {
                        resultsFound: true,
                        summary: `נמצאו ${matchingDocs.length} מסמכים רלוונטיים. מציג עד 2 תקצירים.`,
                        documentExcerpts: excerpts
                    }
                };
            } else {
                return {
                    toolName: ToolName.SEARCH_INTERNAL_ARCHIVES,
                    toolOutput: { resultsFound: false, summary: "לא נמצאו מסמכים התואמים לחיפוש בארכיון הפנימי." }
                };
            }

        case ToolName.REQUEST_FORENSIC_ANALYSIS:
            const forensicInput = toolCallRequest.toolInput as RequestForensicAnalysisToolInput;
            const mockReport = MOCK_FORENSIC_REPORTS.find(report => 
                report.keywords?.includes(forensicInput.analysisType) && 
                (report.title?.toLowerCase().includes(forensicInput.evidenceItemId.toLowerCase()) || report.details.toLowerCase().includes(forensicInput.evidenceItemId.toLowerCase()))
            );

            if (mockReport) {
                return {
                    toolName: ToolName.REQUEST_FORENSIC_ANALYSIS,
                    toolOutput: {
                        reportId: mockReport.identifier,
                        preliminaryFindings: mockReport.details.substring(0, mockReport.details.indexOf('.') + 1) || "ממצאים ראשוניים בבדיקה.",
                        estimatedCompletionTime: `${Math.floor(Math.random() * 5) + 1} ימי עסקים`
                    }
                };
            } else {
                return {
                    toolName: ToolName.REQUEST_FORENSIC_ANALYSIS,
                    toolOutput: {
                        reportId: `FR-ERR-${Date.now()}`,
                        preliminaryFindings: `לא ניתן היה ליצור דוח ראשוני עבור '${forensicInput.evidenceItemId}' מסוג '${forensicInput.analysisType}' כרגע.`,
                        estimatedCompletionTime: "לא ידוע"
                    }
                };
            }


        default:
            return { 
                toolName: toolCallRequest.toolName, 
                toolOutput: { found: false, details: "כלי לא מוכר או שלא ניתן לבצע כרגע." } as any, 
                error: "כלי לא מוכר" 
            };
    }
};


export const sendChatMessage = async (
    chat: GeminiChat, 
    messageText: string,
    scenario: Scenario, 
    chatHistoryForContext: SimpleChatMessage[], 
    interrogateeEmotionalStateHint: string | undefined, // This is an older mechanism, consider phasing out or integrating with progress
    currentInvestigationFocus: string | undefined, // This is an older mechanism
    userCommand?: UserCommand | null 
    ): Promise<{ text: string | null; directives: AvatarControlPayload | null | undefined }> => {
  if (!ai) {
    throw new Error(UI_TEXT.errorApiKeyMissing);
  }
  try {
    let interventionHintForSystemPrompt: string | null = null;
    if (userCommand) {
        console.log("[GeminiService] Processing UserCommand for system instruction:", userCommand);
        let hintParts: string[] = [];
        switch (userCommand.commandType) {
            case UserCommandType.FORCE_EMOTIONAL_STATE:
                const emotionalPayload = userCommand.payload as ForceEmotionalStatePayload;
                hintParts.push(`התנהג כאילו מצבך הרגשי הוא '${emotionalPayload.emotionalState}'.`);
                break;
            case UserCommandType.REVEAL_SPECIFIC_INFO_HINT:
                const infoPayload = userCommand.payload as RevealSpecificInfoHintPayload;
                hintParts.push(`נסה לרמוז או להוביל בעדינות למידע הבא במהלך תגובתך: "${infoPayload.infoToRevealHint}".`);
                break;
            case UserCommandType.INCREASE_RESISTANCE:
                hintParts.push(`הגבר את רמת ההתנגדות שלך והיה פחות משתף פעולה, תוך שמירה על אמינות הדמות.`);
                break;
            case UserCommandType.DECREASE_RESISTANCE:
                hintParts.push(`הפחת את רמת ההתנגדות שלך והיה יותר משתף פעולה, תוך שמירה על אמינות הדמות.`);
                break;
            case UserCommandType.SEND_WHISPER:
                const whisperPayload = userCommand.payload as SendWhisperPayload;
                hintParts.push(whisperPayload.whisperText); // Directly use the whisper text
                break;
            case UserCommandType.TRIGGER_INTERRUPTION: // New command type
                const interruptionPayload = userCommand.payload as TriggerInterruptionPayload;
                const interruptionTypeDisplay = InterruptionTypeDisplay[interruptionPayload.interruptionType] || interruptionPayload.interruptionType;
                hintParts.push(`התרחשה הפרעה: ${interruptionTypeDisplay}. ${interruptionPayload.details} הגב לכך באופן טבעי בהתאם לדמותך ולסיטואציה.`);
                break;
        }
        if (hintParts.length > 0) {
            interventionHintForSystemPrompt = hintParts.join(' ');
        }
    }

    // Determine investigation progress hint
    const aiResponseCount = chatHistoryForContext.filter(msg => msg.speaker === 'ai').length;
    let investigationProgressHintText: string | null = null;
    if (aiResponseCount <= 3) {
        investigationProgressHintText = "החקירה/האינטראקציה בתחילתה. שקול להיות זהיר או לנסות להבין את כוונות המשתמש.";
    } else if (aiResponseCount <= 8) {
        investigationProgressHintText = "החקירה/האינטראקציה מתקדמת. שקול להתאים את התנהגותך בהתאם לאופן שבו המשתמש מנהל את השיחה (למשל, יותר לחוץ אם יש לחץ, יותר פתוח אם יש אמון).";
    } else {
        investigationProgressHintText = "החקירה/האינטראקציה בשלב מתקדם. שקול להפגין סימני עייפות, מתח מוגבר, או נחישות להגן על עמדתך.";
    }
    
    // For non-interrogation agents, the progress hint might be less relevant or need different phrasing.
    if (scenario.agentType !== 'interrogation') {
        if (aiResponseCount <= 2) {
            investigationProgressHintText = "האינטראקציה עם הסוכן בתחילתה. נסה להבין את יכולותיו.";
        } else if (aiResponseCount <= 5) {
            investigationProgressHintText = "האינטראקציה עם הסוכן מתקדמת. אם אתה זקוק למידע ספציפי, נסח את בקשתך בבירור.";
        } else {
            investigationProgressHintText = "האינטראקציה עם הסוכן נמשכת. אם הסוכן לא מספק את המידע הרצוי, נסה לנסח מחדש או לבקש סיכום.";
        }
    }


    const baseSystemPrompt = scenario.fullSystemPromptForChat || UI_TEXT.scenarioSystemPromptTemplate; 
    // Motivation and Behavioral Dynamics hints are now part of baseSystemPrompt.
    const updatedSystemInstruction = getSystemPromptWithExtras(
        baseSystemPrompt, 
        interventionHintForSystemPrompt, 
        investigationProgressHintText, 
        null, // Motivation hint already in base
        null  // Behavioral dynamics hint already in base
    );


    let contextPreambleParts: string[] = [];
    if (chatHistoryForContext && chatHistoryForContext.length > 0) {
      const recentHistory = chatHistoryForContext.slice(-10); // Use last 10 messages for context
      contextPreambleParts.push("הקשר שיחה אחרון (לעיון פנימי שלך, אל תתייחס אליו ישירות בתשובתך אלא אם כן רלוונטי לתוכן השיחה):\n" +
        recentHistory
          .map(msg => `${msg.speaker === 'user' ? 'משתמש' : (scenario.agentType === 'interrogation' ? 'נחקר (את/ה)' : 'סוכן (את/ה)')}: ${msg.text}`)
          .join('\n'));
    }
    
    if (interrogateeEmotionalStateHint && (!userCommand || userCommand.commandType !== UserCommandType.FORCE_EMOTIONAL_STATE) && scenario.agentType === 'interrogation') {
      contextPreambleParts.push(`מידע נוסף: מצבך הרגשי כפי שדווח קודם הוא '${interrogateeEmotionalStateHint}'.`);
    }
    if (currentInvestigationFocus && scenario.agentType === 'interrogation') {
      contextPreambleParts.push(`מידע נוסף: מיקוד החקירה הנוכחי של החוקר הוא '${currentInvestigationFocus}'.`);
    }

    let finalMessageToServer = messageText;
    if (contextPreambleParts.length > 0) {
        finalMessageToServer = contextPreambleParts.join('\n\n') + `\n\nהודעת ה${scenario.agentType === 'interrogation' ? 'חוקר' : 'משתמש'} הנוכחית:\n` + messageText;
    }
    
    const response: GenerateContentResponse = await chat.sendMessage({ 
        message: finalMessageToServer,
        config: { systemInstruction: updatedSystemInstruction }
    });
    const parsedResponse = parseJsonFromResponse<AIResponseWithDirectives>(response.text);

    if (parsedResponse?.toolCallRequest) {
        console.log("MCP Step 4: AI requested a tool call:", parsedResponse.toolCallRequest);
        const intermediateText = parsedResponse.textResponse;
        const toolResult = await executeToolCall(parsedResponse.toolCallRequest);
        console.log("MCP Step 4: Tool call result:", toolResult);
        
        const messageWithToolResult = `
המשך השיחה לאחר הפעלת כלי.
ההודעה הקודמת שלך (שבה ביקשת את הכלי): ${intermediateText || "(לא סופק טקסט עם בקשת הכלי)"}
תוצאת הפעלת הכלי '${toolResult.toolName}':
${toolResult.error ? `שגיאה בהפעלת הכלי: ${toolResult.error}` : JSON.stringify(toolResult.toolOutput, null, 2)}

בהתבסס על תוצאת הכלי והשיחה עד כה, המשך את תגובתך ל${scenario.agentType === 'interrogation' ? 'חוקר' : 'משתמש'}. זכור לכלול את כל השדות הנדרשים ב-JSON, כולל textResponse והנחיות אווטאר אם יש.
        `;
        
        const secondApiResponse: GenerateContentResponse = await chat.sendMessage({
            message: messageWithToolResult,
            config: { systemInstruction: updatedSystemInstruction } 
        });
        const finalParsedResponse = parseJsonFromResponse<AIResponseWithDirectives>(secondApiResponse.text);

        if (finalParsedResponse) {
            return {
                text: finalParsedResponse.textResponse || "לאחר בדיקה, " + (intermediateText || "אני ממשיך."), 
                directives: finalParsedResponse.directives || null,
            };
        } else {
            return { text: "שגיאה בעיבוד תגובת ה-AI לאחר שימוש בכלי.", directives: null };
        }

    } else if (parsedResponse) {
      return {
        text: parsedResponse.textResponse || null,
        directives: parsedResponse.directives || null, 
      };
    } else {
      console.warn("Could not parse AI response as structured JSON, and no textResponse was extracted. This should be rare.");
      return { text: response.text || "שגיאה בעיבוד תגובת ה-AI.", directives: null };
    }

  } catch (error) {
    console.error("Error sending message:", error);
     if (error instanceof Error && (error.message.includes("SAFETY") || error.message.includes("blocked"))) {
        return { text: "מצטער, לא אוכל להגיב על כך עקב מדיניות התוכן.", directives: null };
    }
    return { text: null, directives: null };
  }
};

export const generateFeedbackForSession = async (
    chatTranscript: ChatMessage[], 
    interrogateeRole: InterrogateeRole, 
    difficulty: DifficultyLevel, 
    topic: string,
    usedHintsCount: number 
    ): Promise<Feedback | null> => {
  if (!ai) {
    throw new Error(UI_TEXT.errorApiKeyMissing);
  }
  try {
    const transcriptJsonString = JSON.stringify(chatTranscript.map(msg => ({sender: msg.sender, text: msg.text })));
    const prompt = UI_TEXT.generateFeedbackPromptTemplate
        .replace('{{CHAT_TRANSCRIPT_JSON_STRING}}', transcriptJsonString)
        .replace('{{INTERROGATEE_ROLE}}', interrogateeRole)
        .replace('{{DIFFICULTY_LEVEL}}', difficulty)
        .replace('{{INVESTIGATION_TOPIC}}', topic)
        .replace('{{USED_HINTS_COUNT}}', usedHintsCount.toString()); 
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json", 
      }
    });
    
    return parseJsonFromResponse<Feedback>(response.text);

  } catch (error) {
    console.error("Error generating feedback:", error);
    if (error instanceof Error && (error.message.includes("SAFETY") || error.message.includes("blocked"))) {
        throw new Error(UI_TEXT.errorGeneratingFeedback + " (בעיית בטיחות תוכן או חסימה על ידי המודל)");
    }
    return null;
  }
};

export const sendCommandToSession = (sessionId: string, command: UserCommand): void => {
    const event = new CustomEvent('trainer-intervention-command', {
        detail: { sessionId, command }
    });
    window.dispatchEvent(event);
    console.log(`[GeminiService (Event)] Command dispatched for session ${sessionId}:`, command);
};

export const generateContextualHint = async (
    chatHistory: SimpleChatMessage[],
    scenario: Scenario,
    currentQuestion?: string
): Promise<string | null> => {
    if (!ai) {
        throw new Error(UI_TEXT.errorApiKeyMissing);
    }
    try {
        const chatHistoryJsonString = JSON.stringify(chatHistory.slice(-10)); // Use last 10 messages for context for hints as well
        
        let scenarioDetailsForAI = `
תפקיד הנחקר/סוכן הוא: ${scenario.interrogateeRole} (עשוי להיות N/A לסוכנים כלליים)
נושא החקירה/המשימה: ${scenario.caseType}
תיאור המקרה/הסוכן המלא: ${scenario.fullCaseDescription}
`;
        if (scenario.agentType === 'interrogation' && scenario.interrogateeRole !== 'N/A' && scenario.interrogateeProfile) {
            const profile = scenario.interrogateeProfile as SuspectProfile; // Cast to full profile
            scenarioDetailsForAI += `פרופיל הנחקר:
  שם: ${profile.name}
  גיל: ${profile.age}
  עיסוק: ${profile.occupation}
`;
            if (profile.criminalRecord?.details) {
                scenarioDetailsForAI += `  עבר פלילי: ${profile.criminalRecord.details}\n`;
            }
            if (profile.intel?.details) {
                scenarioDetailsForAI += `  מידע מודיעיני: ${profile.intel.details}\n`;
            }
            if (profile.underlyingMotivation) {
                scenarioDetailsForAI += `  מניע נסתר (לידיעתך בלבד): ${profile.underlyingMotivation}\n`;
            }
            if (profile.behavioralDynamics?.potentialShifts) {
                 scenarioDetailsForAI += `  שינויי התנהגות אפשריים (לידיעתך בלבד): ${profile.behavioralDynamics.potentialShifts}\n`;
            }
             if (profile.behavioralDynamics?.hiddenTruths && profile.behavioralDynamics.hiddenTruths.length > 0) {
                 scenarioDetailsForAI += `  אמיתות נסתרות (לידיעתך בלבד): ${profile.behavioralDynamics.hiddenTruths.join('; ')}\n`;
            }
            if (scenario.evidence.items[0] !== 'N/A') {
                scenarioDetailsForAI += `ראיות בידי החוקר: ${scenario.evidence.items.join(', ')}\n`;
            }
        }


        const prompt = UI_TEXT.generateContextualHintPromptTemplate
            .replace('{{INTERROGATEE_ROLE}}', scenario.interrogateeRole as string) 
            .replace('{{DIFFICULTY_LEVEL}}', scenario.userSelectedDifficulty as string) 
            .replace('{{INVESTIGATION_TOPIC}}', scenario.userSelectedTopic)
            .replace('{{SCENARIO_DETAILS_FOR_AI}}', scenarioDetailsForAI.trim())
            .replace('{{CHAT_HISTORY_JSON_STRING}}', chatHistoryJsonString)
            .replace('{{CURRENT_QUESTION_CONTEXT}}', currentQuestion ? `השאלה האחרונה של המשתמש (אם רלוונטי): ${currentQuestion}` : "לא סופקה שאלה אחרונה של המשתמש.");

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
        });

        const hintText = response.text?.trim();
        if (!hintText) {
            console.warn("Contextual hint generation returned empty text.");
            return UI_TEXT.noMoreHints; // Fallback
        }
        return hintText;

    } catch (error) {
        console.error("Error generating contextual hint:", error);
        if (error instanceof Error && (error.message.includes("SAFETY") || error.message.includes("blocked"))) {
             return UI_TEXT.errorGeneratingHint + " (בעיית בטיחות תוכן או חסימה)";
        }
        return UI_TEXT.errorGeneratingHint;
    }
};

export interface AgentConfigGenerationResult {
    name: string;
    description: string;
    baseSystemPrompt: string;
    personalityTraits: string[];
}

export const generateAgentConfigurationFromDescription = async (
    userDescription: string
): Promise<AgentConfigGenerationResult | null> => {
    if (!ai) {
        throw new Error(UI_TEXT.errorApiKeyMissing);
    }
    try {
        const prompt = UI_TEXT.generateAgentConfigPrompt.replace("{{USER_DESCRIPTION}}", userDescription);
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        return parseJsonFromResponse<AgentConfigGenerationResult>(response.text);
    } catch (error) {
        console.error("Error generating agent configuration from description:", error);
        return null;
    }
};

export const refineAgentConfiguration = async (
    currentConfig: AgentConfigGenerationResult,
    refinementInstructions: string
): Promise<AgentConfigGenerationResult | null> => {
    if (!ai) {
        throw new Error(UI_TEXT.errorApiKeyMissing);
    }
    try {
        const prompt = UI_TEXT.refineAgentConfigPrompt
            .replace("{{CURRENT_NAME}}", currentConfig.name)
            .replace("{{CURRENT_DESCRIPTION}}", currentConfig.description)
            .replace("{{CURRENT_BASE_PROMPT}}", currentConfig.baseSystemPrompt)
            .replace("{{CURRENT_PERSONALITY_TRAITS}}", currentConfig.personalityTraits.join(', '))
            .replace("{{REFINEMENT_INSTRUCTIONS}}", refinementInstructions);

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        return parseJsonFromResponse<AgentConfigGenerationResult>(response.text);
    } catch (error) {
        console.error("Error refining agent configuration:", error);
        return null;
    }
};
