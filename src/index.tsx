import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import TestApp from './TestApp'; // Import for testing

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
    {/* <TestApp /> */} {/* Use for testing */}
  </React.StrictMode>
); 