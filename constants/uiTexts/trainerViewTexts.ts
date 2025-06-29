// UI Text constants specific to the TrainerView and admin functionalities
import { UserRole, AIAgentType, InterruptionTypeDisplay, InterruptionType } from '../../types'; // Assuming types.ts is two levels up

const feedbackParamContradictionsStr = "הערכת זיהוי סתירות ופרטים מוכמנים";
const feedbackParamEmotionsStr = "הערכת ניהול מצב רגשי";
const feedbackParamEvidenceManagementStr = "הערכת ניהול ראיות";
const feedbackParamConfrontationStr = "הערכת ניהול עימותים ולחץ";
const feedbackParamInterrogationTechniquesStr = "הערכת שימוש בטכניקות תשאול";
const feedbackParamKeyMomentsStr = "זיהוי רגעים מרכזיים בחקירה";
const feedbackParamRapportBuildingStr = "הערכת בניית אמון (Rapport) עם הנחקר";
const feedbackParamPsychologicalTacticsStr = "הערכת שימוש בטקטיקות פסיכולוגיות על ידי החוקר";
const feedbackParamCognitiveBiasesStr = "זיהוי הטיות קוגניטיביות אפשריות (חוקר/נחקר)";

export const trainerViewTexts = {
  // Tabs
  manageUsersTab: "ניהול משתמשים",
  traineeProgressTab: "התקדמות חניכים",
  settingsSystemTab: "הגדרות מערכת",
  liveInterventionTab: "התערבות בסימולציה",
  manageAIAgentsTab: "ניהול סוכני AI",
  manualScenarioBuilderTab: "בניית תרחישים ידנית",

  // User Management
  addUserButton: "הוסף משתמש חדש",
  confirmDeleteUserTitle: "אישור מחיקת משתמש",
  confirmDeleteUserMessage: (name: string) => `האם אתה בטוח שברצונך למחוק את המשתמש ${name}? פעולה זו אינה הפיכה.`,
  userRole: "תפקיד משתמש",
  confirmRoleChangeTitle: "אישור שינוי תפקיד",
  confirmRoleChangeMessage: (name: string, newRole: string) => { // Role display will be handled by getRoleLabel from common
    return `האם אתה בטוח שברצונך לשנות את תפקידו של ${name} ל${newRole}?`;
  },
  changeRoleTo: "שנה תפקיד ל:",
  addNewUserModalTitle: "הוספת משתמש חדש",
  userCreatedSuccessfully: "משתמש נוצר בהצלחה!",
  errorCreatingUser: "שגיאה ביצירת משתמש. נסה שוב.",
  deleteUserConfirmationTitle: "אישור מחיקת משתמש", // Duplicate, consider consolidation
  deleteUserConfirmationMessage: (userName: string) => `האם אתה בטוח שברצונך למחוק את המשתמש ${userName}? פעולה זו אינה הפיכה וכל נתוני הסשנים שלו יימחקו.`,
  userDeletedSuccessfully: "משתמש נמחק בהצלחה.",
  errorDeletingUser: "שגיאה במחיקת המשתמש.",
  ariaLabelDeleteUser: (userName: string) => `מחק את המשתמש ${userName}`,
  ariaLabelEditUserRole: (userName: string) => `ערוך תפקיד עבור המשתמש ${userName}`,

  // Agent Management
  defaultAgentName: "סימולטור תשאול (ברירת מחדל)", // Could be common
  defaultAgentDescription: "הסוכן הסטנדרטי של המערכת לסימולציית תשאול כללית.", // Could be common
  editDefaultAgentPromptTitle: "צפה/ערוך הנחיית ברירת מחדל (מקומי)",
  saveLocalOverrideButton: "שמור הנחיה מקומית",
  resetToOriginalButton: "שחזר להנחיית מקור",
  defaultAgentOverrideNotice: "שינוי הנחיה זו יישמר מקומית עבורך (בדפדפן זה) וידרוס את הנחיית ברירת המחדל הנטענת מהמערכת. הנחיית ברירת המחדל המקורית מהקובץ לא תשתנה.",
  defaultAgentOverrideSaved: "הנחיית ברירת המחדל המקומית נשמרה.",
  defaultAgentOverrideResetSuccess: "הנחיית ברירת המחדל שוחזרה למקור (השמירה המקומית הוסרה).",
  errorNoCustomAgents: "לא נוצרו סוכני AI מותאמים אישית.",
  agentManagementTitle: "ניהול סוכני AI",
  addNewAgentButton: "הוסף סוכן AI חדש",
  editAgentButton: "ערוך סוכן AI",
  viewOrEditDefaultAgentPromptButton: "צפה/ערוך הנחיית ברירת מחדל",
  cloneAgentButton: "שכפל",
  clonedAgentNameSuffix: " - העתק",
  agentModalTitleSettings: "הגדרות סוכן",
  agentModalTitleAssistant: "מסייע AI ליצירת סוכן",
  agentModalTitleKnowledge: "ידע (Knowledge)",
  agentModalTitleConversationStarters: "פותחי שיחה",
  agentModalTitleCapabilities: "יכולות",
  agentModalTitleActions: "פעולות",
  agentNameLabel: "שם הסוכן",
  agentDescriptionLabel: "תיאור הסוכן",
  agentBaseSystemPromptLabel: "הנחיית מערכת בסיסית",
  agentBaseSystemPromptPlaceholder: "אתה עוזר וירטואלי. הנחיה זו יכולה לכלול משתנים כגון {{INTERROGATEE_ROLE}}, {{SCENARIO_DETAILS_FOR_AI}}, {{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}, {{INTERROGATEE_MOTIVATION_HINT}}, {{BEHAVIORAL_DYNAMICS_HINT}}, וכו', בהתאם לסוג הסוכן. עבור סוכן 'תשאול', הנחיה מורכבת יותר נדרשת. עבור 'משימה מותאמת', הנחיה זו עשויה להיות פשוטה יותר. תאר את מטרת הסוכן ואיך עליו להתנהג.",
  agentPersonalityTraitsLabel: "תכונות אישיות (מופרד בפסיקים)",
  agentPersonalityTraitsPlaceholder: "למשל: לחוץ, משתף פעולה, עוין",
  agentTypeLabel: "סוג סוכן",
  agentTypeOptions: {
      interrogation: "סוכן תשאול",
      information_retrieval: "סוכן אחזור מידע",
      custom_task: "סוכן משימה מותאמת"
  },
  getAgentTypeDisplay: (type: AIAgentType | undefined): string => {
    if (!type) return "לא מוגדר";
    const options = {
        interrogation: "סוכן תשאול",
        information_retrieval: "סוכן אחזור מידע",
        custom_task: "סוכן משימה מותאמת"
    };
    return options[type as keyof typeof options] || type;
  },
  agentPromptHelpText: "ההנחיה יכולה לכלול את המשתנים הבאים: {{INTERROGATEE_ROLE}}, {{DIFFICULTY_LEVEL}}, {{SCENARIO_DETAILS_FOR_AI}}, {{EVIDENCE_DETAILS_FOR_AI}}, {{TRAINER_INTERVENTION_HINT}}, {{INVESTIGATION_PROGRESS_HINT}}, {{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}, {{INTERROGATEE_MOTIVATION_HINT}}, {{BEHAVIORAL_DYNAMICS_HINT}}.",
  agentRecommendedModelLabel: "מודל מומלץ (אם לא נבחר, משתמש בברירת מחדל)",
  agentRecommendedModelPlaceholder: "בחר מודל...",
  agentDefaultLabel: "(ברירת מחדל - נטען מקובץ)",
  agentNotDefaultLabel: "(מותאם אישית)",
  agentNonEditablePrompt: "הנחיית ברירת המחדל אינה ניתנת לעריכה כאן (מלבד הדריסה המקומית). הנחיות של סוכנים שנטענו מקובץ ואינם ברירת מחדל גם אינן ניתנות לעריכה דרך ממשק זה.",
  agentNonEditableFromFileNotice: "סוכן זה נטען מקובץ ומוגדר כלא ניתן לעריכה. לא ניתן לשנות את פרטיו דרך ממשק זה.",
  agentEditableFromFileTemporaryNotice: "סוכן זה נטען מקובץ. שינויים שתבצע יישמרו באופן זמני בלבד (בדפדפן זה) ולא ישפיעו על הקובץ המקורי.",
  agentCreatedSuccessfully: "סוכן AI נוסף ונשמר מקומית.",
  agentUpdatedSuccessfully: "סוכן AI עודכן ונשמר מקומית.",
  agentDeletedSuccessfully: "סוכן AI נמחק מהאחסון המקומי.",
  errorCreatingAgent: "שגיאה בהוספת סוכן AI.",
  errorUpdatingAgent: "שגיאה בעדכון סוכן AI.",
  errorDeletingAgent: "שגיאה במחיקת סוכן AI.",
  viewPromptButton: "צפה בהנחיה",
  confirmDeleteAgentTitle: "אישור מחיקת סוכן AI",
  confirmDeleteAgentMessage: (name: string) => `האם אתה בטוח שברצונך למחוק את סוכן ה-AI המותאם אישית "${name}"? פעולה זו תסיר אותו מהאחסון המקומי בדפדפן.`,
  agentStorageNotice: "שים לב: הוספה ועריכה של סוכנים הנטענים מקובץ (שאינם ברירת מחדל) הן זמניות ולא יישמרו מעבר לרענון הדף.",
  customAgentStorageNotice: "סוכנים מותאמים אישית שנוצרו כאן יישמרו מקומית בדפדפן זה.",
  agentPersonalityAwareBadge: "מודע אישיות",
  agentStatusDefaultFromFile: "ברירת מחדל (מקובץ)",
  agentStatusCustomLocal: "מותאם אישית (מקומי)",
  agentStatusFromFile: "נטען מקובץ",
  agentStatusEditable: "ניתן לעריכה",
  agentStatusNotEditable: "לא ניתן לעריכה",
  ariaLabelCloneAgent: (agentName: string) => `שכפל את הסוכן ${agentName}`,
  ariaLabelDeleteAgent: (agentName: string) => `מחק את הסוכן ${agentName}`,
  ariaLabelViewEditAgent: (agentName: string, isDefault: boolean, isEditable: boolean) =>
    isDefault ? `צפה או ערוך הנחיית ברירת מחדל עבור ${agentName}` :
    isEditable ? `ערוך את הסוכן ${agentName}` :
    `צפה בהנחיה עבור הסוכן ${agentName}`,
  // Agent Assistant Tab
  agentAssistantDescribeLabel: "תאר את מטרת הסוכן והתנהגותו הרצויה:",
  agentAssistantGetSuggestionsButton: "קבל הצעות מה-AI",
  agentAssistantApplySuggestionsButton: "החל הצעות על לשונית 'הגדרות'",
  agentAssistantRefineInstructionsLabel: "הנחיות נוספות לשיפור ההצעה (אופציונלי):",
  agentAssistantRefineSuggestionsButton: "שפר הצעות עם AI",
  agentAssistantWorking: "המסייע עובד... אנא המתן.",
  agentAssistantSuggestedNameLabel: "שם מוצע:",
  agentAssistantSuggestedDescriptionLabel: "תיאור מוצע:",
  agentAssistantSuggestedBasePromptLabel: "הנחיית בסיס מוצעת:",
  agentAssistantSuggestedPersonalityTraitsLabel: "תכונות אישיות מוצעות:",
  agentAssistantError: "שגיאה בתקשורת עם מסייע ה-AI. בדוק קונסול או נסה שוב.",
  agentAssistantNoSuggestions: "המסייע לא הצליח לייצר הצעות עבור התיאור שסופק.",
  // Agent Knowledge Tab
  agentKnowledgeUploadLabel: "העלאת קבצים לידע הסוכן (לא פעיל כרגע, דורש Backend):",
  agentKnowledgeUploadButton: "בחר קבצים",
  agentKnowledgeUploadedFilesTitle: "קבצים שהועלו (דמה):",
  agentKnowledgeNoFiles: "לא הועלו קבצים.",
  agentKnowledgeBackendNotice: "שימו לב: העלאת קבצים ושמירתם דורשת פיתוח צד-שרת (Backend) וכרגע אינה ממומשת. ממשק זה הוא Placeholder.",
  // Agent Conversation Starters Tab
  agentConversationStartersLabel: "הצעות לפתיחת שיחה עם הסוכן (כל הצעה בשורה חדשה):",
  agentConversationStartersPlaceholder: "לדוגמה:\nמה שלומך היום?\nספר לי על...\nאני צריך עזרה עם...",
  // Agent Capabilities Tab
  agentCapabilityWebSearchLabel: "חיפוש באינטרנט (לא פעיל)",
  agentCapabilityImageGenerationLabel: "יצירת תמונות (Imagen)",
  agentCapabilityToolUsageLabel: "שימוש בכלים מוגדרים",
  // Agent Actions Tab
  agentActionsAvailableToolsTitle: "כלים זמינים (גלובלי):",
  agentActionsCustomizationNotice: "ניהול והוספת Actions (כלים) מותאמים אישית לכל סוכן הם תכונה עתידית שתדרוש Backend.",

  // Trainee Progress
  overallStatsTitle: "סטטיסטיקות כלליות (כלל החניכים)",
  totalSimulations: "סה\"כ סימולציות שהושלמו",
  averageScorePrefix: "ממוצע", // Could be common if used elsewhere
  traineeSpecificStatsTitle: (name: string) => `סטטיסטיקות עבור ${name}`,
  simulationsCountSuffix: "סימולציות",
  averageScoreLabel: "ציון ממוצע",
  scenarioTopic: "נושא חקירה",
  date: "תאריך", // Could be common
  filterByTraineeLabel: "סנן לפי חניך:",
  allTraineesFilterOption: "כל החניכים",
  feedbackParameterNames: { // This is for displaying feedback, could be common if feedback shown to trainee too
      contradictions: feedbackParamContradictionsStr.replace('הערכת ', ''),
      emotions: feedbackParamEmotionsStr.replace('הערכת ', ''),
      evidence: feedbackParamEvidenceManagementStr.replace('הערכת ', ''),
      confrontation: feedbackParamConfrontationStr.replace('הערכת ', ''),
      interrogationTechniques: feedbackParamInterrogationTechniquesStr.replace('הערכת ', ''),
      keyMoments: feedbackParamKeyMomentsStr.replace('זיהוי ', ''),
      rapportBuilding: feedbackParamRapportBuildingStr.replace('הערכת ', ''),
      psychologicalTactics: feedbackParamPsychologicalTacticsStr.replace('הערכת ', ''),
      cognitiveBiases: feedbackParamCognitiveBiasesStr.replace('זיהוי ', ''),
  },
  feedbackKeyMomentsTitle: "רגעים מרכזיים בחקירה",
  aiGeneratedScenariosTitle: "תרחישים שנוצרו על ידי AI", // Used in settings too
  aiScenarioDetailsTitle: "פרטי תרחיש AI",
  viewFeedbackButton: "צפה במשוב",
  feedbackDetailsModalTitle: "פרטי משוב AI",

  // Live Intervention
  selectActiveSessionPlaceholder: "בחר חניך פעיל (סימולציה)...",
  noActiveSessions: "אין כרגע חניכים בסימולציה פעילה (דמו).",
  forceEmotionalStateButton: "אכוף מצב רגשי",
  revealInfoHintButton: "רמוז על מידע",
  increaseResistanceButton: "הגבר התנגדות",
  decreaseResistanceButton: "הפחת התנגדות",
  sendWhisperButton: "שלח 'לחישה' ל-AI",
  triggerInterruptionButton: "הפעל הפרעה בסימולציה",
  interruptionTypeLabel: "סוג הפרעה:",
  interruptionDetailsPlaceholder: "תיאור קצר של ההפרעה (יוצג לחניך)",
  interruptionCommandSentMessage: "פקודת הפרעה נשלחה לסימולציה.",
  enterEmotionalStatePlaceholder: "הזן מצב רגשי (למשל, לחוץ)",
  enterInfoHintPlaceholder: "הזן רמז מידע קצר",
  enterWhisperPlaceholder: "הזן הנחיה דיסקרטית ל-AI...",
  sendCommandButton: "שלח פקודה",
  commandSentMessage: "פקודה נשלחה לסימולציה.",
  errorNoSessionSelected: "אנא בחר סימולציה פעילה להתערבות.",
  trainerChatViewTitle: "תצוגת צ'אט (קריאה בלבד)",
  refreshChatViewButton: "רענן תצוגת צ'אט",
  trainerChatViewNoMessages: "לסשן הנבחר אין עדיין היסטוריית שיחה.",

  // Manual Scenario Builder
  manualScenarioGoalsLabel: "מטרות חקירה (כל מטרה בשורה חדשה):",
  manualScenariosTitle: "תרחישים ידניים",
  addNewManualScenarioButton: "הוסף תרחיש ידני חדש",
  confirmDeleteManualScenarioMessage: (scenarioName: string) => `האם אתה בטוח שברצונך למחוק את התרחיש הידני "${scenarioName}"?`,
  manualScenarioNameLabel: "שם/סוג תרחיש",
  manualScenarioDescriptionLabel: "תיאור מלא של התרחיש",
  manualScenarioInterrogateeRoleLabel: "תפקיד הנחקר",
  manualScenarioDifficultyLabel: "בחר רמת קושי:",
  manualScenarioTopicLabel: "בחר נושא חקירה או הזן נושא מותאם אישית:",
  manualScenarioCreatedSuccessfully: "תרחיש ידני נוצר ונשמר בהצלחה.",
  manualScenarioDeletedSuccessfully: "תרחיש ידני נמחק בהצלחה.",
  errorCreatingManualScenario: "שגיאה ביצירת תרחיש ידני.",
  errorDeletingManualScenario: "שגיאה במחיקת תרחיש ידני.",

  // System Settings
  dataManagementSectionTitle: "ניהול נתונים מקומיים",
  clearAllSessionsButton: "נקה את כל סשני החניכים",
  confirmClearAllSessionsMessage: "האם אתה בטוח שברצונך למחוק את כל נתוני הסשנים של כל החניכים? פעולה זו אינה הפיכה ותמחק את כל היסטוריית הסימולציות והמשובים מ-localStorage.",
  sessionsClearedSuccessfully: "כל סשני החניכים נמחקו בהצלחה מ-localStorage.",
  resetDefaultAgentOverrideButton: "אפס הנחיית ברירת מחדל מקומית", // Duplicate, already in agent management section for UI_TEXT
  confirmResetDefaultAgentOverrideMessage: "האם אתה בטוח שברצונך לאפס את הנחיית ברירת המחדל המקומית? המערכת תחזור להשתמש בהנחיה הנטענת מקובץ ברירת המחדל.",
  settingsTab_defaultAgentOverrideResetSuccess: "הנחיית ברירת המחדל המקומית אופסה למקור בהצלחה.",
  resetMockUsersButton: "אפס נתוני משתמשים לדוגמה",
  confirmResetMockUsersMessage: "האם אתה בטוח שברצונך לאפס את כל נתוני המשתמשים לברירת המחדל המקורית? כל המשתמשים הנוכחיים (כולל מדריכים וחניכים שנוספו ידנית) יימחקו ויוחלפו בנתוני ההדגמה.",
  mockUsersResetSuccess: "נתוני המשתמשים אופסו לברירת המחדל בהצלחה.",
  apiStatusTitle: "סטטוס חיבורים",
  apiKeyStatusLabel: "מפתח Google Gemini API:", // Could be common
  apiKeyLoaded: "נטען בהצלחה", // Could be common
  apiKeyMissing: "חסר/לא נטען (בדוק משתנה סביבה API_KEY)", // Could be common
  noAiScenariosArchived: "אין תרחישים שמורים בארכיון.", // Used in settings for AI generated scenarios archive
};
