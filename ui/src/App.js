import React from 'react';
import { ThemeProvider } from 'theme-ui';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

import theme from "./theme";

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

toast.configure();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Switch>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/">
            <Dashboard />
          </Route>
        </Switch>
      </Router>
    </ThemeProvider>
  );
}

export default App;
