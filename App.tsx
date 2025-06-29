
import React, { useState, useEffect } from 'react';
import './types'; // Ensure global JSX augmentations from types.ts are loaded
import { UserRole, User, InvestigationSession, MockTrainee, Scenario, Theme } from '@/types'; // Import Theme from types.ts
import { UI_TEXT, MOCK_TRAINEES_DATA, DEFAULT_AGENT_ID } from '@/constants';
import PageLayout from '@/components/PageLayout';
// The import below uses a correct relative path.
// The error "The requested module '@/components/TraineeView' does not provide an export named 'default'"
// suggests that the aliased path '@_BINARY_PATH_SEPARATOR_@components/TraineeView' is being requested by the browser.
// This path is not used in this file for importing TraineeView.
// If this error occurs, it's likely due to:
// 1. An import statement elsewhere in the project (possibly in an unprovided file or a dependency) using this alias.
// 2. A misconfiguration in the development server or build tool's path aliasing if one is being used (e.g., Vite, Webpack).
//    The presence of "vite" and "path" in the importmap (index.html) hints that such tooling might be involved or was previously.
// 3. The browser attempting to resolve this path without a corresponding entry in the importmap or server-side resolution.
import TraineeView from '@/components/TraineeView'; // Use alias
import TrainerView from '@/components/TrainerView'; // Use alias from import map
import Button from '@/components/common/Button';    // Use alias
import Input from '@/components/common/Input';      // Use alias
import Modal from '@/components/common/Modal';      // Use alias

// Theme type is now imported from types.ts

// Helper function to generate critical error HTML
const getCriticalErrorHTML = (uiTextStatus: string): string => {
  const appName = "סימולטור תשאול - מבית ענף שיטור דיגיטלי"; // Fallback app name
  const divStyle = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #1e293b; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif; text-align: center; z-index: 9999; direction: rtl;";
  const h1Style = "font-size: 2em; color: #f87171;";
  const pStyle = "font-size: 1.2em; margin-top: 1em;";
  const pSubStyle = "margin-top: 0.5em;";
  const pFootStyle = "margin-top: 1em; font-size: 0.9em; color: #94a3b8;";

  return `
    <div style="${divStyle}">
      <h1 style="${h1Style}">שגיאה קריטית באפליקציה</h1>
      <p style="${pStyle}">
        רכיב חיוני (UI_TEXT ${uiTextStatus}) אינו זמין.
      </p>
      <p style="${pSubStyle}">
        האפליקציה אינה יכולה להמשיך. אנא בדוק את הקונסול (F12) של הדפדפן לשגיאות טעינת מודולים,
        במיוחד כאלה הקשורות לקבצים <code>constants.ts</code> או <code>types.ts</code>.
      </p>
      <p style="${pFootStyle}">
        (Diagnostic check in App.tsx) - ${appName}
      </p>
    </div>
  `;
};


// Diagnostic check for UI_TEXT
if (typeof UI_TEXT !== 'object' || UI_TEXT === null) {
  const uiTextStatus = UI_TEXT === undefined ? "(undefined)" : "(not an object)";
  console.error(`CRITICAL ERROR: UI_TEXT is ${uiTextStatus}. This usually indicates a problem with loading 'constants.ts' or its dependency 'types.ts'. Check the browser console for module resolution errors.`);
  
  const rootElementForError = document.getElementById('root');
  if (rootElementForError) {
    rootElementForError.innerHTML = getCriticalErrorHTML(uiTextStatus);
  }
  // Throw an error to definitely stop execution if UI_TEXT is missing
  throw new Error(`UI_TEXT is ${uiTextStatus}. Application cannot start.`);
}


const storeTraineeSession = (session: InvestigationSession) => {
  let allTraineeData: MockTrainee[];
  const storedTraineeData = localStorage.getItem('app_all_trainees_data');
  try {
    const parsedData = storedTraineeData ? JSON.parse(storedTraineeData) : MOCK_TRAINEES_DATA.map(t => ({...t, sessions: t.sessions || []}));
    if (!Array.isArray(parsedData)) {
        console.warn("'app_all_trainees_data' was not an array, resetting.");
        allTraineeData = MOCK_TRAINEES_DATA.map(t => ({...t, sessions: t.sessions || []})); // Use t.sessions
    } else {
        allTraineeData = parsedData.map((u: any) => ({
            ...u,
            sessions: Array.isArray(u.sessions) ? u.sessions : []
        }));
    }
  } catch (e) {
    console.warn("Error parsing 'app_all_trainees_data', resetting.", e);
    allTraineeData = MOCK_TRAINEES_DATA.map(t => ({...t, sessions: t.sessions || []})); // Use t.sessions
  }

  const traineeIndex = allTraineeData.findIndex(t => t.id === session.traineeId);
  if (traineeIndex !== -1) {
    const existingSessionIndex = allTraineeData[traineeIndex].sessions.findIndex(s => s.id === session.id);
    if (existingSessionIndex !== -1) {
      allTraineeData[traineeIndex].sessions[existingSessionIndex] = session;
    } else {
      allTraineeData[traineeIndex].sessions.push(session);
    }
  } else {
    // This case should ideally not happen if traineeId always corresponds to a known trainee
    console.warn(`Trainee with id ${session.traineeId} not found in MOCK_TRAINEES_DATA. Session not stored.`);
    // Optionally, create a new trainee entry if that's desired behavior
  }
  localStorage.setItem('app_all_trainees_data', JSON.stringify(allTraineeData));

  // Store AI generated scenarios in a separate archive if they are AI managed
  if (session.scenario && session.scenario.isAIManaged !== false && session.scenario.id && !session.scenario.id.startsWith('manual-')) {
    const scenariosStorageKey = 'app_all_ai_generated_scenarios';
    let archivedScenarios: Scenario[] = [];
    const storedScenarios = localStorage.getItem(scenariosStorageKey);
    if (storedScenarios) {
        try {
            const parsed = JSON.parse(storedScenarios);
            if (Array.isArray(parsed)) archivedScenarios = parsed;
        } catch (e) { console.warn("Error parsing archived scenarios", e); }
    }
    if (!archivedScenarios.some(s => s.id === session.scenario.id)) {
        archivedScenarios.push(session.scenario);
        localStorage.setItem(scenariosStorageKey, JSON.stringify(archivedScenarios));
    }
  }
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(true);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');


  useEffect(() => {
    // Attempt to load current user from localStorage (e.g., if page was refreshed)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id && parsedUser.role) { // Basic validation
          setCurrentUser(parsedUser);
          setIsLoginModalOpen(false);
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('currentUser'); // Clear corrupted data
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = (userEmail?: string, userPassword?: string) => {
    setError('');
    const emailToUse = userEmail || email;
    const passwordToUse = userPassword || password;

    if (!emailToUse || !passwordToUse) {
      setError(UI_TEXT.errorFieldsMissing);
      return;
    }

    const storedUsersData = localStorage.getItem('app_all_trainees_data');
    let usersToSearch: MockTrainee[] = MOCK_TRAINEES_DATA; // Default
    if(storedUsersData){
        try {
            const parsed = JSON.parse(storedUsersData);
            if(Array.isArray(parsed)) usersToSearch = parsed;
        } catch(e) { console.warn("Error parsing users from storage, using defaults."); }
    }
    
    const foundUser = usersToSearch.find(
      (user: MockTrainee) => user.email.toLowerCase() === emailToUse.toLowerCase() && user.password === passwordToUse
    );

    if (foundUser) {
      const userToStore: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      };
      setCurrentUser(userToStore);
      localStorage.setItem('currentUser', JSON.stringify(userToStore));
      setIsLoginModalOpen(false);
      // Clear form fields after successful login
      setEmail('');
      setPassword('');
    } else {
      setError(UI_TEXT.errorLoginFailed);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    localStorage.removeItem('currentUser');
    setIsLoginModalOpen(true); // Show login modal on logout
  };

  const handleDemoUserLogin = (demoUser: MockTrainee) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password || ''); // Ensure password is a string
    // Use a timeout to allow state to update before calling handleLogin
    setTimeout(() => handleLogin(demoUser.email, demoUser.password || ''), 0);
  };

  const renderContent = () => {
    if (!currentUser) {
      // Login form is now in a modal, so this path might not be taken if modal is always up when no user
      // However, it's good as a fallback or if modal is dismissible without logging in (not current design)
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className={`p-8 rounded-lg shadow-xl w-full max-w-md ${theme === 'light' ? 'bg-white' : 'themed-card'}`}>
            <h1 className={`text-2xl font-bold text-center mb-6 ${theme === 'light' ? 'text-primary-600' : 'themed-text-primary'}`}>{UI_TEXT.loginTitle}</h1>
            <Input label={UI_TEXT.emailLabel} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-4" />
            <Input label={UI_TEXT.passwordLabel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-6" />
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            <Button onClick={() => handleLogin()} className="w-full">{UI_TEXT.loginButton}</Button>
          </div>
        </div>
      );
    }

    if (currentUser.role === UserRole.TRAINEE) {
      return <TraineeView traineeId={currentUser.id} onSessionComplete={storeTraineeSession} theme={theme} />;
    } else if (currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SYSTEM_ADMIN) {
      return <TrainerView currentTrainer={currentUser} theme={theme} />;
    }
    return <p>תפקיד משתמש לא ידוע.</p>;
  };

  return (
    <PageLayout currentUserRole={currentUser ? currentUser.role : null} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
      {isLoginModalOpen && !currentUser && (
        <Modal 
          isOpen={isLoginModalOpen} 
          onClose={() => { /* Prevent closing by clicking outside or Escape if no user */ }} 
          title={UI_TEXT.loginTitle}
          size="md" // Increased modal size
        >
          <div className="space-y-4">
            <Input label={UI_TEXT.emailLabel} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" title="הזן כתובת אימייל"/>
            <Input label={UI_TEXT.passwordLabel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" title="הזן סיסמה"/>
            {error && <p className="text-red-400 text-xs text-center" role="alert">{error}</p>}
             <Button onClick={() => handleLogin()} className="w-full" isLoading={false} title={UI_TEXT.loginButton + ": נסה להתחבר למערכת עם הפרטים שהוזנו"}>
              {UI_TEXT.loginButton}
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className={`w-full border-t ${theme === 'light' ? 'border-secondary-300' : 'border-secondary-600'}`}></div>
              </div>
              <div className="relative flex justify-center">
                <span className={`px-2 text-xs ${theme === 'light' ? 'bg-white text-secondary-500' : 'bg-secondary-800 text-secondary-400'}`}>{UI_TEXT.orSeparator}</span>
              </div>
            </div>

            <div className="space-y-2">
                <Button 
                    variant="secondary" 
                    className="w-full" 
                    onClick={() => alert('Google login functionality not implemented yet.')}
                    title={UI_TEXT.loginWithGoogle + " (לא ממומש)"}
                >
                    {/* Placeholder for Google Icon */}
                    <span>{UI_TEXT.loginWithGoogle}</span>
                </Button>
                <Button 
                    variant="secondary" 
                    className="w-full" 
                    onClick={() => alert('Apple login functionality not implemented yet.')}
                    title={UI_TEXT.loginWithApple + " (לא ממומש)"}
                >
                    {/* Placeholder for Apple Icon */}
                    <span>{UI_TEXT.loginWithApple}</span>
                </Button>
            </div>

            <div className="mt-6">
              <h3 className={`text-sm font-medium mb-2 text-center ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.quickLoginAsDemoUser}</h3>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_TRAINEES_DATA.map(demoUser => (
                  <Button
                    key={demoUser.id}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleDemoUserLogin(demoUser)}
                    title={`התחבר כ: ${demoUser.name}`}
                  >
                    {demoUser.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
      {renderContent()}
    </PageLayout>
  );
};

export default App;
