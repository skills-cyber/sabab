import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AdminProvider } from './contexts/AdminContext';
import { AcademicProvider } from './contexts/AcademicContext';
import { AccountsProvider } from './contexts/AccountsContext';
import { StaffProvider } from './contexts/StaffContext';
import { PayrollProvider } from './contexts/PayrollContext';
import { Payroll } from './pages/Payroll';
import { TooltipProvider } from './components/ui/Tooltip';
import { Toaster } from './components/ui/Sonner';
import { AppShell } from './components/layout/AppShell';
import { PrincipalOverview } from './pages/PrincipalOverview';
import { TeacherToday } from './pages/TeacherToday';
import { AcademicPlanner } from './pages/AcademicPlanner';
import { Timetable } from './pages/Timetable';
import { Makeup } from './pages/Makeup';
import { ModulePreview } from './pages/ModulePreview';
import { SchoolSetup } from './pages/SchoolSetup';
import { Admissions } from './pages/Admissions';
import { Transport } from './pages/Transport';
import { Exams } from './pages/Exams';
import { AssessmentDetail } from './pages/AssessmentDetail';
import { Students } from './pages/Students';
import { Families } from './pages/Families';
import { Promotion } from './pages/Promotion';
import { Attendance } from './pages/Attendance';
import { Staff } from './pages/Staff';
import { Communication } from './pages/Communication';
import { Fees } from './pages/Fees';
import { ParentPortal } from './pages/ParentPortal';
import { SaasControlCenter } from './pages/SaasControlCenter';
import { PrototypeGuide } from './pages/PrototypeGuide';
import { Homework } from './pages/Homework';
import { Accounts } from './pages/Accounts';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

type StartRole = 'principal' | 'teacher' | 'coordinator' | 'accountant' | 'parent' | 'platform' | 'office' | 'owner';

interface AppProps {
  startRole?: StartRole;
  darkMode?: boolean;
}

function RoleHome() {
  const { roleInfo } = useApp();
  return <Navigate to={roleInfo.home} replace />;
}

function ThemedToaster() {
  const { dark } = useApp();
  return <Toaster theme={dark ? 'dark' : 'light'} position="bottom-right" richColors closeButton />;
}

export function App({ startRole = 'principal', darkMode = false }: AppProps) {
  return (
    <AppProvider initialRole={startRole} initialDark={darkMode}>
      <AdminProvider>
        <AccountsProvider>
        <StaffProvider>
        <PayrollProvider>
        <AcademicProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<RoleHome />} />
                  <Route path="overview" element={<PrincipalOverview />} />
                  <Route path="teaching" element={<TeacherToday />} />
                  <Route path="planner" element={<Navigate to="/planner/calendar" replace />} />
                  <Route path="planner/:tab" element={<AcademicPlanner />} />
                  <Route path="timetable" element={<Timetable />} />
                  <Route path="makeup" element={<Makeup />} />
                  <Route path="exams" element={<Navigate to="/exams/assessments" replace />} />
                  <Route path="exams/a/:id" element={<AssessmentDetail />} />
                  <Route path="exams/:tab" element={<Exams />} />
                  <Route path="students" element={<Students />} />
                  <Route path="students/families" element={<Families />} />
                  <Route path="students/promotion" element={<Promotion />} />
                  <Route path="students/*" element={<Navigate to="/students" replace />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="staff" element={<Navigate to="/staff/directory" replace />} />
                  <Route path="staff/:tab" element={<Staff />} />
                  <Route path="payroll" element={<Navigate to="/payroll/sheets" replace />} />
                  <Route path="payroll/:tab" element={<Payroll />} />
                  <Route path="m/payroll" element={<Navigate to="/payroll/sheets" replace />} />
                  <Route path="communication" element={<Communication />} />
                  <Route path="fees" element={<Navigate to="/fees/collection" replace />} />
                  <Route path="fees/:tab" element={<Fees />} />
                  <Route path="parent" element={<Navigate to="/parent/overview" replace />} />
                  <Route path="parent/:tab" element={<ParentPortal />} />
                  <Route path="platform" element={<Navigate to="/platform/overview" replace />} />
                  <Route path="platform/:tab" element={<SaasControlCenter />} />
                  <Route path="lms" element={<Navigate to="/lms/assignments" replace />} />
                  <Route path="lms/:tab" element={<Homework />} />
                  <Route path="accounts" element={<Navigate to="/accounts/overview" replace />} />
                  <Route path="accounts/:tab" element={<Accounts />} />
                  <Route path="reports" element={<Navigate to="/reports/academic" replace />} />
                  <Route path="reports/:tab" element={<Reports />} />
                  <Route path="settings" element={<Navigate to="/settings/school" replace />} />
                  <Route path="settings/:tab" element={<Settings />} />
                  <Route path="setup" element={<SchoolSetup />} />
                  <Route path="admissions" element={<Navigate to="/admissions/applications" replace />} />
                  <Route path="admissions/:tab" element={<Admissions />} />
                  <Route path="m/admissions" element={<Navigate to="/admissions/applications" replace />} />
                  <Route path="transport" element={<Navigate to="/transport/today" replace />} />
                  <Route path="transport/:tab" element={<Transport />} />
                  <Route path="m/transport" element={<Navigate to="/transport/today" replace />} />
                  <Route path="m/onboarding" element={<Navigate to="/setup" replace />} />
                  <Route path="m/:moduleId" element={<ModulePreview />} />
                  <Route path="guide" element={<PrototypeGuide />} />
                  <Route path="*" element={<RoleHome />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <ThemedToaster />
          </TooltipProvider>
        </AcademicProvider>
        </PayrollProvider>
        </StaffProvider>
        </AccountsProvider>
      </AdminProvider>
    </AppProvider>);

}