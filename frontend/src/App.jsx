import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import ActuatorControl from './pages/ActuatorControl';
import NewIncubation from './pages/NewIncubation';
import EggGrowth from './pages/EggGrowth';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/control/:id" 
            element={
              <PrivateRoute>
                <ActuatorControl />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/incubations/new" 
            element={
              <PrivateRoute>
                <NewIncubation />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/growth/:id" 
            element={
              <PrivateRoute>
                <EggGrowth />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/alerts/:id" 
            element={
              <PrivateRoute>
                <Alerts />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;