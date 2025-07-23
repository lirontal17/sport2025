
import React, { useState, useContext } from 'react';
// import * as XLSX from 'xlsx'; // No longer needed
import { Record, ModalType, Student, AiRequest, FitnessComponent, LessonDuration, TrainingDuration, UserRole, GradeLevel } from './types';
import { CLASSES_PER_GRADE, GRADING_DATA } from './constants/gradingData';
import { calculateGrade } from './services/gradingService';
import * as geminiService from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LtiContext } from './LtiContext';

import Header from './components/Header';
import InputForm from './components/InputForm';
import ResultsTable from './components/ResultsTable';
import Summary from './components/Summary';
import ConfirmModal from './components/ConfirmModal';
import AiModal from './components/AiModal';
import HelpModal from './components/HelpModal';
import LessonPlanModal from './components/LessonPlanModal';
import ShareGroupModal from './components/ShareGroupModal';
import TrainingPlanModal from './components/TrainingPlanModal';
import ReportCardModal from './components/ReportCardModal';
import StudentView from './components/StudentView';

const App: React.FC = () => {
    const ltiContext = useContext(LtiContext);
    // Data is scoped by courseId, which is now static from the LTI context.
    const storageKey = `pe_records_${ltiContext.courseId}`;
    
    // Standalone student list state is removed, as we now only use the LTI roster.
    const [records, setRecords] = useLocalStorage<Record[]>(storageKey, []);
    const [modalState, setModalState] = useState<{ type: ModalType | null; data: any }>({ type: null, data: null });
    const [aiRequest, setAiRequest] = useState<AiRequest>({ isLoading: false, title: '', content: '' });

    const openModal = (type: ModalType, data: any = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });
    
    const handleAddRecord = (newRecordData: Omit<Record, 'id' | 'grade'>) => {
        const grade = calculateGrade(
            newRecordData.gender,
            newRecordData.gradeLevel,
            newRecordData.testType,
            newRecordData.originalResult
        );
        const newRecord: Record = {
            ...newRecordData,
            id: crypto.randomUUID(),
            userId: `${newRecordData.firstName}-${newRecordData.lastName}`, // Simple unique ID for student
            grade
        };
        setRecords(prevRecords => [...prevRecords, newRecord]);
    };

    const handleDeleteRecord = (recordId: string) => {
        setRecords(prevRecords => prevRecords.filter(r => r.id !== recordId));
        closeModal();
    };

    const handleClearAll = () => {
        setRecords([]);
        closeModal();
    };
    
    // handleFileUpload and handleClearUploadedStudents are removed as they are for non-LTI use.

    const handleGradePassback = (record: Record) => {
        // In a real LTI app, this would trigger a backend API call.
        alert(`סימולציה: הציון ${record.grade} עבור ${record.firstName} ${record.lastName} נשלח למערכת ה-LMS (Moodle).`);
    };

    const startAiRequest = (title: string) => {
        setAiRequest({ isLoading: true, title, content: '' });
        openModal(ModalType.Ai);
    };

    const finishAiRequest = (content: string) => {
        setAiRequest(prev => ({ ...prev, isLoading: false, content }));
    };

    const handleGenerateFeedback = async (record: Record) => {
        startAiRequest(`מפיק משוב עבור ${record.firstName}...`);
        const testDetails = GRADING_DATA[record.gender]?.[record.gradeLevel]?.[record.testType];
        const feedback = await geminiService.generateFeedback(record, testDetails);
        finishAiRequest(feedback);
    };

    const handleGenerateTrainingPlan = async (goal: string, duration: TrainingDuration) => {
        const record = modalState.data as Record;
        closeModal();
        startAiRequest(`מפיק תוכנית אימונים עבור ${record.firstName}...`);
        const plan = await geminiService.generateTrainingPlan(record, goal, duration);
        finishAiRequest(plan);
    };
    
    const handleGenerateInsights = async () => {
        if (records.length < 3) {
            alert("צריך לפחות 3 רשומות כדי להפיק תובנות.");
            return;
        }
        startAiRequest('מפיק תובנות כיתתיות...');
        const insights = await geminiService.generateInsights(records);
        finishAiRequest(insights);
    };

    const handleGenerateLessonPlan = async (component: FitnessComponent, equipment: string, duration: LessonDuration, gradeLevel: GradeLevel) => {
        closeModal();
        startAiRequest('מפיק מערך שיעור...');
        const plan = await geminiService.generateLessonPlan(component, equipment, duration, gradeLevel);
        finishAiRequest(plan);
    };
    
    const handleGenerateReportCardComment = async (studentName: string) => {
        const studentRecords = records.filter(r => `${r.firstName} ${r.lastName}` === studentName);
        closeModal();
        startAiRequest(`מפיק הערכה עבור ${studentName}...`);
        const comment = await geminiService.generateReportCardComment(studentName, studentRecords);
        finishAiRequest(comment);
    };

    const allStudentsForReportCard = [...new Map(records.map(r => [`${r.firstName} ${r.lastName}`, { firstName: r.firstName, lastName: r.lastName }])).values()]
        .sort((a, b) => a.lastName.localeCompare(b.lastName));
        
    // The student list is now always the roster from the LTI context.
    const studentList = ltiContext.roster;

    const TeacherView = () => (
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <InputForm 
                onAddRecord={handleAddRecord} 
                studentList={studentList}
                isLti={ltiContext.isLti}
                courseGradeLevel={ltiContext.gradeLevel}
                courseClassName={ltiContext.courseName}
            />
            <div className="lg:col-span-2 space-y-8">
                <ResultsTable
                    records={records}
                    onDeleteClick={(record) => openModal(ModalType.ConfirmDelete, record)}
                    onGenerateFeedback={handleGenerateFeedback}
                    onGenerateTrainingPlan={(record) => openModal(ModalType.TrainingPlan, record)}
                    onGradePassback={handleGradePassback}
                />
                <Summary
                    records={records}
                    onGenerateInsights={handleGenerateInsights}
                    onOpenLessonPlan={() => openModal(ModalType.LessonPlan)}
                    onOpenShareGroup={() => openModal(ModalType.ShareGroup)}
                    onOpenReportCard={() => openModal(ModalType.ReportCard)}
                    onClearAll={() => openModal(ModalType.ConfirmClearAll)}
                    isLti={ltiContext.isLti}
                />
            </div>
        </main>
    );

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <Header onHelpClick={() => openModal(ModalType.Help)} />
            {/* LtiSimulator component removed to enforce persistent LTI mode */}

            {ltiContext.role === 'Instructor' ? <TeacherView /> : <StudentView records={records} userId={ltiContext.userId} onGradePassback={handleGradePassback}/>}

            {/* Modals */}
            <HelpModal isOpen={modalState.type === ModalType.Help} onClose={closeModal} />

            <ConfirmModal
                isOpen={modalState.type === ModalType.ConfirmDelete || modalState.type === ModalType.ConfirmClearAll}
                onClose={closeModal}
                onConfirm={() => {
                    if (modalState.type === ModalType.ConfirmDelete) {
                        handleDeleteRecord(modalState.data.id);
                    } else if (modalState.type === ModalType.ConfirmClearAll) {
                        handleClearAll();
                    }
                }}
                title={modalState.type === ModalType.ConfirmDelete ? 'אישור מחיקה' : 'מחיקת כל הנתונים'}
                message={modalState.type === ModalType.ConfirmDelete ? 'האם אתה בטוח שברצונך למחוק רשומה זו?' : 'פעולה זו תמחק את כל הרשומות לצמיתות. האם להמשיך?'}
            />

            <AiModal
                isOpen={modalState.type === ModalType.Ai}
                onClose={() => { if (!aiRequest.isLoading) closeModal(); }}
                title={aiRequest.title}
                content={aiRequest.content}
                isLoading={aiRequest.isLoading}
            />

            <LessonPlanModal 
                isOpen={modalState.type === ModalType.LessonPlan}
                onClose={closeModal}
                onSubmit={handleGenerateLessonPlan}
                gradeLevels={Object.keys(CLASSES_PER_GRADE) as GradeLevel[]}
                initialGradeLevel={ltiContext.gradeLevel}
            />

            <ShareGroupModal
                 isOpen={modalState.type === ModalType.ShareGroup}
                 onClose={closeModal}
                 records={records}
            />

            <TrainingPlanModal
                isOpen={modalState.type === ModalType.TrainingPlan}
                onClose={closeModal}
                record={modalState.data}
                onSubmit={handleGenerateTrainingPlan}
            />

             <ReportCardModal
                isOpen={modalState.type === ModalType.ReportCard}
                onClose={closeModal}
                students={allStudentsForReportCard}
                onSubmit={handleGenerateReportCardComment}
            />
        </div>
    );
};

export default App;
