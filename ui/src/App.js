import React from 'react';
import { ThemeProvider } from 'theme-ui';
import theme from "./theme";

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* <Login /> */}
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;
