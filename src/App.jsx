import React, { useState } from 'react';
import BlogGenerator from './components/BlogGenerator';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Blog Generator</h1>
      </header>
      <main>
        <BlogGenerator />
      </main>
    </div>
  );
}

export default App; 