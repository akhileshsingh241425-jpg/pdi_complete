import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { companyService } from '../services/apiService';
import '../styles/DailyReport.css';

function DailyReport() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  
  const [companyForm, setCompanyForm] = useState({
    id: null,
    companyName: '',
    moduleWattage: '625',
    moduleType: 'Topcon',
    cellsPerModule: '132',
    cellsReceivedQty: '',
    cellsReceivedMW: '',
    productionRecords: [],
    rejectedModules: [],
    createdDate: ''
  });

  const [reportData, setReportData] = useState({
    remarks: ''
  });

  const [newRejection, setNewRejection] = useState({
    serialNumber: '',
    rejectionDate: new Date().toISOString().split('T')[0],
    reason: 'Cell Color Mismatch (Shade Difference)',
    stage: 'Visual Inspection'
  });

  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showRejectionList, setShowRejectionList] = useState(false);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [newDayDate, setNewDayDate] = useState('');
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfDateRange, setPdfDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportOptions, setReportOptions] = useState({
    includeCellInventory: true,
    includeRejections: true,
    includeKPIMetrics: true,
    includeProductionDetails: true,
    includeDayWiseSummary: true
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load companies:', error);
      alert('Failed to load companies from database');
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedCompany = async () => {
    if (selectedCompany && selectedCompany.id) {
      try {
        const updated = await companyService.getCompany(selectedCompany.id);
        setSelectedCompany(updated);
      } catch (error) {
        console.error('Failed to refresh company:', error);
      }
    }
  };

  const handleNewCompany = () => {
    setCompanyForm({
      id: null,
      companyName: '',
      moduleWattage: '625',
      moduleType: 'Topcon',
      cellsPerModule: '132',
      cellsReceivedQty: '',
      cellsReceivedMW: '',
      productionRecords: [],
      rejectedModules: [],
      createdDate: new Date().toISOString().split('T')[0]
    });
    setViewMode('form');
  };

  const handleSaveCompany = async () => {
    if (!companyForm.companyName) {
      alert('Please enter company name!');
      return;
    }

    try {
      setLoading(true);
      if (companyForm.id) {
        await companyService.updateCompany(companyForm.id, companyForm);
        alert('Company updated successfully!');
      } else {
        await companyService.createCompany(companyForm);
        alert('Company saved successfully!');
      }
      await loadCompanies();
      setViewMode('list');
    } catch (error) {
      console.error('Failed to save company:', error);
      alert('Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = async (company) => {
    try {
      setLoading(true);
      const fullCompany = await companyService.getCompany(company.id);
      setSelectedCompany(fullCompany);
      setViewMode('production');
    } catch (error) {
      console.error('Failed to load company details:', error);
      alert('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company? All production data will be lost!')) {
      return;
    }

    try {
      setLoading(true);
      await companyService.deleteCompany(companyId);
      alert('Company deleted successfully!');
      await loadCompanies();
    } catch (error) {
      console.error('Failed to delete company:', error);
      alert('Failed to delete company');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalProduction = () => {
    if (!selectedCompany || !selectedCompany.productionRecords) return 0;
    return selectedCompany.productionRecords.reduce((sum, record) => {
      return sum + (record.dayProduction || 0) + (record.nightProduction || 0);
    }, 0);
  };

  const calculateTotalMW = () => {
    const totalProduction = calculateTotalProduction();
    const wattage = selectedCompany ? parseFloat(selectedCompany.moduleWattage) : 0;
    return ((totalProduction * wattage) / 1000000).toFixed(2);
  };

  const calculateCellStock = () => {
    if (!selectedCompany) return 0;
    
    const cellsReceived = parseFloat(selectedCompany.cellsReceivedQty) || 0;
    const cellsPerModule = parseFloat(selectedCompany.cellsPerModule) || 132;
    
    let totalCellsUsed = 0;
    let totalCellsRejected = 0;
    
    if (selectedCompany.productionRecords) {
      selectedCompany.productionRecords.forEach(record => {
        const dailyProduction = (record.dayProduction || 0) + (record.nightProduction || 0);
        const cellsUsedToday = dailyProduction * cellsPerModule;
        const cellRejectionPercent = record.cellRejectionPercent || 0;
        const cellsRejectedToday = (cellsUsedToday * cellRejectionPercent) / 100;
        
        totalCellsUsed += cellsUsedToday;
        totalCellsRejected += cellsRejectedToday;
      });
    }
    
    const cellStock = cellsReceived - totalCellsUsed - totalCellsRejected;
    return Math.round(cellStock);
  };

  const calculateTotalRejectedModules = () => {
    if (!selectedCompany || !selectedCompany.rejectedModules) return 0;
    return selectedCompany.rejectedModules.length;
  };

  const getDateRange = () => {
    if (!selectedCompany || !selectedCompany.productionRecords || selectedCompany.productionRecords.length === 0) {
      return [];
    }
    
    return selectedCompany.productionRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const handleProductionChange = async (recordId, field, value) => {
    if (!selectedCompany) return;
    
    try {
      const currentRecord = selectedCompany.productionRecords.find(r => r.id === recordId);
      if (!currentRecord) return;
      
      const recordData = {
        ...currentRecord,
        [field]: field.includes('Percent') || field.includes('Production') ? parseFloat(value) || 0 : value
      };
      
      await companyService.updateProductionRecord(selectedCompany.id, recordId, recordData);
      await refreshSelectedCompany();
    } catch (error) {
      console.error('Failed to update production:', error);
      alert('Failed to update production data');
    }
  };

  const handleAddNewDay = () => {
    setNewDayDate(new Date().toISOString().split('T')[0]);
    setShowAddDayModal(true);
  };

  const handleSaveNewDay = async () => {
    if (!newDayDate) {
      alert('Please select a date!');
      return;
    }

    const existingRecord = selectedCompany.productionRecords.find(r => r.date === newDayDate);
    if (existingRecord) {
      alert('Production record already exists for this date!');
      return;
    }

    try {
      setLoading(true);
      await companyService.addProductionRecord(selectedCompany.id, {
        date: newDayDate,
        dayProduction: 0,
        nightProduction: 0,
        pdi: '',
        cellRejectionPercent: 0.0,
        moduleRejectionPercent: 0.0
      });
      
      await refreshSelectedCompany();
      setShowAddDayModal(false);
      setNewDayDate('');
    } catch (error) {
      console.error('Failed to add new day:', error);
      alert('Failed to add new production day');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProductionRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this production record?')) {
      return;
    }

    try {
      setLoading(true);
      await companyService.deleteProductionRecord(selectedCompany.id, recordId);
      await refreshSelectedCompany();
      alert('Production record deleted successfully!');
    } catch (error) {
      console.error('Failed to delete production record:', error);
      alert('Failed to delete production record');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Random defect selector - 70% minor, 30% major (realistic distribution)
        const getRandomDefect = () => {
          const majorDefects = [
            'EL Major Micro-crack / Cell Crack',
            'Broken Cell / Dead Cell (Dark Cell)',
            'Hot-spot Affected Cell',
            'Glass Crack / Corner Crack',
            'Low Power / Pmax Less Than Tolerance',
            'Soldering Open / Ribbon Cut',
            'J-Box Diode Failure / Wrong Diode',
            'Delamination (Air Gap Inside Laminate)',
            'Insulation Resistance Fail / Hi-pot Fail',
            'Frame Major Dent / Frame Separation'
          ];
          
          const minorDefects = [
            'Cell Color Mismatch (Shade Difference)',
            'Minor EVA Bubble (Non-critical Position)',
            'Backsheet Wrinkle',
            'Ribbon Alignment Not Straight',
            'Glass Small Scratch (Acceptable Limit)',
            'EVA Overflow / Glue Mark',
            'Small Dust / Particle Inside Laminate',
            'Label Alignment Wrong / Print Misalignment',
            'Frame Minor Cosmetic Scratch',
            'Barcode Sticker Tilt / Small Ink Mark'
          ];

          const stages = [
            'Visual Inspection',
            'Electrical Test',
            'EL Test',
            'Flash Test',
            'Final QC',
            'Packaging',
            'Lamination',
            'Stringing'
          ];

          // 70% chance of minor defect (more realistic for demo)
          const isMajor = Math.random() < 0.3;
          const defectList = isMajor ? majorDefects : minorDefects;
          const randomReason = defectList[Math.floor(Math.random() * defectList.length)];
          
          // Select appropriate stage based on defect type
          let randomStage;
          if (randomReason.includes('EL') || randomReason.includes('Hot-spot')) {
            randomStage = 'EL Test';
          } else if (randomReason.includes('Power') || randomReason.includes('Electrical')) {
            randomStage = 'Flash Test';
          } else if (randomReason.includes('Lamination') || randomReason.includes('Delamination')) {
            randomStage = 'Lamination';
          } else if (randomReason.includes('Soldering') || randomReason.includes('Ribbon')) {
            randomStage = 'Stringing';
          } else if (randomReason.includes('J-Box') || randomReason.includes('Diode')) {
            randomStage = 'Electrical Test';
          } else {
            randomStage = stages[Math.floor(Math.random() * stages.length)];
          }

          return { reason: randomReason, stage: randomStage };
        };

        // Extract serial numbers from Excel (supports multiple column names)
        let serialNumbers = jsonData.map(row => 
          row['Serial Number'] || 
          row['serial_number'] || 
          row['Barcode'] || 
          row['barcode'] || 
          row['Serial No'] ||
          row['Module Serial'] ||
          row['SN'] ||
          Object.values(row)[0] // If no header, take first column
        ).filter(Boolean);

        // Sort serial numbers A-Z
        serialNumbers.sort((a, b) => String(a).localeCompare(String(b)));

        // Get production records sorted by date to distribute rejections
        const productionDates = selectedCompany.productionRecords
          .filter(r => r.moduleRejectionPercent > 0)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (productionDates.length === 0) {
          alert('No production records with rejection percentage found! Please add production data first.');
          return;
        }

        // Calculate how many rejections per date based on module rejection %
        const rejections = [];
        let currentIndex = 0;

        for (const record of productionDates) {
          const dailyProduction = (record.dayProduction || 0) + (record.nightProduction || 0);
          const rejectionPercent = record.moduleRejectionPercent || 0;
          const rejectedCount = Math.round((dailyProduction * rejectionPercent) / 100);

          // Assign serial numbers to this date with random defects
          for (let i = 0; i < rejectedCount && currentIndex < serialNumbers.length; i++) {
            const { reason, stage } = getRandomDefect();
            rejections.push({
              serialNumber: String(serialNumbers[currentIndex]),
              rejectionDate: record.date,
              reason: reason,
              stage: stage
            });
            currentIndex++;
          }

          // Break if all serial numbers assigned
          if (currentIndex >= serialNumbers.length) break;
        }

        // Warning if there are extra serial numbers that won't be used
        const unusedCount = serialNumbers.length - currentIndex;
        
        if (rejections.length === 0) {
          alert('No valid serial numbers found in Excel!');
          return;
        }

        // Calculate total expected rejections based on production %
        const totalExpectedRejections = productionDates.reduce((sum, record) => {
          const dailyProduction = (record.dayProduction || 0) + (record.nightProduction || 0);
          const rejectionPercent = record.moduleRejectionPercent || 0;
          return sum + Math.round((dailyProduction * rejectionPercent) / 100);
        }, 0);

        setLoading(true);
        await companyService.bulkAddRejections(selectedCompany.id, rejections);
        await refreshSelectedCompany();
        
        let message = `✓ ${rejections.length} rejections uploaded successfully!\nDistributed across ${productionDates.length} production days based on rejection percentages.`;
        
        if (unusedCount > 0) {
          message += `\n\n⚠️ Note: ${unusedCount} serial numbers were not used (Excel had ${serialNumbers.length} serials, but only ${totalExpectedRejections} rejections expected based on production %).`;
        }
        
        alert(message);
      } catch (error) {
        console.error('Excel upload failed:', error);
        alert('Failed to upload Excel file: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleAddRejection = async () => {
    if (!newRejection.serialNumber) {
      alert('Please enter serial number!');
      return;
    }

    try {
      setLoading(true);
      await companyService.addRejection(selectedCompany.id, newRejection);
      await refreshSelectedCompany();
      
      setNewRejection({
        serialNumber: '',
        rejectionDate: new Date().toISOString().split('T')[0],
        reason: 'Cell Crack',
        stage: 'Visual Inspection'
      });
      
      setShowRejectionModal(false);
      alert('Rejection added successfully!');
    } catch (error) {
      console.error('Failed to add rejection:', error);
      alert('Failed to add rejection');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRejection = async (rejectionId) => {
    if (!window.confirm('Are you sure you want to delete this rejection?')) {
      return;
    }

    try {
      setLoading(true);
      await companyService.deleteRejection(selectedCompany.id, rejectionId);
      await refreshSelectedCompany();
      alert('Rejection deleted successfully!');
    } catch (error) {
      console.error('Failed to delete rejection:', error);
      alert('Failed to delete rejection');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllRejections = async () => {
    if (!window.confirm('Are you sure you want to delete ALL rejections? This cannot be undone!')) {
      return;
    }

    try {
      setLoading(true);
      await companyService.deleteAllRejections(selectedCompany.id);
      await refreshSelectedCompany();
      alert('All rejections deleted successfully!');
    } catch (error) {
      console.error('Failed to delete all rejections:', error);
      alert('Failed to delete all rejections');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPDFModal = () => {
    const records = getDateRange();
    if (records.length === 0) {
      alert('No production data available!');
      return;
    }

    setPdfDateRange({
      startDate: records[0].date,
      endDate: records[records.length - 1].date
    });
    setShowPDFModal(true);
  };

  const handleGeneratePDF = async () => {
    if (!pdfDateRange.startDate || !pdfDateRange.endDate) {
      alert('Please select date range!');
      return;
    }

    try {
      setLoading(true);
      
      const filteredRecords = selectedCompany.productionRecords.filter(record => {
        const recordDate = new Date(record.date);
        const start = new Date(pdfDateRange.startDate);
        const end = new Date(pdfDateRange.endDate);
        return recordDate >= start && recordDate <= end;
      });

      const filteredRejections = selectedCompany.rejectedModules.filter(rej => {
        const rejDate = new Date(rej.rejectionDate);
        const start = new Date(pdfDateRange.startDate);
        const end = new Date(pdfDateRange.endDate);
        return rejDate >= start && rejDate <= end;
      });

      const sortedRejections = filteredRejections.sort((a, b) => {
        const dateCompare = new Date(a.rejectionDate) - new Date(b.rejectionDate);
        if (dateCompare !== 0) return dateCompare;
        return a.serialNumber.localeCompare(b.serialNumber);
      });

      const totalProduction = filteredRecords.reduce((sum, r) => 
        sum + (r.dayProduction || 0) + (r.nightProduction || 0), 0
      );
      
      const totalMW = ((totalProduction * parseFloat(selectedCompany.moduleWattage)) / 1000000).toFixed(2);

      const payload = {
        company_name: selectedCompany.companyName,
        module_wattage: selectedCompany.moduleWattage,
        module_type: selectedCompany.moduleType,
        cells_per_module: selectedCompany.cellsPerModule,
        cells_received_qty: selectedCompany.cellsReceivedQty || 0,
        cells_received_mw: selectedCompany.cellsReceivedMW || 0,
        start_date: pdfDateRange.startDate,
        end_date: pdfDateRange.endDate,
        production_records: filteredRecords.map(r => ({
          date: r.date,
          day_production: r.dayProduction || 0,
          night_production: r.nightProduction || 0,
          cell_rejection_percent: r.cellRejectionPercent || 0,
          module_rejection_percent: r.moduleRejectionPercent || 0,
          pdi: r.pdi || ''
        })),
        cell_stock: calculateCellStock(),
        total_mw: totalMW,
        total_rejected_modules: sortedRejections.length,
        rejected_modules: sortedRejections.map(rej => ({
          serial_number: rej.serialNumber,
          rejection_date: rej.rejectionDate,
          reason: rej.reason,
          stage: rej.stage
        })),
        remarks: reportData.remarks || '',
        report_options: reportOptions
      };

      const response = await axios.post('http://backend.gspl.cloud/api/generate-production-report', payload, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedCompany.companyName}_Production_Report_${pdfDateRange.startDate}_to_${pdfDateRange.endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setShowPDFModal(false);
      alert('PDF generated successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Error generating PDF! Check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExcel = async () => {
    if (!pdfDateRange.startDate || !pdfDateRange.endDate) {
      alert('Please select date range!');
      return;
    }

    try {
      setLoading(true);
      
      const filteredRecords = selectedCompany.productionRecords.filter(record => {
        const recordDate = new Date(record.date);
        const start = new Date(pdfDateRange.startDate);
        const end = new Date(pdfDateRange.endDate);
        return recordDate >= start && recordDate <= end;
      });

      const filteredRejections = selectedCompany.rejectedModules.filter(rej => {
        const rejDate = new Date(rej.rejectionDate);
        const start = new Date(pdfDateRange.startDate);
        const end = new Date(pdfDateRange.endDate);
        return rejDate >= start && rejDate <= end;
      });

      const sortedRejections = filteredRejections.sort((a, b) => {
        const dateCompare = new Date(a.rejectionDate) - new Date(b.rejectionDate);
        if (dateCompare !== 0) return dateCompare;
        return a.serialNumber.localeCompare(b.serialNumber);
      });

      const totalProduction = filteredRecords.reduce((sum, r) => 
        sum + (r.dayProduction || 0) + (r.nightProduction || 0), 0
      );
      
      const totalMW = ((totalProduction * parseFloat(selectedCompany.moduleWattage)) / 1000000).toFixed(2);

      const payload = {
        company: {
          name: selectedCompany.companyName,
          address: selectedCompany.address || 'N/A',
          contact: selectedCompany.contact || 'N/A',
          module_wattage: selectedCompany.moduleWattage,
          module_type: selectedCompany.moduleType,
          cells_per_module: selectedCompany.cellsPerModule
        },
        production_data: filteredRecords.map(r => ({
          date: r.date,
          day_of_week: new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' }),
          day_production: r.dayProduction || 0,
          night_production: r.nightProduction || 0,
          cell_rejection_percent: (r.cellRejectionPercent || 0) / 100,
          module_rejection_percent: (r.moduleRejectionPercent || 0) / 100,
          cells_rejected: Math.round(((r.dayProduction || 0) + (r.nightProduction || 0)) * 132 * (r.cellRejectionPercent || 0) / 100),
          modules_rejected: Math.round(((r.dayProduction || 0) + (r.nightProduction || 0)) * (r.moduleRejectionPercent || 0) / 100)
        })),
        rejections: sortedRejections.map((rej, index) => ({
          no: index + 1,
          date: rej.rejectionDate,
          serial: rej.serialNumber,
          reason: rej.reason,
          stage: rej.stage,
          defect_type: rej.defectType || 'Minor',
          remarks: rej.remarks || ''
        })),
        start_date: pdfDateRange.startDate,
        end_date: pdfDateRange.endDate,
        cells_received_qty: selectedCompany.cellsReceivedQty || 0,
        cells_received_mw: selectedCompany.cellsReceivedMW || 0,
        report_options: reportOptions
      };

      const response = await axios.post('http://backend.gspl.cloud/api/generate-production-excel', payload, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedCompany.companyName}_Production_Report_${pdfDateRange.startDate}_to_${pdfDateRange.endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setShowPDFModal(false);
      alert('Excel generated successfully!');
    } catch (error) {
      console.error('Excel generation failed:', error);
      alert('Error generating Excel! Check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyList = () => (
    <div className="company-list-container">
      <div className="list-header">
        <h2>Companies List</h2>
        <button className="btn-add-company" onClick={handleNewCompany}>
          + Add New Company
        </button>
      </div>
      
      {loading && <div className="loading">Loading...</div>}
      
      {!loading && companies.length === 0 && (
        <div className="empty-state">
          <p>No companies added yet. Click "Add New Company" to get started!</p>
        </div>
      )}
      
      <div className="companies-grid">
        {companies.map(company => (
          <div key={company.id} className="company-card">
            <div className="card-header">
              <h3>{company.companyName}</h3>
              <span className="card-date">{company.createdDate}</span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">📦 Module</span>
                <span className="info-value">{company.moduleWattage}W {company.moduleType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">🔢 Cells/Module</span>
                <span className="info-value">{company.cellsPerModule}</span>
              </div>
              {company.cellsReceivedQty && (
                <div className="info-row">
                  <span className="info-label">📥 Cells Received</span>
                  <span className="info-value">{company.cellsReceivedQty} <span className="info-unit">({company.cellsReceivedMW} MW)</span></span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">📊 Production Records</span>
                <span className="info-value highlight-blue">{company.productionRecords?.length || 0}</span>
              </div>
              <div className="info-row">
                <span className="info-label">🚫 Rejections</span>
                <span className="info-value highlight-red">{company.rejectedModules?.length || 0}</span>
              </div>
            </div>
            <div className="card-actions">
              <button className="btn-open" onClick={() => handleSelectCompany(company)}>
                📂 Open
              </button>
              <button className="btn-delete-card" onClick={() => handleDeleteCompany(company.id)}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompanyForm = () => (
    <div className="company-form-container">
      <div className="form-header">
        <h2>{companyForm.id ? 'Edit Company' : 'New Company'}</h2>
        <button className="btn-back" onClick={() => setViewMode('list')}>
          ← Back to List
        </button>
      </div>
      
      <div className="form-content">
        <div className="form-group">
          <label>Company Name *</label>
          <input
            type="text"
            value={companyForm.companyName}
            onChange={(e) => setCompanyForm({...companyForm, companyName: e.target.value})}
            placeholder="Enter company name"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Module Wattage *</label>
            <input
              type="number"
              value={companyForm.moduleWattage}
              onChange={(e) => setCompanyForm({...companyForm, moduleWattage: e.target.value})}
              placeholder="625"
            />
          </div>
          
          <div className="form-group">
            <label>Module Type *</label>
            <select
              value={companyForm.moduleType}
              onChange={(e) => setCompanyForm({...companyForm, moduleType: e.target.value})}
            >
              <option value="Topcon">Topcon</option>
              <option value="Perc">Perc</option>
              <option value="HJT">HJT</option>
              <option value="Mono">Mono</option>
              <option value="Poly">Poly</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Cells Per Module *</label>
          <input
            type="number"
            value={companyForm.cellsPerModule}
            onChange={(e) => setCompanyForm({...companyForm, cellsPerModule: e.target.value})}
            placeholder="132"
          />
        </div>
        
        <div className="form-section">
          <h3>Cells Received (Optional)</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={companyForm.cellsReceivedQty}
                onChange={(e) => setCompanyForm({...companyForm, cellsReceivedQty: e.target.value})}
                placeholder="Enter number of cells"
              />
            </div>
            
            <div className="form-group">
              <label>MW</label>
              <input
                type="number"
                step="0.01"
                value={companyForm.cellsReceivedMW}
                onChange={(e) => setCompanyForm({...companyForm, cellsReceivedMW: e.target.value})}
                placeholder="Enter MW"
              />
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button className="btn-save" onClick={handleSaveCompany} disabled={loading}>
            {loading ? 'Saving...' : 'Save Company'}
          </button>
          <button className="btn-cancel" onClick={() => setViewMode('list')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderProductionView = () => {
    if (!selectedCompany) return null;

    const dateRecords = getDateRange();

    return (
      <div className="production-view-container">
        <div className="production-header">
          <h2>{selectedCompany.companyName} - Production Management</h2>
          <button className="btn-back" onClick={() => { setSelectedCompany(null); setViewMode('list'); }}>
            ← Back to List
          </button>
        </div>

        {loading && <div className="loading">Loading...</div>}

        <div className="production-section">
          <h3>Daily Production Records</h3>
          <button className="btn-add-day" onClick={handleAddNewDay}>
            + Add New Day
          </button>

          {dateRecords.length === 0 ? (
            <p className="no-data">No production data yet. Click "Add New Day" to start tracking!</p>
          ) : (
            <div className="production-table-wrapper">
              <table className="production-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day Shift</th>
                    <th>Night Shift</th>
                    <th>Total</th>
                    <th>Cell Rej %</th>
                    <th>Module Rej %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dateRecords.map(record => {
                    const total = (record.dayProduction || 0) + (record.nightProduction || 0);
                    return (
                      <tr key={record.id}>
                        <td>{record.date}</td>
                        <td>
                          <input
                            type="number"
                            value={record.dayProduction || 0}
                            onChange={(e) => handleProductionChange(record.id, 'dayProduction', e.target.value)}
                            className="table-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={record.nightProduction || 0}
                            onChange={(e) => handleProductionChange(record.id, 'nightProduction', e.target.value)}
                            className="table-input"
                          />
                        </td>
                        <td className="total-cell">{total}</td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            value={record.cellRejectionPercent || 0}
                            onChange={(e) => handleProductionChange(record.id, 'cellRejectionPercent', e.target.value)}
                            className="table-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            value={record.moduleRejectionPercent || 0}
                            onChange={(e) => handleProductionChange(record.id, 'moduleRejectionPercent', e.target.value)}
                            className="table-input"
                          />
                        </td>
                        <td>
                          <button 
                            className="btn-delete-row" 
                            onClick={() => handleDeleteProductionRecord(record.id)}
                            title="Delete this record"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rejection-section">
          <h3>Rejection Management</h3>
          <div className="rejection-actions">
            <button className="btn-add-rejection" onClick={() => setShowRejectionModal(true)}>
              + Add Rejection
            </button>
            <label className="btn-upload-excel">
              📤 Upload Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button 
              className="btn-view-rejections" 
              onClick={() => setShowRejectionList(!showRejectionList)}
            >
              {showRejectionList ? '▼ Hide' : '▶ View All'} ({selectedCompany.rejectedModules?.length || 0})
            </button>
            {selectedCompany.rejectedModules && selectedCompany.rejectedModules.length > 0 && (
              <button className="btn-delete-all" onClick={handleDeleteAllRejections}>
                🗑️ Delete All Rejections
              </button>
            )}
          </div>

          {showRejectionList && selectedCompany.rejectedModules && selectedCompany.rejectedModules.length > 0 && (
            <div className="rejection-list-table">
              <table>
                <thead>
                  <tr>
                    <th>Serial Number</th>
                    <th>Date</th>
                    <th>Reason</th>
                    <th>Stage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCompany.rejectedModules.map(rej => (
                    <tr key={rej.id}>
                      <td>{rej.serialNumber}</td>
                      <td>{rej.rejectionDate}</td>
                      <td>{rej.reason}</td>
                      <td>{rej.stage}</td>
                      <td>
                        <button 
                          className="btn-delete-row" 
                          onClick={() => handleDeleteRejection(rej.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <h4>Total Production</h4>
            <p className="summary-value">{calculateTotalProduction()}</p>
            <span className="summary-label">modules</span>
          </div>
          <div className="summary-card">
            <h4>Total MW</h4>
            <p className="summary-value">{calculateTotalMW()}</p>
            <span className="summary-label">megawatts</span>
          </div>
          <div className="summary-card">
            <h4>Cell Stock</h4>
            <p className="summary-value">{calculateCellStock()}</p>
            <span className="summary-label">cells remaining</span>
          </div>
          <div className="summary-card">
            <h4>Rejected Modules</h4>
            <p className="summary-value">{calculateTotalRejectedModules()}</p>
            <span className="summary-label">total rejections</span>
          </div>
        </div>

        <div className="remarks-section">
          <h3>Remarks</h3>
          <textarea
            value={reportData.remarks}
            onChange={(e) => setReportData({...reportData, remarks: e.target.value})}
            placeholder="Enter any additional remarks for the report..."
            rows="4"
          />
        </div>

        <div className="pdf-actions">
          <button className="btn-generate-pdf" onClick={handleOpenPDFModal} disabled={loading}>
            {loading ? 'Generating...' : '📄 Generate PDF Report'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="daily-report">
      {viewMode === 'list' && renderCompanyList()}
      {viewMode === 'form' && renderCompanyForm()}
      {viewMode === 'production' && renderProductionView()}

      {showRejectionModal && (
        <div className="modal-overlay" onClick={() => setShowRejectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Rejected Module</h3>
            <div className="form-group">
              <label>Serial Number</label>
              <input
                type="text"
                value={newRejection.serialNumber}
                onChange={(e) => setNewRejection({...newRejection, serialNumber: e.target.value})}
                placeholder="Enter serial number"
              />
            </div>
            <div className="form-group">
              <label>Rejection Date</label>
              <input
                type="date"
                value={newRejection.rejectionDate}
                onChange={(e) => setNewRejection({...newRejection, rejectionDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Reason</label>
              <select
                value={newRejection.reason}
                onChange={(e) => setNewRejection({...newRejection, reason: e.target.value})}
              >
                <optgroup label="🔴 MAJOR DEFECTS (Critical)">
                  <option value="EL Major Micro-crack / Cell Crack">EL Major Micro-crack / Cell Crack</option>
                  <option value="Broken Cell / Dead Cell (Dark Cell)">Broken Cell / Dead Cell (Dark Cell)</option>
                  <option value="Hot-spot Affected Cell">Hot-spot Affected Cell</option>
                  <option value="Glass Crack / Corner Crack">Glass Crack / Corner Crack</option>
                  <option value="Low Power / Pmax Less Than Tolerance">Low Power / Pmax Less Than Tolerance</option>
                  <option value="Soldering Open / Ribbon Cut">Soldering Open / Ribbon Cut</option>
                  <option value="J-Box Diode Failure / Wrong Diode">J-Box Diode Failure / Wrong Diode</option>
                  <option value="Delamination (Air Gap Inside Laminate)">Delamination (Air Gap Inside Laminate)</option>
                  <option value="Insulation Resistance Fail / Hi-pot Fail">Insulation Resistance Fail / Hi-pot Fail</option>
                  <option value="Frame Major Dent / Frame Separation">Frame Major Dent / Frame Separation</option>
                </optgroup>
                <optgroup label="🟡 MINOR DEFECTS (Visual/Workmanship)">
                  <option value="Cell Color Mismatch (Shade Difference)">Cell Color Mismatch (Shade Difference)</option>
                  <option value="Minor EVA Bubble (Non-critical Position)">Minor EVA Bubble (Non-critical Position)</option>
                  <option value="Backsheet Wrinkle">Backsheet Wrinkle</option>
                  <option value="Ribbon Alignment Not Straight">Ribbon Alignment Not Straight</option>
                  <option value="Glass Small Scratch (Acceptable Limit)">Glass Small Scratch (Acceptable Limit)</option>
                  <option value="EVA Overflow / Glue Mark">EVA Overflow / Glue Mark</option>
                  <option value="Small Dust / Particle Inside Laminate">Small Dust / Particle Inside Laminate</option>
                  <option value="Label Alignment Wrong / Print Misalignment">Label Alignment Wrong / Print Misalignment</option>
                  <option value="Frame Minor Cosmetic Scratch">Frame Minor Cosmetic Scratch</option>
                  <option value="Barcode Sticker Tilt / Small Ink Mark">Barcode Sticker Tilt / Small Ink Mark</option>
                </optgroup>
                <optgroup label="⚪ OTHER">
                  <option value="Other">Other</option>
                </optgroup>
              </select>
            </div>
            <div className="form-group">
              <label>Stage</label>
              <select
                value={newRejection.stage}
                onChange={(e) => setNewRejection({...newRejection, stage: e.target.value})}
              >
                <option value="Visual Inspection">Visual Inspection</option>
                <option value="Electrical Test">Electrical Test</option>
                <option value="EL Test">EL Test</option>
                <option value="Flash Test">Flash Test</option>
                <option value="Final QC">Final QC</option>
                <option value="Packaging">Packaging</option>
                <option value="Lamination">Lamination</option>
                <option value="Stringing">Stringing</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-save" onClick={handleAddRejection}>Add</button>
              <button className="btn-cancel" onClick={() => setShowRejectionModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddDayModal && (
        <div className="modal-overlay" onClick={() => setShowAddDayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Production Day</h3>
            <div className="form-group">
              <label>Select Date</label>
              <input
                type="date"
                value={newDayDate}
                onChange={(e) => setNewDayDate(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-save" onClick={handleSaveNewDay}>Add Day</button>
              <button className="btn-cancel" onClick={() => setShowAddDayModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPDFModal && (
        <div className="modal-overlay" onClick={() => setShowPDFModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <h3>📊 Configure Production Report</h3>
            
            <div className="form-section">
              <h4 style={{color: '#1976d2', marginBottom: '10px'}}>📅 Date Range</h4>
              <div style={{display: 'flex', gap: '15px'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={pdfDateRange.startDate}
                    onChange={(e) => setPdfDateRange({...pdfDateRange, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>End Date</label>
                  <input
                    type="date"
                    value={pdfDateRange.endDate}
                    onChange={(e) => setPdfDateRange({...pdfDateRange, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="form-section" style={{marginTop: '20px'}}>
              <h4 style={{color: '#1976d2', marginBottom: '10px'}}>✅ Include in Report</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <label style={{display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={reportOptions.includeProductionDetails}
                    onChange={(e) => setReportOptions({...reportOptions, includeProductionDetails: e.target.checked})}
                    style={{marginRight: '10px', width: '18px', height: '18px'}}
                  />
                  <span style={{fontSize: '14px'}}>📈 Production Details</span>
                </label>

                <label style={{display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={reportOptions.includeCellInventory}
                    onChange={(e) => setReportOptions({...reportOptions, includeCellInventory: e.target.checked})}
                    style={{marginRight: '10px', width: '18px', height: '18px'}}
                  />
                  <span style={{fontSize: '14px'}}>📦 Cell Inventory</span>
                </label>

                <label style={{display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={reportOptions.includeKPIMetrics}
                    onChange={(e) => setReportOptions({...reportOptions, includeKPIMetrics: e.target.checked})}
                    style={{marginRight: '10px', width: '18px', height: '18px'}}
                  />
                  <span style={{fontSize: '14px'}}>🎯 KPI Metrics</span>
                </label>

                <label style={{display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={reportOptions.includeDayWiseSummary}
                    onChange={(e) => setReportOptions({...reportOptions, includeDayWiseSummary: e.target.checked})}
                    style={{marginRight: '10px', width: '18px', height: '18px'}}
                  />
                  <span style={{fontSize: '14px'}}>📊 Day-wise Summary</span>
                </label>

                <label style={{display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '5px', cursor: 'pointer', gridColumn: '1 / -1'}}>
                  <input
                    type="checkbox"
                    checked={reportOptions.includeRejections}
                    onChange={(e) => setReportOptions({...reportOptions, includeRejections: e.target.checked})}
                    style={{marginRight: '10px', width: '18px', height: '18px'}}
                  />
                  <span style={{fontSize: '14px', fontWeight: 'bold'}}>❌ Rejection Details</span>
                </label>
              </div>
            </div>

            <div className="modal-actions" style={{marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button className="btn-save" onClick={handleGeneratePDF} style={{flex: 1, padding: '12px'}}>
                📄 Generate PDF
              </button>
              <button className="btn-save" onClick={handleGenerateExcel} style={{backgroundColor: '#4CAF50', flex: 1, padding: '12px'}}>
                📊 Generate Excel
              </button>
              <button className="btn-cancel" onClick={() => setShowPDFModal(false)} style={{padding: '12px'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyReport;
