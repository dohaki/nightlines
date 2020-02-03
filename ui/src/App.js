import React from 'react';
import { ThemeProvider } from 'theme-ui';
import theme from '@theme-ui/preset-deep';

import Login from './pages/Login';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Login />
    </ThemeProvider>
  );
}

export default App;
