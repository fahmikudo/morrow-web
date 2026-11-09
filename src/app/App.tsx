import { Navigate, Route, Routes } from 'react-router';
import { AppShell } from '@/app/layouts/AppShell';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { isServerMode } from '@/services';
import { AreaDetailPage } from '@/features/areas/AreaDetailPage';
import { AreasPage } from '@/features/areas/AreasPage';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { HabitsPage } from '@/features/habits/HabitsPage';
import { InboxPage } from '@/features/inbox/InboxPage';
import { KnowledgePage } from '@/features/knowledge/KnowledgePage';
import { NoteEditorPage } from '@/features/knowledge/editor/NoteEditorPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { TodayPage } from '@/features/today/TodayPage';

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<LoginPage mode="register" />} />
      <Route
        element={
          isServerMode ? (
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          ) : (
            <AppShell />
          )
        }
      >
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="areas" element={<AreasPage />} />
        <Route path="areas/:areaId" element={<AreaDetailPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="knowledge/new" element={<NoteEditorPage />} />
        <Route path="knowledge/:noteId" element={<NoteEditorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
