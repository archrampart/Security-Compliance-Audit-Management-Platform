import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Organizations from './pages/Organizations'
import Projects from './pages/Projects'
import Audits from './pages/Audits'
import Findings from './pages/Findings'
import Templates from './pages/Templates'
import Users from './pages/Users'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { ConfirmDialog } from './components/ConfirmDialog'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="users" element={<Users />} />
            <Route path="projects" element={<Projects />} />
            <Route path="audits" element={<Audits />} />
            <Route path="findings" element={<Findings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="templates" element={<Templates />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ConfirmDialog />
    </>
  )
}

export default App

