import React, { useState, useEffect, useCallback } from 'react';
import '../styles/PDIDocGenerator.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5003/api'
    : '/api')).trim();

const PDIDocGenerator = () => {
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [pdis, setPdis] = useState([]);
  const [selectedPdi, setSelectedPdi] = useState(null);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [productionDays, setProductionDays] = useState(3);
  const [moduleType, setModuleType] = useState('G2G580');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(null);
  const [templateInfo, setTemplateInfo] = useState(null);
  const [error, setError] = useState('');
  const [downloadStatus, setDownloadStatus] = useState({});

  // Document types
  const docTypes = [
    { id: 'ipqc', name: 'IPQC Report', icon: '📋', ext: 'xlsx', desc: 'IPQC inspection with all stages & checkpoints' },
    { id: 'witness', name: 'Witness Report', icon: '👁️', ext: 'xlsx', desc: 'FTR, Visual, EL, Safety, Dimension sheets' },
    { id: 'sampling', name: 'Sampling Plan', icon: '📊', ext: 'xlsx', desc: 'IS 2500 / ISO 2859 AQL sampling plan' },
    { id: 'calibration', name: 'Calibration List', icon: '🔧', ext: 'xlsx', desc: 'All instruments with calibration status' },
    { id: 'mom', name: 'MOM (PDF)', icon: '📝', ext: 'pdf', desc: 'Minutes of Meeting with FTR summary' },
  ];

  const moduleTypes = [
    'G2B510', 'G2B520', 'G2B530', 'G2B540', 'G2X550', 'G2X560',
    'G2G570', 'G2G575', 'G2G580', 'G2G585', 'G2G590', 'G2G595', 'G2G600', 'G2G605', 'G2G610',
    'G3G615', 'G3G620', 'G3G625', 'G3G630', 'G3G635', 'G3G640',
    'G12R622', 'G12R652'
  ];

  // Health check
  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/pdi-docs/health`);
      if (res.ok) { setBackendReady(true); return true; }
      setBackendReady(false); return false;
    } catch { setBackendReady(false); return false; }
  }, []);

  // Load companies
  const loadCompanies = useCallback(async () => {
    try {
      let res = await fetch(`${API_BASE_URL}/pdi-docs/companies`);
      if (res.ok) {
        const data = await res.json();
        if (data.companies && data.companies.length > 0) {
          setCompanies(data.companies);
          return;
        }
      }
      res = await fetch(`${API_BASE_URL}/companies`);
      if (res.ok) {
        const data = await res.json();
        const list = data.companies || data.data || [];
        setCompanies(list.map(c => ({
          id: c.id || c.company_id || c.name,
          name: c.name || c.company_name || c.id
        })));
      }
    } catch (err) { console.error('Failed to load companies:', err); }
  }, []);

  const loadPdis = async (companyId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pdi-docs/pdis/${encodeURIComponent(companyId)}`);
      if (res.ok) { const data = await res.json(); setPdis(data.pdis || []); }
    } catch (err) { console.error('Failed to load PDIs:', err); }
    finally { setLoading(false); }
  };

  const loadSerials = async (pdiId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pdi-docs/serials/${pdiId}`);
      if (res.ok) { const data = await res.json(); setSerialNumbers(data.serials || []); }
    } catch (err) { console.error('Failed to load serials:', err); }
    finally { setLoading(false); }
  };

  const loadTemplateInfo = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/pdi-docs/template-info`);
      if (res.ok) { const data = await res.json(); setTemplateInfo(data); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    checkBackend();
    loadCompanies();
    loadTemplateInfo();
  }, [checkBackend, loadCompanies, loadTemplateInfo]);

  const handleCompanySelect = (companyId) => {
    setSelectedCompany(companyId);
    setSelectedPdi(null);
    setSerialNumbers([]);
    setDownloadStatus({});
    if (companyId) loadPdis(companyId);
    else setPdis([]);
  };

  const handlePdiSelect = (pdiId) => {
    const pdi = pdis.find(p => p.id === parseInt(pdiId));
    setSelectedPdi(pdi);
    setDownloadStatus({});
    if (pdiId) loadSerials(pdiId);
    else setSerialNumbers([]);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Download individual document
  const handleDownload = async (docType) => {
    if (!selectedCompany || !selectedPdi || serialNumbers.length === 0) {
      setError('Please select company, PDI and ensure serials are loaded');
      return;
    }

    setDownloadStatus(prev => ({ ...prev, [docType.id]: 'downloading' }));
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/pdi-docs/download/${docType.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCompany,
          company_name: companies.find(c => c.id === selectedCompany)?.name || selectedCompany,
          pdi_id: selectedPdi.id,
          pdi_number: selectedPdi.pdi_number,
          serial_numbers: serialNumbers,
          production_days: productionDays,
          report_date: formatDisplayDate(reportDate),
          module_type: moduleType,
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docType.name.replace(/ /g, '_')}_${selectedPdi.pdi_number}.${docType.ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadStatus(prev => ({ ...prev, [docType.id]: 'done' }));
      } else {
        const errData = await res.json().catch(() => ({}));
        setDownloadStatus(prev => ({ ...prev, [docType.id]: 'error' }));
        setError(`${docType.name} error: ${errData.error || `Server ${res.status}`}`);
      }
    } catch (err) {
      setDownloadStatus(prev => ({ ...prev, [docType.id]: 'error' }));
      setError(`${docType.name} download failed: ${err.message}`);
    }
  };

  // Download all one by one
  const handleDownloadAll = async () => {
    for (const doc of docTypes) {
      await handleDownload(doc);
      // small delay between downloads
      await new Promise(r => setTimeout(r, 800));
    }
  };

  const steps = [
    { num: 1, label: 'Select PDI', icon: '🎯' },
    { num: 2, label: 'Configure', icon: '⚙️' },
    { num: 3, label: 'Download', icon: '📥' },
  ];

  const canProceed = () => {
    if (step === 1) return selectedCompany && selectedPdi && serialNumbers.length > 0;
    if (step === 2) return moduleType && reportDate;
    return true;
  };

  return (
    <div className="pdi-doc-generator">
      {/* Header */}
      <div className="pdg-header">
        <div className="pdg-header-content">
          <div>
            <h1>📄 PDI Documentation Generator</h1>
            <p>Generate IPQC, Witness Report, Sampling Plan, Calibration List & MOM — download individually</p>
          </div>
          <div className="pdg-header-badges">
            <span className="pdg-version">v5</span>
            <span className={`pdg-status ${backendReady ? 'ready' : 'not-ready'}`}>
              {backendReady === null ? '⏳ Checking...' : backendReady ? '✅ Ready' : '❌ Not Ready'}
            </span>
          </div>
        </div>
      </div>

      {backendReady === false && (
        <div className="pdg-warning">
          ⚠️ Backend not available. Run: <code>pm2 restart pdi-backend</code>
          <button onClick={checkBackend} className="pdg-retry-btn">Retry</button>
        </div>
      )}

      {/* Steps */}
      <div className="pdg-steps">
        {steps.map(s => (
          <div
            key={s.num}
            className={`pdg-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
            onClick={() => s.num <= step && setStep(s.num)}
          >
            <span className="pdg-step-icon">{step > s.num ? '✓' : s.icon}</span>
            <span className="pdg-step-label">{s.label}</span>
          </div>
        ))}
      </div>

      {error && <div className="pdg-error">{error}</div>}

      <div className="pdg-content">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="pdg-step-content">
            <h2>🎯 Select Company & PDI</h2>
            <div className="pdg-form-group">
              <label>Company ({companies.length} found)</label>
              <select value={selectedCompany} onChange={(e) => handleCompanySelect(e.target.value)}>
                <option value="">-- Select Company --</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {selectedCompany && (
              <div className="pdg-form-group">
                <label>PDI Batch {loading ? '(loading...)' : `(${pdis.length} found)`}</label>
                <select value={selectedPdi?.id || ''} onChange={(e) => handlePdiSelect(e.target.value)} disabled={loading}>
                  <option value="">-- Select PDI --</option>
                  {pdis.map(p => <option key={p.id} value={p.id}>{p.pdi_number} ({p.total_modules} modules)</option>)}
                </select>
              </div>
            )}

            {selectedPdi && (
              <div className="pdg-serial-info">
                <div className="pdg-info-card">
                  <span className="pdg-info-label">📦 Serials Loaded</span>
                  <span className="pdg-info-value">{serialNumbers.length}</span>
                </div>
                <div className="pdg-info-card">
                  <span className="pdg-info-label">📋 PDI Number</span>
                  <span className="pdg-info-value">{selectedPdi.pdi_number}</span>
                </div>
                {templateInfo && (
                  <div className="pdg-info-card">
                    <span className="pdg-info-label">🔍 IPQC Checkpoints</span>
                    <span className="pdg-info-value">{templateInfo.total_stages} stages / {templateInfo.total_checkpoints} checks</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="pdg-step-content">
            <h2>⚙️ Configuration</h2>
            <div className="pdg-form-row">
              <div className="pdg-form-group">
                <label>Module Type</label>
                <select value={moduleType} onChange={(e) => setModuleType(e.target.value)}>
                  {moduleTypes.map(mt => <option key={mt} value={mt}>{mt}</option>)}
                </select>
              </div>
              <div className="pdg-form-group">
                <label>Report Date</label>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
              </div>
              <div className="pdg-form-group">
                <label>Production Days</label>
                <select value={productionDays} onChange={(e) => setProductionDays(parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} {d === 1 ? 'Day' : 'Days'}</option>)}
                </select>
              </div>
            </div>

            <div className="pdg-summary-preview">
              <h3>📋 Summary</h3>
              <table className="pdg-summary-table">
                <tbody>
                  <tr><td>Company</td><td>{companies.find(c => c.id === selectedCompany)?.name}</td></tr>
                  <tr><td>PDI</td><td>{selectedPdi?.pdi_number}</td></tr>
                  <tr><td>Modules</td><td>{serialNumbers.length}</td></tr>
                  <tr><td>Module Type</td><td>{moduleType}</td></tr>
                  <tr><td>Production Days</td><td>{productionDays}</td></tr>
                  <tr><td>Report Date</td><td>{formatDisplayDate(reportDate)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 3: Download */}
        {step === 3 && (
          <div className="pdg-step-content">
            <h2>📥 Download Documents</h2>
            <p style={{color: '#666', marginBottom: '16px'}}>
              Each document downloads as a separate file. Click individually or use "Download All".
            </p>

            <div className="pdg-download-grid">
              {docTypes.map(doc => {
                const status = downloadStatus[doc.id];
                return (
                  <div key={doc.id} className={`pdg-download-card ${status || ''}`}>
                    <div className="pdg-download-icon">{doc.icon}</div>
                    <div className="pdg-download-info">
                      <div className="pdg-download-name">{doc.name}</div>
                      <div className="pdg-download-desc">{doc.desc}</div>
                      <div className="pdg-download-file">
                        {doc.name.replace(/ /g, '_')}_{selectedPdi?.pdi_number}.{doc.ext}
                      </div>
                    </div>
                    <button
                      className={`pdg-download-btn ${status || ''}`}
                      onClick={() => handleDownload(doc)}
                      disabled={status === 'downloading' || !backendReady}
                    >
                      {status === 'downloading' ? (
                        <><span className="pdg-spinner"></span> Generating...</>
                      ) : status === 'done' ? (
                        <>✅ Downloaded</>
                      ) : status === 'error' ? (
                        <>❌ Retry</>
                      ) : (
                        <>📥 Download</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pdg-download-actions">
              <button
                className="pdg-download-all-btn"
                onClick={handleDownloadAll}
                disabled={Object.values(downloadStatus).some(s => s === 'downloading') || !backendReady}
              >
                🚀 Download All ({docTypes.length} files)
              </button>

              {Object.values(downloadStatus).filter(s => s === 'done').length > 0 && (
                <div className="pdg-download-summary">
                  ✅ {Object.values(downloadStatus).filter(s => s === 'done').length} of {docTypes.length} downloaded
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="pdg-navigation">
        {step > 1 && (
          <button className="pdg-nav-btn prev" onClick={() => setStep(step - 1)}>← Previous</button>
        )}
        <div className="pdg-nav-spacer"></div>
        {step < 3 && (
          <button className="pdg-nav-btn next" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next →
          </button>
        )}
      </div>

      <div className="pdg-howto">
        <h4>💡 How it works:</h4>
        <p>
          Select company → PDI → Configure → Download each document separately.
          IPQC, Witness & Sampling are Excel files you can upload individually.
          MOM is a professional PDF with signatures section.
        </p>
      </div>
    </div>
  );
};

export default PDIDocGenerator;
