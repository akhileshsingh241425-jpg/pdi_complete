import React, { useState, useEffect } from 'react';
import IPQCForm from './components/IPQCForm';
import DailyReport from './components/DailyReport';
import RejectionAnalysis from './components/RejectionAnalysis';
import PeelTestReport from './components/PeelTestReport';
import MasterDataUpload from './components/MasterDataUpload';
import FTRDownload from './components/FTRDownload';
import MasterDataViewer from './components/MasterDataViewer';
import RejectionUpload from './components/RejectionUpload';
import FTRDeliveredUpload from './components/FTRDeliveredUpload';
import COCDashboard from './components/COCDashboard';
import Login from './components/Login';
import './styles/Navbar.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState('ipqc');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loginTime');
    setIsAuthenticated(false);
    setActiveSection('ipqc');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderSection = () => {
    switch(activeSection) {
      case 'ipqc':
        return <IPQCForm />;
      case 'daily-report':
        return <DailyReport />;
      case 'rejection-analysis':
        return <RejectionAnalysis />;
      case 'peel-test':
        return <PeelTestReport />;
      case 'master-data':
        return <MasterDataUpload />;
      case 'master-data-viewer':
        return <MasterDataViewer />;
      case 'ftr-download':
        return <FTRDownload />;
      case 'rejection-upload':
        return <RejectionUpload />;
      case 'ftr-delivered':
        return <FTRDeliveredUpload />;
      case 'coc-dashboard':
        return <COCDashboard />;
      case 'reports':
        return <div className="section-placeholder"><h2>Reports</h2><p>Coming Soon...</p></div>;
      case 'settings':
        return <div className="section-placeholder"><h2>Settings</h2><p>Coming Soon...</p></div>;
      default:
        return <IPQCForm />;
    }
  };

  return (
    <div className="App">
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>{!sidebarCollapsed && 'PDI IPQC'}</h2>
          <button 
            className="toggle-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
        </div>
        <ul className="sidebar-menu">
          <li 
            className={activeSection === 'daily-report' ? 'active' : ''}
            onClick={() => setActiveSection('daily-report')}
            title="Daily Report"
          >
            <span className="icon">📊</span>
            {!sidebarCollapsed && <span className="label">Daily Report</span>}
          </li>
          <li 
            className={activeSection === 'ipqc' ? 'active' : ''}
            onClick={() => setActiveSection('ipqc')}
            title="IPQC Form"
          >
            <span className="icon">📝</span>
            {!sidebarCollapsed && <span className="label">IPQC Form</span>}
          </li>
          <li 
            className={activeSection === 'rejection-analysis' ? 'active' : ''}
            onClick={() => setActiveSection('rejection-analysis')}
            title="Rejection Analysis"
          >
            <span className="icon">🔍</span>
            {!sidebarCollapsed && <span className="label">Rejection Analysis</span>}
          </li>
          <li 
            className={activeSection === 'peel-test' ? 'active' : ''}
            onClick={() => setActiveSection('peel-test')}
            title="Peel Test Report"
          >
            <span className="icon">🧪</span>
            {!sidebarCollapsed && <span className="label">Peel Test Report</span>}
          </li>
          <li 
            className={activeSection === 'master-data' ? 'active' : ''}
            onClick={() => setActiveSection('master-data')}
            title="Master Data Upload"
          >
            <span className="icon">📤</span>
            {!sidebarCollapsed && <span className="label">Master Data Upload</span>}
          </li>
          <li 
            className={activeSection === 'master-data-viewer' ? 'active' : ''}
            onClick={() => setActiveSection('master-data-viewer')}
            title="View Master Data"
          >
            <span className="icon">📋</span>
            {!sidebarCollapsed && <span className="label">View Master Data</span>}
          </li>
          <li 
            className={activeSection === 'ftr-download' ? 'active' : ''}
            onClick={() => setActiveSection('ftr-download')}
            title="FTR Download"
          >
            <span className="icon">📥</span>
            {!sidebarCollapsed && <span className="label">FTR Download</span>}
          </li>
          <li 
            className={activeSection === 'rejection-upload' ? 'active' : ''}
            onClick={() => setActiveSection('rejection-upload')}
            title="Rejection Upload"
          >
            <span className="icon">🚫</span>
            {!sidebarCollapsed && <span className="label">Rejection Upload</span>}
          </li>
          <li 
            className={activeSection === 'ftr-delivered' ? 'active' : ''}
            onClick={() => setActiveSection('ftr-delivered')}
            title="FTR Delivered"
          >
            <span className="icon">✅</span>
            {!sidebarCollapsed && <span className="label">FTR Delivered</span>}
          </li>
          <li 
            className={activeSection === 'coc-dashboard' ? 'active' : ''}
            onClick={() => setActiveSection('coc-dashboard')}
            title="COC & Raw Material Dashboard"
          >
            <span className="icon">📋</span>
            {!sidebarCollapsed && <span className="label">COC Dashboard</span>}
          </li>
          <li 
            className={activeSection === 'reports' ? 'active' : ''}
            onClick={() => setActiveSection('reports')}
            title="Reports"
          >
            <span className="icon">📄</span>
            {!sidebarCollapsed && <span className="label">Reports</span>}
          </li>
          <li 
            className={activeSection === 'settings' ? 'active' : ''}
            onClick={() => setActiveSection('settings')}
            title="Settings"
          >
            <span className="icon">⚙️</span>
            {!sidebarCollapsed && <span className="label">Settings</span>}
          </li>
          <li 
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <span className="icon">🚪</span>
            {!sidebarCollapsed && <span className="label">Logout</span>}
          </li>
        </ul>
      </div>
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {renderSection()}
      </div>
    </div>
  );
}

export default App;
