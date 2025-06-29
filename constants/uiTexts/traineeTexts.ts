// UI Text constants specific to the TraineeView
import { InterrogateeRole, DifficultyLevel } from '../../types'; // Assuming types.ts is two levels up

export const traineeTexts = {
  // Setup Flow
  setupStepAgentSelection: "שלב 1: בחר סוכן AI",
  setupStepInterrogateeRole: "שלב 2: את מי ברצונך לתשאל? (רלוונטי לסוכני תשאול)",
  setupStepDifficulty: "שלב 3: בחר רמת קושי (רלוונטי לסוכני תשאול)",
  setupStepTopic: "שלב 4: בחר נושא חקירה (רלוונטי לסוכני תשאול)",
  setupStepReview: "שלב אחרון: סקירת בחירות ואישור",

  selectInterrogateeRole: "בחר את תפקיד הנחקר:",
  roleSuspect: InterrogateeRole.SUSPECT,
  roleWitness: InterrogateeRole.WITNESS,
  roleVictim: InterrogateeRole.VICTIM,
  selectDifficulty: "בחר רמת קושי:",
  difficultyEasy: DifficultyLevel.EASY,
  difficultyMedium: DifficultyLevel.MEDIUM,
  difficultyHard: DifficultyLevel.HARD,
  selectTopic: "בחר נושא חקירה או הזן נושא מותאם אישית:",
  topicPlaceholder: "לדוגמה: אלימות ברשת, הימורים לא חוקיים",
  customTopicLabel: "נושא מותאם אישית (אם לא נבחר מהרשימה):",
  selectAIAgent: "בחר את סוכן ה-AI שינהל את האינטראקציה:",

  confirmAndGenerateScenarioButton: "אשר וצור תרחיש", // Used in old setup, might be reusable
  reviewSelectedAgentLabel: "סוכן AI שנבחר:",
  reviewSelectedRoleLabel: "תפקיד נחקר שנבחר:",
  reviewSelectedDifficultyLabel: "רמת קושי שנבחרה:",
  reviewSelectedTopicLabel: "נושא חקירה שנבחר:",
  editSelectionsButton: "ערוך בחירות",
  generateScenarioButton: "צור תרחיש והתחל סימולציה", // Main button in review step

  // Trainee Dashboard / Active Investigation
  traineeDashboardTitle: "לוח בקרה חניך",
  startNewSimulation: "התחל סימולציה חדשה",
  generatingScenario: "יוצר תרחיש עבורך על בסיס בחירותיך...",
  caseDetails: "פרטי המקרה",
  interrogateeProfileTitle: "פרופיל הנחקר",
  evidenceInHandTitle: "ראיות בידי המשטרה",
  startInvestigationCall: "התחל חקירה",
  startSessionCall: "התחל סשן",
  endInvestigationCall: "סיים חקירה",
  endSessionCall: "סיים סשן",
  sendMessage: "שלח",
  typeYourMessage: "הקלד את הודעתך כאן...",
  investigationFeedback: "משוב על החקירה",
  overallScore: "ציון כללי",
  backToDashboard: "חזרה ללוח הבקרה",
  confirmEndInvestigation: "האם אתה בטוח שברצונך לסיים את החקירה?",
  confirmEndSession: "האם אתה בטוח שברצונך לסיים את הסשן?",
  investigationEnded: "החקירה הסתיימה.",
  sessionEndedNoFeedback: "הסשן עם הסוכן הסתיים. משוב אינו רלוונטי לסוג סוכן זה.",
  generatingFeedback: "מעבד משוב...",
  scenarioDetails: "פרטי תרחיש מלאים",
  agentDetails: "פרטי סוכן",
  chatWithSuspect: "שיחה עם הנחקר", // Potentially deprecated if dynamic title is always used
  chatWithInterrogateeDynamic: (roleOrName: InterrogateeRole | string, isName: boolean = false) =>
    isName ? `שיחה עם ${roleOrName}` : `שיחה עם ה${roleOrName}`,
  chatWithAgentDynamic: (agentName: string) => `שיחה עם הסוכן: ${agentName}`,
  noScenario: "לא נטען תרחיש.",
  couldNotLoadScenario: "לא ניתן היה לטעון תרחיש. אנא בדוק בחירות ונסה שוב.",
  showScenarioDetails: "הצג פרטי תרחיש",
  hideScenarioDetails: "הסתר פרטי תרחיש",
  showAgentDetails: "הצג פרטי סוכן",
  hideAgentDetails: "הסתר פרטי סוכן",
  requestHintButton: "בקש רמז מה-AI",
  hintSystemMessagePrefix: "רמז מה-AI",
  hintTypeEvidence: "התמקד בראיה", // Likely deprecated or internal
  hintTypeSuggestedAction: "פעולה מוצעת", // Likely deprecated or internal
  noMoreHints: "אין רמזים נוספים כרגע (פונקציונליות רמזים קיימת עדיין בפיתוח).",
  generatingHint: "מייצר רמז עבורך...",
  errorGeneratingHint: "שגיאה ביצירת רמז.",
  criminalRecordTitle: "עבר פלילי:", // Re-defined here, but could be from common if always same
  intelTitle: "מידע מודיעיני:", // Re-defined here
  victimDetailsTitle: "פרטי קורבן:",
  witnessDetailsTitle: "פרטי עדות:",
  evidenceItemsTitle: "פרטי הראיות:", // Re-defined here
  caseTypeLabel: "סוג אירוע/עבירה",
  fullCaseDescriptionLabel: "תיאור מקרה מלא",
  locationLabel: "מיקום",
  dateTimeLabel: "תאריך ושעה",
  interrogateeRoleLabel: "תפקיד הנחקר", // Scenario Detail Labels
  profileNameLabel: "שם",
  profileAgeLabel: "גיל",
  profileOccupationLabel: "עיסוק",
  profileAddressLabel: "כתובת",
  profileCriminalRecordTitleLabel: "כותרת עבר פלילי",
  profileCriminalRecordDetailsLabel: "פרטי עבר פלילי",
  profileIntelTitleLabel: "כותרת מידע מודיעיני",
  profileIntelDetailsLabel: "פרטי מידע מודיעיני",
  profileVictimDetailsLabel: "פרטי קורבן (אם רלוונטי)",
  profileWitnessDetailsLabel: "פרטי עדות (אם רלוונטי)",
  evidenceTitleLabel: "כותרת ראיות",
  evidenceItemsLabel: "פרטי הראיות (כל פריט בשורה נפרדת)",
  systemPromptLabel: "הנחיית מערכת מלאה ל-AI", // For scenario details modal

  errorGeneratingScenario: "שגיאה ביצירת התרחיש. נסה שוב מאוחר יותר.",
  errorMissingSetupSelection: "נא לוודא שנבחרו כל האפשרויות להגדרת הסימולציה.",
  errorSendingMessage: "שגיאה בשליחת הודעה.",
  errorStartingChat: "שגיאה בהתחלת הצ'אט.",
  errorGeneratingFeedback: "שגיאה ביצירת המשוב.",

  // Investigation Log
  investigationLogTitle: "יומן חקירה אישי:",
  investigationLogSearchPlaceholder: "חפש ביומן...",
  investigationLogSearchResults: (count: number) => `${count} מופעים נמצאו.`,
  investigationGoalsTitle: "מטרות חקירה עיקריות:",
  confirmClearLogTitle: "אישור ניקוי יומן",
  confirmClearLogMessage: "האם אתה בטוח שברצונך למחוק את כל תוכן היומן הנוכחי? פעולה זו אינה הפיכה.",

  // Voice/Audio Features
  featureLiveAudioToggleLabel: "הפעל שיחה קולית חיה",
  featureLiveAudioAttempting: "מנסה להפעיל שיחה קולית חיה...",
  featureLiveAudioStopped: "שיחה קולית חיה הופסקה.",
  featureLiveAudioErrorGeneric: "שגיאה בשיחה הקולית החיה.",
  featureLiveAudioErrorMicPermission: "נדחתה גישה למיקרופון. לא ניתן להפעיל שיחה קולית.",
  featureLiveAudioErrorConnection: "כשל בהתחברות לשירות האודיו של AI.",
  featureLiveAudioErrorNoScenario: "לא ניתן להפעיל שיחה קולית ללא תרחיש טעון והנחיית מערכת.",
  featureLiveAudioErrorStartOnlyInInvestigation: "ניתן להפעיל שיחה קולית רק לאחר תחילת החקירה.",
  featureLiveAudioActiveIndicator: "שיחה קולית חיה פעילה",
  featureLiveAudioVisualizerStatus: (status: string) => {
      const statusMap: { [key: string]: string } = {
          idle: "מוכן",
          requesting_mic: "מבקש גישה למיקרופון...",
          mic_access_granted: "גישה למיקרופון אושרה",
          connecting_ai: "מתחבר לשירות AI...",
          ai_session_open: "מחובר. ניתן לדבר.",
          streaming_user_audio: "מקליט ושולח אודיו...",
          playing_ai_audio: "AI מגיב קולית...",
          processing_ai_message: "מעבד תגובת AI...",
          error: "שגיאה בשירות הקולי",
          closing_session: "סוגר חיבור...",
          ai_sdk_init_failed: "שגיאת אתחול SDK",
          api_key_missing: "מפתח API חסר",
          audiocontext_failure: "שגיאת AudioContext",
          mic_access_denied: "גישה למיקרופון נדחתה",
          ai_session_connect_failed: "כשל ביצירת סשן AI",
          audio_send_error: "שגיאה בשליחת אודיו",
          ai_audio_play_error: "שגיאה בניגון אודיו מה-AI",
          no_system_prompt: "חסרה הנחיית מערכת ראשונית",
          api_session_error_callback: "שגיאת סשן API"
      };
      return `מצב AI קולי: ${statusMap[status.toLowerCase()] || status}`;
  },
  enableFeatureVoiceInput: "אפשר קלט קולי (מיקרופון)",
  enableFeatureLivestreamAudio: "אפשר פלט קולי חי (תגובות AI)", // This might be more of a setting text
  enableFeatureAvatar: "אפשר אינטראקציית אווטאר (בקרוב)", // This might be more of a setting text
  featureSpeechNotSupported: "דפדפן זה אינו תומך באופן מלא ב-API זיהוי/סינתזת דיבור. חלק מהפיצ'רים הקוליים לא יהיו זמינים.",
  featureMicrophonePermissionDenied: "הגישה למיקרופון נדחתה. לא ניתן להשתמש בקלט קולי. אנא אפשר גישה בהגדרות הדפדפן.",
  featureVoiceInputError: "שגיאה בקלט הקולי",
  featureVoiceInputListening: "מקשיב...",
  featureVoiceInputStop: "עצור הקלטה",
  featureVoiceInputStart: "התחל הקלטה",
  featureLivestreamAudioNotSupported: "סינתזת דיבור אינה נתמכת בדפדפן זה.",
  featureAvatarPlaceholder: "אינטראקציית אווטאר תהיה זמינה בקרוב!",
  suspectBehaviorIndicatorPrefix: "הנחקר:", // Used in TraineeView for AI responses

  // Live audio feedback messages (already in constants, but specific to TraineeView context)
  liveAudioConnectingMic: "מנסה לקבל גישה למיקרופון...",
  liveAudioMicAccessSuccess: "התקבלה גישה למיקרופון. ממשיך להתחברות לשירות ה-AI הקולי.",
  liveAudioConnectingAIService: "מתחבר לשירות ה-AI הקולי...",
  liveAudioConnectedAIService: "השיחה הקולית החיה מוכנה. ניתן להתחיל לדבר.",
  liveAudioErrorMicPermissionDetail: "הגישה למיקרופון נדחתה או נכשלה. לא ניתן להפעיל שיחה קולית חיה. בדוק את הרשאות הדפדפן.",
  liveAudioErrorConnectionDetail: "כשל בהתחברות לשירות ה-AI הקולי. בדוק את חיבור האינטרנט ונסה שוב.",
  liveAudioErrorGenericDetail: "אירעה שגיאה לא צפויה בשיחה הקולית החיה. נסה להפעיל מחדש.",
  liveAudioStoppedByUser: "השיחה הקולית החיה הופסקה על ידך.",
  liveAudioSessionEndedByAI: "סשן השיחה הקולית הסתיים על ידי ה-AI או עקב שגיאה.",
};
