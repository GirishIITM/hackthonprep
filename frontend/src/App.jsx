import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import NavSidebar from './components/NavSidebar';
import About from './pages/About';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Projects from './pages/solutions/Projects';
import Tasks from './pages/solutions/Tasks';
import { isAuthenticated } from './utils/apiCalls/auth';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <main>
          <Routes>
            {/* Public routes */}
            <Route path='/register' element={
              <>
                <Navbar />
                {isAuthenticated() ? <Navigate to="/solutions/tasks" replace /> : <Register />}
              </>
            } />
            <Route path='/login' element={
              <>
                <Navbar />
                {isAuthenticated() ? <Navigate to="/solutions/tasks" replace /> : <Login />}
              </>
            } />
            <Route path='/about' element={
              <>
                <Navbar />
                <About />
              </>
            } />

            {/* Add this route for Reset Password */}
            <Route path="/reset-password" element={
              <>
                <Navbar />
                <ResetPassword />
              </>
            } />

            {/* Home page - accessible to everyone, no redirection for authenticated users */}
            <Route path='/' element={
              <>
                <Navbar />
                <Home />
              </>
            } />

            {/* Protected routes */}
            <Route path='/solutions/tasks' element={
              <PrivateRoute>
                <NavSidebar>
                  <Tasks />
                </NavSidebar>
              </PrivateRoute>
            } />
            <Route path='/solutions/projects' element={
              <PrivateRoute>
                <NavSidebar>
                  <Projects />
                </NavSidebar>
              </PrivateRoute>
            } />

            {/* Profile route - protected */}
            <Route path='/profile' element={
              <PrivateRoute>
                <Navbar />
                <Profile />
              </PrivateRoute>
            } />

            {/* Forgot password route */}
            <Route path="/forgot-password" element={
              <>
                <Navbar />
                <ForgotPassword />
              </>
            } />
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
