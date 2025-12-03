import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PasswordModal from './PasswordModal';
import { getApiUrl } from '../services/apiService';
import '../styles/COCDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

function COCDashboard() {
  // Get current month's first and last date
  const getCurrentMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      first: firstDay.toISOString().split('T')[0],
      last: lastDay.toISOString().split('T')[0]
    };
  };

  const defaultDates = getCurrentMonthDates();
  
  const [cocData, setCocData] = useState([]);
  const [filteredCocData, setFilteredCocData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState(defaultDates.first);
  const [toDate, setToDate] = useState(defaultDates.last);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // Initial load
  useEffect(() => {
    loadCompanies();
    loadStockData();
    loadCOCData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload on filters change
  useEffect(() => {
    loadCOCData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  // Reload on company change
  useEffect(() => {
    loadCOCData();
    loadStockData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const loadCompanies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/coc/companies`);
      if (response.data.success) {
        setCompanies(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedCompany(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadCOCData = async () => {
    setLoading(true);
    try {
      const params = { 
        company: selectedCompany || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined
      };
      
      const response = await axios.get(`${API_BASE_URL}/coc/list`, { params });
      if (response.data.success) {
        setCocData(response.data.data);
        setFilteredCocData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading COC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredCocData(cocData);
      return;
    }
    
    const filtered = cocData.filter(coc => 
      coc.invoice_no.toLowerCase().includes(term.toLowerCase()) ||
      coc.lot_batch_no.toLowerCase().includes(term.toLowerCase()) ||
      coc.material.toLowerCase().includes(term.toLowerCase()) ||
      coc.brand?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredCocData(filtered);
  };

  const loadStockData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/coc/stock`, {
        params: { company: selectedCompany || undefined }
      });
      if (response.data.success) {
        setStockData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
    }
  };

  // Password verification handler
  const handlePasswordVerification = (verified) => {
    setShowPasswordModal(false);
    
    if (verified) {
      setIsPasswordVerified(true);
      
      // Execute pending action
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
      
      // Auto-lock after 5 minutes
      setTimeout(() => {
        setIsPasswordVerified(false);
      }, 5 * 60 * 1000);
    } else {
      setPendingAction(null);
    }
  };

  // Check password before action
  const checkPasswordAndExecute = (action) => {
    if (isPasswordVerified) {
      action();
    } else {
      setPendingAction(() => action);
      setShowPasswordModal(true);
    }
  };

  const syncCOCData = async () => {
    // Check password before syncing COC data
    checkPasswordAndExecute(async () => {
      await performSyncCOC();
    });
  };

  const performSyncCOC = async () => {
    if (!fromDate || !toDate) {
      setMessage('⚠️ Please select From Date and To Date');
      return;
    }
    
    setSyncing(true);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/coc/sync`, {
        from_date: fromDate,
        to_date: toDate
      });
      
      if (response.data.success) {
        setMessage(`✅ Synced: ${response.data.synced} new, ${response.data.updated} updated (${fromDate} to ${toDate})`);
        loadCOCData();
        loadStockData();
        loadCompanies();
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const generateConsolidatedReport = async () => {
    if (!selectedCompany) {
      alert('Please select a company');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/generate-consolidated-report`,
        {
          company_name: selectedCompany,
          from_date: '2025-11-01',
          to_date: '2025-11-30'
        },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Consolidated_Report_${selectedCompany}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="coc-dashboard">
      <div className="dashboard-header">
        <h1>📋 COC & Raw Material Dashboard</h1>
        <div className="header-actions">
          <div className="date-filters">
            <label>
              From Date:
              <input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)}
                className="date-input"
              />
            </label>
            <label>
              To Date:
              <input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)}
                className="date-input"
              />
            </label>
          </div>
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="company-select"
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
          <button onClick={syncCOCData} disabled={syncing} className="btn-sync">
            {syncing ? '⏳ Syncing...' : '🔄 Sync COC Data'}
          </button>
          <button onClick={generateConsolidatedReport} className="btn-report">
            📄 Generate Report
          </button>
        </div>
      </div>

      <div className="info-banner">
        <div>
          <span>📅 <strong>Showing COC documents:</strong> {fromDate} to {toDate}</span>
          {selectedCompany && <span style={{marginLeft: '15px'}}>| 🏢 <strong>Company:</strong> {selectedCompany}</span>}
        </div>
        <div style={{fontSize: '12px', opacity: 0.8, marginTop: '5px'}}>
          💡 Change dates to filter records | Click "Sync COC Data" to fetch new data from API
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Material Stock Summary */}
      <div className="section">
        <h2>📦 Raw Material Stock</h2>
        <div className="stock-grid">
          {stockData.map((item, index) => (
            <div key={index} className="stock-card">
              <h3>{item.material}</h3>
              <div className="stock-info">
                <div className="stock-item">
                  <span className="label">Make:</span>
                  <span className="value make">{item.make || 'N/A'}</span>
                </div>
                <div className="stock-item">
                  <span className="label">Received:</span>
                  <span className="value">{item.total_received.toLocaleString()}</span>
                </div>
                <div className="stock-item">
                  <span className="label">Consumed:</span>
                  <span className="value consumed">{item.total_consumed.toLocaleString()}</span>
                </div>
                <div className="stock-item highlight">
                  <span className="label">Available:</span>
                  <span className={`value ${item.available < 1000 ? 'low-stock' : ''}`}>
                    {item.available.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="stock-bar">
                <div 
                  className="stock-progress"
                  style={{width: `${(item.available / item.total_received) * 100}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COC Documents List */}
      <div className="section">
        <div className="section-header">
          <h2>📄 COC Documents</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search by Invoice, Lot, Material, Brand..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={() => handleSearch('')} className="clear-btn">✕</button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <div className="results-info">
              Showing {filteredCocData.length} of {cocData.length} records
            </div>
            <div className="coc-table-container">
              <table className="coc-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Material</th>
                    <th>Brand</th>
                    <th>Lot/Batch</th>
                    <th>Invoice</th>
                    <th>Invoice Date</th>
                    <th>COC Qty</th>
                    <th>Consumed</th>
                    <th>Available</th>
                    <th>Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCocData.map((coc) => (
                  <tr key={coc.id}>
                    <td>{coc.company}</td>
                    <td>{coc.material}</td>
                    <td>{coc.brand || 'N/A'}</td>
                    <td>{coc.lot_batch_no}</td>
                    <td>{coc.invoice_no}</td>
                    <td>{coc.invoice_date}</td>
                    <td className="number">{coc.coc_qty.toLocaleString()}</td>
                    <td className="number consumed">{coc.consumed_qty?.toLocaleString() || 0}</td>
                    <td className={`number ${coc.available_qty < 100 ? 'low-stock' : ''}`}>
                      {coc.available_qty?.toLocaleString() || 0}
                    </td>
                    <td>
                      {coc.coc_document_url && (
                        <a href={coc.coc_document_url} target="_blank" rel="noopener noreferrer" className="doc-link">
                          📄 COC
                        </a>
                      )}
                      {coc.iqc_document_url && (
                        <a href={coc.iqc_document_url} target="_blank" rel="noopener noreferrer" className="doc-link">
                          📋 IQC
                        </a>
                      )}
                    </td>
                  </tr>
                  ))}
                  {filteredCocData.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                        {searchTerm ? `No results found for "${searchTerm}"` : 'No COC documents available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Password Modal */}
      <PasswordModal 
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingAction(null);
        }}
        onVerify={handlePasswordVerification}
        title="🔒 Password Required"
        message="Enter password to sync COC data. Access will remain active for 5 minutes."
      />
    </div>
  );
}

export default COCDashboard;
