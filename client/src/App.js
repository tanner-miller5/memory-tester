import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from 'react-query';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Layout from './components/Layout';
import Home from './pages/Home';
import CreateTest from './pages/CreateTest';
import TakeTest from './pages/TakeTest';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import StudyTest from './components/StudyTest';


// Add these imports at the top of App.js
import Login from './pages/Login';
import Register from './pages/Register';

import UpcomingTests from './components/UpcomingTests';
import ManageTests from "./components/ManageTests";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Home />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/create-test"
                  element={
                    <PrivateRoute>
                      <CreateTest />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/take-test/:testId/:scheduleId"
                  element={
                    <PrivateRoute>
                      <TakeTest />
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
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/upcoming-tests" element={<UpcomingTests />} />
                <Route
                    path="/manage-tests"
                    element={
                      <PrivateRoute>
                        <ManageTests />
                      </PrivateRoute>
                    }
                />
                <Route path="/study-test/:testId" element={<StudyTest />} />

              </Routes>
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;