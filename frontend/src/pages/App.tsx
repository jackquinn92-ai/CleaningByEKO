import React, { useState } from 'react';
import GuardFlow from './GuardFlow';
import AdminShell from './AdminShell';
import logo from '/logo.svg';

const App: React.FC = () => {
  const [view, setView] = useState<'guard' | 'admin'>('guard');

  return (
    <div className="app">
      <header className="topbar">
        <img src={logo} alt="Cleaning by EKO" className="logo" />
        <div className="nav">
          <button className={view === 'guard' ? 'active' : ''} onClick={() => setView('guard')}>
            Guard
          </button>
          <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>
            Admin
          </button>
        </div>
      </header>
      {view === 'guard' ? <GuardFlow /> : <AdminShell />}
    </div>
  );
};

export default App;
