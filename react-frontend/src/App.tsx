import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      
      {/* Protected Routes */ }
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        {/* Pridáme sem ďalšie routy pre škálovanie (Napr. /settings, /users a pod.) */}
      </Route>
      
      {/* Catch all route - presmeruje na Dashboard ak zadáme hlúposť */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
