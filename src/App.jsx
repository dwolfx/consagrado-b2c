import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TableProvider, useTableContext } from './context/TableContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen/SplashScreen';
import { useAppBootSplash } from './components/SplashScreen/useAppBootSplash';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import TabDetail from './pages/TabDetail';
import Scanner from './pages/Scanner';
import Payment from './pages/Payment';
import History from './pages/History';
import Menu from './pages/Menu';
import Profile from './pages/Profile';
import AvatarEditor from './pages/AvatarEditor';
import ResetPassword from './pages/ResetPassword';

// Rota raiz inteligente:
// não logado → /login
// logado sem estabelecimento/mesa → /scanner
// logado com vínculo → Home
const EntryGuard = () => {
  const { user, loading } = useAuth();
  const { tableId, loadingTable } = useTableContext();

  if (loading || loadingTable) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const hasEstablishment = tableId || localStorage.getItem('b2c_entry_establishment_id');
  if (!hasEstablishment) return <Navigate to="/scanner" replace />;

  return <Home />;
};

const AppBootOverlay = () => {
  const { loading } = useAuth();
  const { loadingTable } = useTableContext();
  const { showSplash, isExiting } = useAppBootSplash(Boolean(loading || loadingTable));

  if (!showSplash) return null;
  return <SplashScreen isExiting={isExiting} />;
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <TableProvider>
            <NotificationProvider>
              <AppBootOverlay />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/" element={<EntryGuard />} />

                <Route path="/tab" element={
                  <ProtectedRoute>
                    <TabDetail />
                  </ProtectedRoute>
                } />

                <Route path="/scanner" element={
                  <ProtectedRoute>
                    <Scanner />
                  </ProtectedRoute>
                } />

                <Route path="/payment" element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                } />

                <Route path="/history" element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                } />

                <Route path="/menu" element={
                  <ProtectedRoute>
                    <Menu />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                <Route path="/avatar-editor" element={
                  <ProtectedRoute>
                    <AvatarEditor />
                  </ProtectedRoute>
                } />

                {/* Catch all - Redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationProvider>
          </TableProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
