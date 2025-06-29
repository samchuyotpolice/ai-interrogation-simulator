import { authTexts } from './authTexts';
import { commonTexts } from './commonTexts';
import { traineeTexts } from './traineeTexts';
import { trainerViewTexts } from './trainerViewTexts';
import { InterrogateeRole, DifficultyLevel, AIAgentType, UserRole } from '../../types'; // Assuming types.ts is two levels up

// It's important that keys are unique across the different text objects if they are merged flat.
// If keys can overlap, a nested structure would be better, e.g., UI_TEXT.auth.loginTitle

// For now, we'll do a flat merge. If there are overlaps, the later spreads will overwrite earlier ones.
// Consider namespacing if necessary, e.g., UI_TEXT.auth.loginTitle, UI_TEXT.common.appName, etc.
// However, the original UI_TEXT was flat, so we'll maintain that structure for now.

// Helper constants that were originally in constants.ts and used by UI_TEXT prompts
// These are not UI display texts themselves but are used to construct them or by prompts.
// It's better to keep them separate or manage them within the prompts themselves if possible.
// For now, keeping them here for simplicity in refactoring UI_TEXT.
const CRIMINAL_RECORD_TITLE_TEXT_INTERNAL = "עבר פלילי:"; // Renamed to avoid conflict if commonTexts has it
const INTEL_TITLE_TEXT_INTERNAL = "מידע מודיעיני:";
const EVIDENCE_ITEMS_TITLE_TEXT_INTERNAL = "פרטי הראיות:";

const feedbackParamContradictionsStrInternal = "הערכת זיהוי סתירות ופרטים מוכמנים";
const feedbackParamEmotionsStrInternal = "הערכת ניהול מצב רגשי";
const feedbackParamEvidenceManagementStrInternal = "הערכת ניהול ראיות";
const feedbackParamConfrontationStrInternal = "הערכת ניהול עימותים ולחץ";
const feedbackParamInterrogationTechniquesStrInternal = "הערכת שימוש בטכניקות תשאול";
const feedbackParamKeyMomentsStrInternal = "זיהוי רגעים מרכזיים בחקירה";
const feedbackParamRapportBuildingStrInternal = "הערכת בניית אמון (Rapport) עם הנחקר";
const feedbackParamPsychologicalTacticsStrInternal = "הערכת שימוש בטקטיקות פסיכולוגיות על ידי החוקר";
const feedbackParamCognitiveBiasesStrInternal = "זיהוי הטיות קוגניטיביות אפשריות (חוקר/נחקר)";


// Reconstruct the UI_TEXT object by spreading the imported text objects
// and re-adding any dynamic text functions or texts that were directly in the original UI_TEXT object.
export const UI_TEXT = {
  ...commonTexts, // Common texts first
  ...authTexts,   // Auth texts might override common if keys clash (undesirable)
  ...traineeTexts, // Trainee texts
  ...trainerViewTexts, // Trainer texts

  // --- Texts that were directly in the original UI_TEXT or need dynamic parts ---
  // These might need careful review to ensure they don't clash with imported keys or are correctly reconstructed.

  // Ensure dynamic functions are correctly re-defined or imported if they were part of original UI_TEXT
  // Example: chatWithInterrogateeDynamic was in traineeTexts, chatWithAgentDynamic was in traineeTexts
  // getAgentTypeDisplay was in trainerViewTexts
  // confirmDeleteUserMessage was in trainerViewTexts & authTexts (check for consistency)
  // confirmRoleChangeMessage was in trainerViewTexts
  // traineeSpecificStatsTitle was in trainerViewTexts
  // featureLiveAudioVisualizerStatus was in traineeTexts
  // investigationLogSearchResults was in traineeTexts
  // confirmDeleteManualScenarioMessage was in trainerViewTexts
  // ariaLabel... functions were in trainerViewTexts

  // Placeholder for prompts - these are very large and should ideally be loaded from separate files
  // As per the updated plan, we are only adding comments in constants.ts for these, not moving them here.
  // However, if any small, non-prompt string relied on template literals with these internal constants,
  // they would need to be reconstructed here. For now, assuming prompts are handled separately.
  // For example, if a prompt template string itself was small and part of UI_TEXT, it would go here.
  // But the large templates like generateScenarioPrompt are not part of this refactor for UI_TEXT.

  // It's crucial to review the original UI_TEXT object in constants.ts
  // and ensure ALL its properties (strings, functions) are correctly represented here,
  // either through the spread imports or by direct re-definition if they were unique.

  // Example of re-adding a function if it was uniquely in UI_TEXT:
  // someUniqueFunction: (param: string) => `Unique text: ${param}`,

  // Make sure the feedback parameter names are correctly sourced if they were directly in UI_TEXT
  // The trainerViewTexts.feedbackParameterNames already covers this.

  // Ensure role texts are available if they were directly in UI_TEXT and not just via commonTexts.getRoleLabel
  // commonTexts already provides roleTrainee, roleTrainer, roleSystemAdmin.
};

// It's generally safer to namespace to avoid clashes:
/*
export const UI_TEXT = {
  common: commonTexts,
  auth: authTexts,
  trainee: traineeTexts,
  trainer: trainerViewTexts,
  // ... any other unique properties that were directly on the original UI_TEXT
};
// Access would then be UI_TEXT.common.appName, UI_TEXT.auth.loginTitle, etc.
// This is a more robust approach for larger applications.
// For now, sticking to the flat structure as per the current refactoring step.
*/
