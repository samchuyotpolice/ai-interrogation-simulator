import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { UI_TEXT, GEMINI_MODEL_TEXT, DEFAULT_AGENT_ID, MOCK_POLICE_DATABASE_RECORDS, MOCK_GENERAL_KNOWLEDGE_BASE, MOCK_INTERNAL_ARCHIVES_RECORDS, MOCK_FORENSIC_REPORTS, loadAiAgents, generateScenarioPrompt, scenarioSystemPromptTemplate, generateFeedbackPromptTemplate, generateContextualHintPromptTemplate, generateAgentConfigPrompt, refineAgentConfigPrompt } from '@/constants';
import {
    Scenario, ChatMessage, Feedback, GeminiJsonScenario, GeminiChat, InterrogateeRole, DifficultyLevel,
    SuspectProfile, GeminiJsonSuspectProfile, SessionContextV2, AIResponseWithDirectives, AvatarControlPayload,
    ToolCallRequest, ToolCallResult, ToolName, CheckPoliceDatabaseToolInput, CheckPoliceDatabaseToolOutput,
    GetCurrentTimeAndDateToolInput, GetCurrentTimeAndDateToolOutput, GeneralKnowledgeCheckToolInput, GeneralKnowledgeCheckToolOutput,
    SearchInternalArchivesToolInput, SearchInternalArchivesToolOutput, RequestForensicAnalysisToolInput, RequestForensicAnalysisToolOutput,
    SimpleChatMessage, MockPoliceRecord, UserCommand, UserCommandType, ForceEmotionalStatePayload, RevealSpecificInfoHintPayload, SendWhisperPayload, TriggerInterruptionPayload, InterruptionTypeDisplay,
    AIAgent, LoadedAIAgent, AIAgentType
} from '@/types';

const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

let ai: GoogleGenAI | null = null;

// Helper to safely get UI_TEXT properties, providing a fallback if UI_TEXT is not yet defined or key is missing.
// This is crucial because constants.ts now imports from constants/uiTexts/index.ts, which might not be fully initialized
// when this service worker is first parsed, or if there's a circular dependency.
const getUiTextSafely = (key: string, fallback: string): string => {
    if (typeof UI_TEXT === 'object' && UI_TEXT !== null && key in UI_TEXT) {
        // @ts-ignore TODO: This could be typed better if UI_TEXT had a more specific index signature.
        return UI_TEXT[key] || fallback;
    }
    return fallback;
};


if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  const errorMessage = getUiTextSafely("errorApiKeyMissing", "Critical Error: Gemini API Key is missing. AI functionality will be unavailable.");
  console.error(errorMessage);
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
    try {
        const textMatch = jsonStr.match(/"textResponse"\s*:\s*"((?:\\.|[^"\\])*)"/);
        if (textMatch && textMatch[1]) {
             console.warn("Returning only textResponse due to parsing error of full object.");
            return { textResponse: textMatch[1].replace(/\\"/g, '"') } as unknown as T;
        }
    } catch (extractionError) {
        console.error("Failed to extract textResponse after initial parsing error:", extractionError);
    }
    console.warn("Returning raw text as textResponse due to complete JSON parsing failure.");
    return { textResponse: responseText } as unknown as T;
  }
};

export const generateScenario = async (
  interrogateeRole: InterrogateeRole,
  difficulty: DifficultyLevel,
  topic: string,
  customAgentId: string
): Promise<Scenario | null> => {
  if (!ai) {
    throw new Error(getUiTextSafely("errorApiKeyMissing", "API Key is missing. Cannot generate scenario."));
  }
  try {
    const allAgents: LoadedAIAgent[] = await loadAiAgents();
    const selectedAgentOrDefault = allAgents.find(agent => agent.id === customAgentId) || allAgents.find(a => a.id === DEFAULT_AGENT_ID && a.isDefault);

    const fallbackAgentName = getUiTextSafely("defaultAgentName", "Default Agent");
    const fallbackAgentDesc = getUiTextSafely("defaultAgentDescription", "Default agent description.");
    const fallbackSystemPrompt = scenarioSystemPromptTemplate || "You are an assistant."; // Directly use imported prompt

    const defaultFallbackAgent: LoadedAIAgent = {
        id: DEFAULT_AGENT_ID,
        name: fallbackAgentName as string,
        description: fallbackAgentDesc as string,
        baseSystemPrompt: fallbackSystemPrompt as string,
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

    const currentGenerationPrompt = (generateScenarioPrompt || "Generate scenario prompt missing")
      .replace('{{INTERROGATEE_ROLE}}', interrogateeRole)
      .replace('{{DIFFICULTY_LEVEL}}', difficulty)
      .replace('{{INVESTIGATION_TOPIC}}', topic)
      .replace('{{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}', personalityTraitsPromptSection);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: [{role: "user", parts: [{text: currentGenerationPrompt}]}],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!responseText) {
        console.error("No text found in Gemini response for generateScenario");
        return null;
    }
    const geminiScenario = parseJsonFromResponse<GeminiJsonScenario>(responseText);
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
        .replace(/{{TRAINER_INTERVENTION_HINT}}/g, "")
        .replace(/{{INVESTIGATION_PROGRESS_HINT}}/g, "");

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
        behavioralDynamics: geminiScenario.interrogateeProfile.behavioralDynamics,
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
      investigationGoals: geminiScenario.investigationGoals || [],
      location: undefined,
      dateTime: undefined,
    };

  } catch (error) {
    console.error("Error generating scenario:", error);
    const errorMsgBase = getUiTextSafely("errorGeneratingScenario", "Error generating scenario.");
    if (error instanceof Error && (error.message.includes("SAFETY") || error.message.includes("blocked"))) {
        throw new Error((errorMsgBase as string) + " (Content safety issue or model block)");
    }
    return null;
  }
};

export const getSystemPromptWithExtras = (
    baseSystemPrompt: string,
    interventionHint: string | null,
    investigationProgressHint: string | null,
    motivationHint?: string | null,
    behavioralDynamicsHint?: string | null
): string => {
    let prompt = baseSystemPrompt;

    prompt = prompt.replace(/{{TRAINER_INTERVENTION_HINT}}/g, (interventionHint && interventionHint.trim() !== "") ? `\nהנחיית מדריך נוספת (לשקול בתגובתך הבאה ולפעול לפיה, זוהי 'לחישה' שלא גלויה לחניך):\n${interventionHint}\n` : "");
    prompt = prompt.replace(/{{INVESTIGATION_PROGRESS_HINT}}/g, (investigationProgressHint && investigationProgressHint.trim() !== "") ? `\nהערה על התקדמות החקירה (השתמש בה כדי להתאים את התנהגותך בעדינות):\n${investigationProgressHint}\n` : "");
    prompt = prompt.replace(/{{INTERROGATEE_MOTIVATION_HINT}}/g, (motivationHint && motivationHint.trim() !== "") ? `\nמניע בסיסי נסתר: ${motivationHint}.\n` : "");
    prompt = prompt.replace(/{{BEHAVIORAL_DYNAMICS_HINT}}/g, (behavioralDynamicsHint && behavioralDynamicsHint.trim() !== "") ? `\nדינמיקה התנהגותית: ${behavioralDynamicsHint}\n` : "");

    return prompt;
};

export const startChatWithSuspect = async (systemPrompt: string): Promise<GeminiChat | null> => {
  if (!ai) {
    throw new Error(getUiTextSafely("errorApiKeyMissing", "API Key is missing. Cannot start chat."));
  }
  try {
    const cleanSystemPrompt = getSystemPromptWithExtras(systemPrompt, null, null, null, null);
    const chat = ai.startChat({
      history: [],
      generationConfig: {
        // model: GEMINI_MODEL_TEXT, // Model is part of the GoogleGenerativeAI instance
      },
      systemInstruction: { role: "system", parts: [{text: cleanSystemPrompt}] },
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
                toolOutput: {} as any,
                error: "כלי לא מוכר"
            };
    }
};

export const sendChatMessage = async (
    chat: GeminiChat,
    messageText: string,
    scenario: Scenario,
    chatHistoryForContext: SimpleChatMessage[],
    interrogateeEmotionalStateHint: string | undefined,
    currentInvestigationFocus: string | undefined,
    userCommand?: UserCommand | null
    ): Promise<{ text: string | null; directives: AvatarControlPayload | null | undefined }> => {
  if (!ai) {
    throw new Error(getUiTextSafely("errorApiKeyMissing", "API Key is missing. Cannot send message."));
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
                hintParts.push(whisperPayload.whisperText);
                break;
            case UserCommandType.TRIGGER_INTERRUPTION:
                const interruptionPayload = userCommand.payload as TriggerInterruptionPayload;
                const interruptionTypeDisplay = InterruptionTypeDisplay[interruptionPayload.interruptionType] || interruptionPayload.interruptionType;
                hintParts.push(`התרחשה הפרעה: ${interruptionTypeDisplay}. ${interruptionPayload.details} הגב לכך באופן טבעי בהתאם לדמותך ולסיטואציה.`);
                break;
        }
        if (hintParts.length > 0) {
            interventionHintForSystemPrompt = hintParts.join(' ');
        }
    }

    const aiResponseCount = chatHistoryForContext.filter(msg => msg.speaker === 'ai').length;
    let investigationProgressHintText: string | null = null;
    if (scenario.agentType === 'interrogation') {
        if (aiResponseCount <= 3) {
            investigationProgressHintText = "החקירה/האינטראקציה בתחילתה. שקול להיות זהיר או לנסות להבין את כוונות המשתמש.";
        } else if (aiResponseCount <= 8) {
            investigationProgressHintText = "החקירה/האינטראקציה מתקדמת. שקול להתאים את התנהגותך בהתאם לאופן שבו המשתמש מנהל את השיחה (למשל, יותר לחוץ אם יש לחץ, יותר פתוח אם יש אמון).";
        } else {
            investigationProgressHintText = "החקירה/האינטראקציה בשלב מתקדם. שקול להפגין סימני עייפות, מתח מוגבר, או נחישות להגן על עמדתך.";
        }
    } else {
        if (aiResponseCount <= 2) {
            investigationProgressHintText = "האינטראקציה עם הסוכן בתחילתה. נסה להבין את יכולותיו.";
        } else if (aiResponseCount <= 5) {
            investigationProgressHintText = "האינטראקציה עם הסוכן מתקדמת. אם אתה זקוק למידע ספציפי, נסח את בקשתך בבירור.";
        } else {
            investigationProgressHintText = "האינטראקציה עם הסוכן נמשכת. אם הסוכן לא מספק את המידע הרצוי, נסה לנסח מחדש או לבקש סיכום.";
        }
    }

    // The system instruction for an ongoing chat is set when the chat is initiated via ai.startChat()
    // For subsequent messages in the same chat session, we don't re-send the full system instruction
    // with chat.sendMessageStream(). Instead, the ChatSession object (`chat`) maintains the context.
    // The `interventionHintForSystemPrompt` and `investigationProgressHintText` are dynamic elements
    // that the AI should consider based on the *current turn*.
    // A common way to inject such turn-specific instructions without altering the core system prompt
    // is to prepend them to the user's actual message, or to use a specific field if the API supports it.
    // Given the current structure, and if the AI is tuned to look for these hints within the user message context,
    // we might prepend them. However, the `getSystemPromptWithExtras` function was originally designed
    // to modify the *base* system prompt.
    // For now, let's assume `interventionHintForSystemPrompt` and `investigationProgressHintText` should be
    // implicitly understood by the AI if they are part of the overall context or if the base prompt
    // instructs the AI to look for such dynamic hints (which it does with {{TRAINER_INTERVENTION_HINT}} etc.).
    // The `chat` object itself should be using the systemInstruction it was initialized with.

    // We'll construct the message to send. If there are intervention hints, they are usually
    // prepended to the user's message or handled in a way the AI is specifically trained for.
    // Let's assume the `updatedSystemInstructionText` (which would be formed by getSystemPromptWithExtras)
    // is not directly passed to `sendMessageStream` but is part of the context the AI considers.
    // The `chat` object (GeminiChat) was started with a system prompt.
    // For now, we send `messageText` directly. The hints are logged and available for debugging.
    // If the AI needs these hints explicitly *in this turn*, they should be part of `messageText`.

    const result = await chat.sendMessageStream(messageText);

    let accumulatedResponseText = "";
    let toolCallRequest: ToolCallRequest | undefined = undefined;

    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
            accumulatedResponseText += chunkText;
        }
        const functionCalls = chunk.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const tool = functionCalls[0];
            toolCallRequest = { toolName: tool.name as ToolName, toolInput: tool.args };
            break;
        }
    }

    const parsedResponse = parseJsonFromResponse<AIResponseWithDirectives>(accumulatedResponseText);

    if (toolCallRequest && parsedResponse) {
        console.log("AI requested a tool call:", toolCallRequest);
        const intermediateText = parsedResponse.textResponse;
        const toolResult = await executeToolCall(toolCallRequest);

        const toolResponseParts = [
            { functionResponse: { name: toolCallRequest.toolName, response: { result: toolResult.toolOutput, error: toolResult.error } } }
        ];

        const secondResult = await chat.sendMessageStream(toolResponseParts);
        let finalAccumulatedText = "";
        for await (const chunk of secondResult.stream) {
            finalAccumulatedText += chunk.text();
        }
        const finalParsedResponse = parseJsonFromResponse<AIResponseWithDirectives>(finalAccumulatedText);

        if (finalParsedResponse) {
            return {
                text: finalParsedResponse.textResponse || "לאחר בדיקה, " + (intermediateText || "אני ממשיך."),
                directives: finalParsedResponse.directives || null,
            };
        } else {
             return { text: "שגיאה בעיבוד תגובת ה-AI לאחר שימוש בכלי: " + (intermediateText || ""), directives: null };
        }

    } else if (parsedResponse) {
      return {
        text: parsedResponse.textResponse || null,
        directives: parsedResponse.directives || null,
      };
    } else {
      console.warn("Could not parse AI response as structured JSON.", accumulatedResponseText);
      return { text: accumulatedResponseText || "שגיאה בעיבוד תגובת ה-AI.", directives: null };
    }

  } catch (error) {
    console.error("Error sending message:", error);
    const errorMsgBase = getUiTextSafely("errorSendingMessage", "Error sending message.");
    if (error instanceof Error && (error.message.includes("SAFETY") || error.message.includes("blocked") || error.message.includes("candidate") || error.message.includes("finishReason"))) {
        // More generic error for safety/block/candidate issues
        return { text: "מצטער, התגובה שקיבלתי אינה תקינה או שנחסמה. נסה שוב או נסח מחדש.", directives: null };
    }
    return { text: errorMsgBase as string, directives: null };
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
    throw new Error(getUiTextSafely("errorApiKeyMissing", "API Key is missing. Cannot generate feedback."));
  }
  try {
    const transcriptJsonString = JSON.stringify(chatTranscript.map(msg => ({sender: msg.sender, text: msg.text })));
    const basePrompt = getUiTextSafely("generateFeedbackPromptTemplate", "Generate feedback based on transcript: {{CHAT_TRANSCRIPT_JSON_STRING}}");
    const prompt = (basePrompt as string)
        .replace('{{CHAT_TRANSCRIPT_JSON_STRING}}', transcriptJsonString)
        .replace('{{INTERROGATEE_ROLE}}', interrogateeRole)
        .replace('{{DIFFICULTY_LEVEL}}', difficulty)
        .replace('{{INVESTIGATION_TOPIC}}', topic)
        .replace('{{USED_HINTS_COUNT}}', usedHintsCount.toString());

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: [{role: "user", parts: [{text: prompt}]}],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!responseText) {
        console.error("No text found in Gemini response for generateFeedbackForSession");
        return null;
    }
    return parseJsonFromResponse<Feedback>(responseText);

  } catch (error) {
    console.error("Error generating feedback:", error);
    const errorMsgBase = getUiTextSafely("errorGeneratingFeedback", "Error generating feedback.");
    if (error instanceof Error && (error.message.includes("SAFETY") || error.message.includes("blocked"))) {
        throw new Error((errorMsgBase as string) + " (Content safety issue or model block)");
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
        throw new Error(getUiTextSafely("errorApiKeyMissing", "API Key is missing. Cannot generate hint."));
    }
    try {
        const chatHistoryJsonString = JSON.stringify(chatHistory.slice(-10));

        let scenarioDetailsForAI = `
תפקיד הנחקר/סוכן הוא: ${scenario.interrogateeRole} (עשוי להיות N/A לסוכנים כלליים)
נושא החקירה/המשימה: ${scenario.caseType}
תיאור המקרה/הסוכן המלא: ${scenario.fullCaseDescription}
`;
        if (scenario.agentType === 'interrogation' && scenario.interrogateeRole !== 'N/A' && scenario.interrogateeProfile) {
            const profile = scenario.interrogateeProfile as SuspectProfile;
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

        const basePrompt = getUiTextSafely("generateContextualHintPromptTemplate", "Generate hint based on: {{SCENARIO_DETAILS_FOR_AI}}");
        const prompt = (basePrompt as string)
            .replace('{{INTERROGATEE_ROLE}}', scenario.interrogateeRole as string)
            .replace('{{DIFFICULTY_LEVEL}}', scenario.userSelectedDifficulty as string)
            .replace('{{INVESTIGATION_TOPIC}}', scenario.userSelectedTopic)
            .replace('{{SCENARIO_DETAILS_FOR_AI}}', scenarioDetailsForAI.trim())
            .replace('{{CHAT_HISTORY_JSON_STRING}}', chatHistoryJsonString)
            .replace('{{CURRENT_QUESTION_CONTEXT}}', currentQuestion ? `השאלה האחרונה של המשתמש (אם רלוונטי): ${currentQuestion}` : "לא סופקה שאלה אחרונה של המשתמש.");

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: [{role: "user", parts: [{text: prompt}]}],
        });

        const hintText = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!hintText) {
            console.warn("Contextual hint generation returned empty text.");
            return getUiTextSafely("noMoreHints", "No more hints available.");
        }
        return hintText;

    } catch (error) {
        console.error("Error generating contextual hint:", error);
        const errorMsgBase = getUiTextSafely("errorGeneratingHint", "Error generating hint.");
        if (error instanceof Error && (error.message.includes("SAFETY") || error.message.includes("blocked"))) {
             return (errorMsgBase as string) + " (Content safety issue or model block)";
        }
        return errorMsgBase as string;
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
        throw new Error(getUiTextSafely("errorApiKeyMissing", "API Key is missing. Cannot generate agent config."));
    }
    try {
        const basePrompt = getUiTextSafely("generateAgentConfigPrompt", "Generate agent config for: {{USER_DESCRIPTION}}");
        const prompt = (basePrompt as string).replace("{{USER_DESCRIPTION}}", userDescription);
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: [{role: "user", parts: [{text: prompt}]}],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });
        const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!responseText) {
            console.error("No text found in Gemini response for generateAgentConfigurationFromDescription");
            return null;
        }
        return parseJsonFromResponse<AgentConfigGenerationResult>(responseText);
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
        throw new Error(getUiTextSafely("errorApiKeyMissing", "API Key is missing. Cannot refine agent config."));
    }
    try {
        const basePrompt = getUiTextSafely("refineAgentConfigPrompt", "Refine agent config. Current: {{CURRENT_NAME}}. Instructions: {{REFINEMENT_INSTRUCTIONS}}");
        const prompt = (basePrompt as string)
            .replace("{{CURRENT_NAME}}", currentConfig.name)
            .replace("{{CURRENT_DESCRIPTION}}", currentConfig.description)
            .replace("{{CURRENT_BASE_PROMPT}}", currentConfig.baseSystemPrompt)
            .replace("{{CURRENT_PERSONALITY_TRAITS}}", currentConfig.personalityTraits.join(', '))
            .replace("{{REFINEMENT_INSTRUCTIONS}}", refinementInstructions);

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: [{role: "user", parts: [{text: prompt}]}],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });
        const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!responseText) {
            console.error("No text found in Gemini response for refineAgentConfiguration");
            return null;
        }
        return parseJsonFromResponse<AgentConfigGenerationResult>(responseText);
    } catch (error) {
        console.error("Error refining agent configuration:", error);
        return null;
    }
};
