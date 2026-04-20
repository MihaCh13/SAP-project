import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginContainer from './components/LoginContainer'
import MainLayout from './components/layout/MainLayout'
import DashboardPage from './pages/DashboardPage'
import PublicHubPage from './pages/PublicHubPage'
import MyDraftsPage from './pages/MyDraftsPage'
import NewDocumentPage from './pages/NewDocumentPage'
import PendingReviewPage from './pages/PendingReviewPage'
import UsersRolesPage from './pages/UsersRolesPage'
import AuditLogsPage from './pages/AuditLogsPage'
import HelpPage from './pages/HelpPage'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginContainer />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="public-hub" element={<PublicHubPage />} />
          <Route path="my-drafts" element={<MyDraftsPage />} />
          <Route path="new-document" element={<NewDocumentPage />} />
          <Route path="pending-review" element={<PendingReviewPage />} />
          <Route path="users-roles" element={<UsersRolesPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="profile" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
