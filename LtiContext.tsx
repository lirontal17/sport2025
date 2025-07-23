
import React, { createContext, ReactNode } from 'react';
import { LtiContextType, UserRole, Student, GradeLevel } from './types';

// --- MOCK LTI LAUNCH DATA ---
// This data simulates the information that would be passed by Moodle
// in a real LTI launch. In a real application, this data would be
// dynamically populated from the LTI launch request.

const LTI_LAUNCH_DATA: LtiContextType = {
    isLti: true,
    role: 'Instructor',
    userId: 'teacher-001',
    userName: 'לירון טל',
    courseId: 'PE-G9-2024',
    courseName: 'חנ"ג ט-1',
    gradeLevel: 'ט',
    roster: [
        { firstName: 'אורי', lastName: 'לוי' },
        { firstName: 'מאיה', lastName: 'שפירא' },
        { firstName: 'רון', lastName: 'כץ' },
        { firstName: 'דנה', lastName: 'כהן' },
        { firstName: 'תמר', lastName: 'אביב' },
        { firstName: 'נדב', lastName: 'ביטון' },
    ]
};

// --- LTI Context Definition ---

export const LtiContext = createContext<LtiContextType>(LTI_LAUNCH_DATA);

// --- LTI Provider Component ---

interface LtiProviderProps {
    children: ReactNode;
}

// The LtiProvider now wraps the app and provides a static,
// pre-configured LTI environment, as if it has been launched from Moodle.
export const LtiProvider: React.FC<LtiProviderProps> = ({ children }) => {
    return (
        <LtiContext.Provider value={LTI_LAUNCH_DATA}>
            {children}
        </LtiContext.Provider>
    );
};

// The LtiSimulator component has been removed as the application
// now operates in a persistent "embedded" LTI mode.

// To represent a student view, you could change the 'role' to 'Learner'
// and update the userId and userName in the LTI_LAUNCH_DATA object above.
// For example:
/*
const LTI_LAUNCH_DATA_STUDENT: LtiContextType = {
    isLti: true,
    role: 'Learner',
    userId: 'דנה-כהן', // Must match a student for filtering
    userName: 'דנה כהן',
    courseId: 'PE-G9-2024',
    courseName: 'חנ"ג ט-1',
    gradeLevel: 'ט',
    roster: [
        { firstName: 'אורי', lastName: 'לוי' },
        { firstName: 'מאיה', lastName: 'שפירא' },
        { firstName: 'רון', lastName: 'כץ' },
        { firstName: 'דנה', lastName: 'כהן' },
        { firstName: 'תמר', lastName: 'אביב' },
        { firstName: 'נדב', lastName: 'ביטון' },
    ]
};
*/
