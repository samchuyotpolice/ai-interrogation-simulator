// Common UI text constants used across the application
import { UserRole } from '../../types'; // Assuming types.ts is two levels up from constants/uiTexts/

// Role texts are used in multiple places, so they fit well here.
const ROLE_TEXT_TRAINEE = "חניך";
const ROLE_TEXT_TRAINER = "מדריך";
const ROLE_TEXT_SYSTEM_ADMIN = "מנהל מערכת";

export const commonTexts = {
  appName: "סימולטור תשאול - מבית ענף שיטור דיגיטלי",
  yes: "כן",
  no: "לא",
  ok: "אישור",
  cancel: "ביטול",
  edit: "ערוך",
  save: "שמור",
  delete: "מחק",
  add: "הוסף",
  closeButton: "סגור",
  viewButton: "צפה",
  nextButton: "הבא",
  backButton: "חזור",
  errorLoadingData: "שגיאה בטעינת נתונים.",
  noDataAvailable: "אין נתונים זמינים להצגה.",
  errorApiKeyMissing: "מפתח API של Gemini חסר. הפונקציונליות תהיה מוגבלת.",
  comingSoon: "(בקרוב)",
  roleTrainee: ROLE_TEXT_TRAINEE,
  roleTrainer: ROLE_TEXT_TRAINER,
  roleSystemAdmin: ROLE_TEXT_SYSTEM_ADMIN,
  getRoleLabel: (role: UserRole): string => { // Moved from TrainerView for wider use
    switch (role) {
        case UserRole.TRAINEE: return ROLE_TEXT_TRAINEE;
        case UserRole.TRAINER: return ROLE_TEXT_TRAINER;
        case UserRole.SYSTEM_ADMIN: return ROLE_TEXT_SYSTEM_ADMIN;
        default: return role;
    }
  },
};
