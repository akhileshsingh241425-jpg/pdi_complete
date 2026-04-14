/**
 * IPQC & Peel Test - Combined Component with Tabs
 * Tab 1: IPQC Form (In-Process Quality Check Report Generator)
 * Tab 2: Peel Test Report Generator
 */
import React, { useState, useEffect } from 'react';
import ipqcService, { getApiUrl } from '../services/apiService';
import '../styles/IPQCForm.css';

const IPQCForm = () => {
  const [activeTab, setActiveTab] = useState('ipqc');

  // ══════════════════════════════════════════
  // IPQC Form State
  // ══════════════════════════════════════════
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'Day',
    customer_id: 'GSPL/IPQC/IPC/003',
    po_number: '',
    serial_prefix: 'GS04875KG302250',
    serial_start: 1,
    module_count: 1,
    cell_manufacturer: 'Solar Space',
    cell_efficiency: '25.7',
    jb_cable_length: '1200',
    golden_module_number: 'GM-2024-001',
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  // eslint-disable-next-line no-unused-vars
  const [templateInfo, setTemplateInfo] = useState(null);

  // ══════════════════════════════════════════
  // Peel Test State
  // ══════════════════════════════════════════
  const [peelData, setPeelData] = useState({
    date: new Date().toISOString().split('T')[0],
    stringer_count: 1,
    shift: 'Day'
  });
  const [peelMessage, setPeelMessage] = useState({ text: '', type: '' });
  const [peelLoading, setPeelLoading] = useState(false);

  // ══════════════════════════════════════════
  // IPQC Effects & Handlers
  // ══════════════════════════════════════════
  useEffect(() => {
    loadCustomers();
    loadTemplateInfo();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await ipqcService.listCustomers();
      if (response.success) setCustomers(response.customers);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadTemplateInfo = async () => {
    try {
      const response = await ipqcService.getTemplateInfo();
      if (response.success) setTemplateInfo(response);
    } catch (error) {
      console.error('Failed to load template info:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;
    if (type === 'number') {
      processedValue = value === '' ? '' : parseInt(value, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const getRequestData = () => ({
    ...formData,
    serial_start: parseInt(formData.serial_start, 10),
    module_count: parseInt(formData.module_count, 10),
    cell_efficiency: parseFloat(formData.cell_efficiency),
    jb_cable_length: parseInt(formData.jb_cable_length, 10),
  });

  const handleGenerateForm = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await ipqcService.generateForm(getRequestData());
      if (response.success) {
        setMessage({ type: 'success', text: `✅ IPQC form generated! ${response.data.total_stages} stages, ${response.data.total_checkpoints} checkpoints.` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Failed: ${error.message}` });
    } finally { setLoading(false); }
  };

  const handleGeneratePDF = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await ipqcService.generatePDF(getRequestData());
      setMessage({ type: 'success', text: '✅ PDF downloaded successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ PDF failed: ${error.message}` });
    } finally { setLoading(false); }
  };

  const handleGenerateExcel = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await ipqcService.generateExcel(getRequestData());
      setMessage({ type: 'success', text: '✅ Excel downloaded successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Excel failed: ${error.message}` });
    } finally { setLoading(false); }
  };

  const handleGenerateBoth = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await ipqcService.generateBoth(getRequestData());
      setMessage({ type: 'success', text: '✅ PDF + Excel downloaded as ZIP!' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Failed: ${error.message}` });
    } finally { setLoading(false); }
  };

  // ══════════════════════════════════════════
  // Peel Test Handlers
  // ══════════════════════════════════════════
  const handlePeelChange = (e) => {
    const { name, value } = e.target;
    setPeelData(prev => ({ ...prev, [name]: value }));
  };

  const generatePeelExcel = async () => {
    if (!peelData.date || !peelData.stringer_count) {
      setPeelMessage({ text: 'Please fill all required fields!', type: 'error' });
      setTimeout(() => setPeelMessage({ text: '', type: '' }), 3000);
      return;
    }
    setPeelLoading(true);
    setPeelMessage({ text: '⏳ Generating Excel reports...', type: 'info' });
    try {
      const response = await fetch(getApiUrl('peel-test/generate-excel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(peelData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate reports');
      }
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `PeelTest_Reports_${peelData.date}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) filename = match[1].replace(/['"]/g, '');
      }
      if (peelData.stringer_count > 1) filename = filename.replace('.xlsx', '.zip');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setPeelMessage({ text: `✅ Excel reports generated! (Line ${peelData.stringer_count}, ${peelData.shift} Shift)`, type: 'success' });
      setTimeout(() => setPeelMessage({ text: '', type: '' }), 5000);
    } catch (error) {
      setPeelMessage({ text: `❌ Error: ${error.message}`, type: 'error' });
      setTimeout(() => setPeelMessage({ text: '', type: '' }), 5000);
    } finally { setPeelLoading(false); }
  };

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════
  return (
    <div className="ipqc-combined-container">
      {/* Header */}
      <div className="ipqc-combined-header">
        <div className="ipqc-header-brand">
          <div className="ipqc-header-logo">
            <span className="ipqc-logo-text">G</span>
          </div>
          <div>
            <h1 className="ipqc-header-title">GAUTAM SOLAR</h1>
            <p className="ipqc-header-sub">Quality Control & Testing System</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ipqc-tabs">
        <button
          className={`ipqc-tab ${activeTab === 'ipqc' ? 'active' : ''}`}
          onClick={() => setActiveTab('ipqc')}
        >
          <span className="ipqc-tab-icon">📝</span>
          <span className="ipqc-tab-label">IPQC Form</span>
          <span className="ipqc-tab-desc">In-Process Quality Check</span>
        </button>
        <button
          className={`ipqc-tab ${activeTab === 'peel' ? 'active' : ''}`}
          onClick={() => setActiveTab('peel')}
        >
          <span className="ipqc-tab-icon">🧪</span>
          <span className="ipqc-tab-label">Peel Test Report</span>
          <span className="ipqc-tab-desc">Adhesion Test Generator</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════
          TAB 1: IPQC FORM
          ═══════════════════════════════════════ */}
      {activeTab === 'ipqc' && (
        <div className="ipqc-tab-content">
          <div className="form-card">
            <h3>📋 Generate IPQC Report</h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="date">📅 Date <span className="required">*</span></label>
                <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="shift">🕐 Shift <span className="required">*</span></label>
                <select id="shift" name="shift" value={formData.shift} onChange={handleInputChange} required>
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="customer_id">🏢 Customer / Document ID <span className="required">*</span></label>
                <select id="customer_id" name="customer_id" value={formData.customer_id} onChange={handleInputChange} required>
                  {customers.map((customer) => (
                    <option key={customer} value={customer}>{customer}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="po_number">📄 PO Number (Optional)</label>
                <input type="text" id="po_number" name="po_number" value={formData.po_number} onChange={handleInputChange} placeholder="Enter Purchase Order Number" />
              </div>

              <div className="form-group">
                <label htmlFor="cell_manufacturer">🔬 Cell Manufacturer</label>
                <select id="cell_manufacturer" name="cell_manufacturer" value={formData.cell_manufacturer} onChange={handleInputChange}>
                  <option value="Solar Space">Solar Space</option>
                  <option value="Longi Solar">Longi Solar</option>
                  <option value="Trina Solar">Trina Solar</option>
                  <option value="JA Solar">JA Solar</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="cell_efficiency">⚡ Cell Efficiency (%)</label>
                <input type="number" id="cell_efficiency" name="cell_efficiency" value={formData.cell_efficiency} onChange={handleInputChange} step="0.1" min="20" max="30" />
              </div>

              <div className="form-group">
                <label htmlFor="jb_cable_length">📏 JB Cable Length (mm)</label>
                <input type="number" id="jb_cable_length" name="jb_cable_length" value={formData.jb_cable_length} onChange={handleInputChange} min="800" max="1500" />
              </div>

              <div className="form-group">
                <label htmlFor="golden_module_number">🏅 Golden Module Number</label>
                <input type="text" id="golden_module_number" name="golden_module_number" value={formData.golden_module_number} onChange={handleInputChange} placeholder="GM-2024-001" />
              </div>

              <div className="form-group full-width">
                <label htmlFor="serial_prefix">🏷️ Serial Number Prefix (14 Digits) <span className="required">*</span></label>
                <input type="text" id="serial_prefix" name="serial_prefix" value={formData.serial_prefix} onChange={handleInputChange} placeholder="GS04875KG302250" maxLength="14" required />
                <small className="field-hint">Fixed 14-digit prefix for serial numbers (e.g., GS04875KG302250)</small>
              </div>

              <div className="form-group">
                <label htmlFor="serial_start">🔢 Starting Counter (Last 5 Digits)</label>
                <input type="number" id="serial_start" name="serial_start" value={formData.serial_start} onChange={handleInputChange} min="1" max="99999" />
                <small className="field-hint">Counter: 00001 to 99999</small>
              </div>

              <div className="form-group">
                <label htmlFor="module_count">📦 Module Count</label>
                <input type="number" id="module_count" name="module_count" value={formData.module_count} onChange={handleInputChange} min="1" />
              </div>
            </div>

            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            <div className="button-group">
              <button className="btn btn-secondary" onClick={handleGenerateForm} disabled={loading || !formData.serial_prefix}>
                {loading ? '⏳ Generating...' : '📋 Preview Form'}
              </button>
              <button className="btn btn-primary" onClick={handleGeneratePDF} disabled={loading || !formData.serial_prefix}>
                {loading ? '⏳ Generating...' : '📄 Download PDF'}
              </button>
              <button className="btn btn-success" onClick={handleGenerateExcel} disabled={loading || !formData.serial_prefix}>
                {loading ? '⏳ Generating...' : '📊 Download Excel'}
              </button>
              <button className="btn btn-info" onClick={handleGenerateBoth} disabled={loading || !formData.serial_prefix}>
                {loading ? '⏳ Generating...' : '📦 Download Both (ZIP)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          TAB 2: PEEL TEST REPORT
          ═══════════════════════════════════════ */}
      {activeTab === 'peel' && (
        <div className="ipqc-tab-content">
          <div className="form-card">
            <h3>🧪 Generate Peel Test Report</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>📅 Report Date <span className="required">*</span></label>
                <input type="date" name="date" value={peelData.date} onChange={handlePeelChange} required />
              </div>

              <div className="form-group">
                <label>🔗 Number of Lines <span className="required">*</span></label>
                <select name="stringer_count" value={peelData.stringer_count} onChange={handlePeelChange} required>
                  <option value="1">Line 1</option>
                  <option value="2">Line 2</option>
                  <option value="3">Line 3</option>
                </select>
              </div>

              <div className="form-group">
                <label>🕐 Shift <span className="required">*</span></label>
                <select name="shift" value={peelData.shift} onChange={handlePeelChange} required>
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
            </div>

            {/* Summary Info */}
            <div className="peel-summary">
              <div className="peel-summary-item">
                <span className="peel-summary-label">Line</span>
                <span className="peel-summary-value">Line {peelData.stringer_count}</span>
              </div>
              <div className="peel-summary-item">
                <span className="peel-summary-label">Shift</span>
                <span className="peel-summary-value">{peelData.shift} Shift</span>
              </div>
              <div className="peel-summary-item">
                <span className="peel-summary-label">Sheets</span>
                <span className="peel-summary-value">12 sheets</span>
              </div>
              <div className="peel-summary-item">
                <span className="peel-summary-label">Date</span>
                <span className="peel-summary-value">{new Date(peelData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            {peelMessage.text && <div className={`message ${peelMessage.type}`}>{peelMessage.text}</div>}

            <div className="button-group">
              <button className="btn btn-success btn-large" onClick={generatePeelExcel} disabled={peelLoading}>
                {peelLoading ? '⏳ Generating...' : '📊 Generate Excel Reports'}
              </button>
            </div>

            <div className="peel-note">
              <p>📌 <strong>Note:</strong> Each file contains 12 sheets (3 stringers × 2 sides × 2 positions). For multiple lines, a ZIP file will be downloaded.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPQCForm;
