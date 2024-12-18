import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { ChatView } from './components/chat/ChatView';
import { ProtectedRoute, AuthRoute } from './components/auth/RouteGuard';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { EmailVerification } from './components/auth/EmailVerification';
import { FriendsView } from './components/friends/FriendsView';
import { InvitePage } from './pages/Invite';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/channels/@me" replace />} />
          
          {/* Auth pages with AuthLayout */}
          <Route element={<AuthLayout />}>
            {/* Login/Register with guard */}
            <Route element={<AuthRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            
            {/* Password reset routes - no guard */}
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route path="/verify-email" element={<EmailVerification />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/channels/@me" element={<FriendsView />} />
              <Route path="/channels/:serverId" element={<ChatView />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/invite/:code" element={<InvitePage />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;