import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Recommend from './pages/Recommend';
import Menu from './pages/Menu';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import LoginCallback from './pages/LoginCallback';
import { useUser } from './hooks/useFood';
import './index.css';

function AppContent() {
  const { initialized } = useUser();

  return (
    <div className="app">
      <div className="bg-pattern" />
      <div className="bg-grid" />

      <Header />

      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login/callback" element={<LoginCallback />} />

          {/* Admin only route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2024 Ginraidee - Made with 🍜</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
