import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import FTRTemplate from './FTRTemplate';
import { getStoredGraphs } from './GraphManager'; // getRandomGraphForPower removed - using local cache function
import '../styles/BulkFTR.css';

const BulkFTRGenerator = () => {
  const [excelData, setExcelData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [downloadType, setDownloadType] = useState('merged'); // 'merged' or 'split'
  const [downloadFormat, setDownloadFormat] = useState('pdf'); // 'pdf' or 'word'
  const [moduleType, setModuleType] = useState('monofacial'); // 'monofacial' or 'bifacial'
  const [defaultDate, setDefaultDate] = useState(new Date().toISOString().split('T')[0]); // Default date for Excel without date
  const [startTime, setStartTime] = useState('09:00:00'); // Start time for time range
  const [endTime, setEndTime] = useState('11:00:00'); // End time for time range
  const [uploadedFile, setUploadedFile] = useState(null); // Original file for server-side generate
  const [serverGenerating, setServerGenerating] = useState(false);

      const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5003' : '');
      const endpoint = API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/ftr/upload-bulk` : `${API_BASE_URL}/api/ftr/upload-bulk`;
      
      // Convert blobs to base64
      const reports = await Promise.all(pdfDataArray.map(async (item) => {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(item.blob);
        });
        
        return {
          pdfData: base64,
          serialNumber: item.serialNumber,
          moduleType: item.moduleType,
          pmax: item.pmax
        };
      }));
      
      const response = await axios.post(endpoint, {
        reports: reports
      });
      
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Generate all reports
  const generateAllReports = async (downloadMode = 'merged', format = 'pdf', modType = 'monofacial') => {
    if (excelData.length === 0) {
      alert('Please upload Excel file first!');
      return;
    }

    // Get stored graphs from server (async)
    const storedGraphs = await getStoredGraphs();
    if (Object.keys(storedGraphs).length === 0) {
      alert('No graphs found! Please upload graphs in Graph Manager first.');
      return;
    }

    // Filter available keys by module type if specified
    const graphKeys = Object.keys(storedGraphs);
    // Extract unique wattages (handle both "630" and "630_bifacial" formats)
    const availableWattages = [...new Set(graphKeys.map(key => key.split('_')[0]))].sort((a, b) => parseInt(a) - parseInt(b));
    
    // Ask user which wattage to use for bulk generation
    const wattagePrompt = `Available wattages with graphs:\n${availableWattages.join('W, ')}W\n\nEnter the wattage (WP) for these modules:`;
    const selectedWattage = prompt(wattagePrompt, availableWattages[0]);
    
    if (!selectedWattage) {
      return; // User cancelled
    }
    
    // Check if graphs exist for selected wattage (with or without module type)
    const graphKey = `${selectedWattage}_${modType}`;
    const hasGraphs = storedGraphs[graphKey] || storedGraphs[selectedWattage];
    if (!hasGraphs) {
      alert(`No graphs found for ${selectedWattage}W (${modType})! Please upload graphs first.`);
      return;
    }

    // LOCAL helper function to get random graph WITHOUT making API call (uses pre-fetched storedGraphs)
    const getRandomGraphFromCache = (power, moduleType = 'monofacial') => {
      const keyWithType = `${power}_${moduleType}`;
      let powerGraphs = storedGraphs[keyWithType];
      if (!powerGraphs) powerGraphs = storedGraphs[power];
      if (!powerGraphs) {
        const matchingKey = Object.keys(storedGraphs).find(k => k.startsWith(power));
        if (matchingKey) powerGraphs = storedGraphs[matchingKey];
      }
      if (!powerGraphs) return null;
      if (typeof powerGraphs === 'string') return powerGraphs;
      if (Array.isArray(powerGraphs) && powerGraphs.length > 0) {
        return powerGraphs[Math.floor(Math.random() * powerGraphs.length)];
      }
      return null;
    };

    setIsGenerating(true);
    setProgress(0);

    // Anti-throttle: browser minimize karne pe Chrome rAF + setTimeout
    // throttle ho jata hai (1fps), isliye generation rukti hai.
    // Inaudible audio context tab ko "active" rakhta hai.
    let antiThrottle;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        antiThrottle = new AC();
        const src = antiThrottle.createOscillator();
        src.frequency.value = 0; // inaudible
        src.connect(antiThrottle.destination);
        src.start();
      }
    } catch (e) { antiThrottle = null; }
    const generatedTimes = [];
    const parseTimeToSeconds = (timeStr) => {
      const [h, m, s] = timeStr.split(':').map(Number);
      return h * 3600 + m * 60 + (s || 0);
    };
    const secondsToTime = (totalSeconds) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = Math.floor(totalSeconds % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    let currentTimeSeconds = parseTimeToSeconds(startTime);
    const endTimeSeconds = parseTimeToSeconds(endTime);
    
    for (let i = 0; i < excelData.length; i++) {
      generatedTimes.push(secondsToTime(currentTimeSeconds));
      // Random interval: 45 seconds to 180 seconds (3 min)
      const randomInterval = Math.floor(Math.random() * (180 - 45 + 1)) + 45;
      currentTimeSeconds += randomInterval;
      // If exceeds end time, wrap around or stay within range
      if (currentTimeSeconds > endTimeSeconds) {
        currentTimeSeconds = parseTimeToSeconds(startTime) + Math.floor(Math.random() * 60);
      }
    }

    const pdfDataArray = [];
    
    // Process reports in batches of 8 for faster generation (graphs are cached so no API delay)
    const BATCH_SIZE = 8;
    const totalBatches = Math.ceil(excelData.length / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, excelData.length);
      const batchRows = excelData.slice(batchStart, batchEnd);
      
      // Process batch in parallel
      const batchPromises = batchRows.map(async (row, indexInBatch) => {
        const i = batchStart + indexInBatch;
      
      // Map Excel data to testData format (data is already normalized)
      // If Excel has a real Time column use it, otherwise use the UI-generated
      // 24hr time derived from the Date & Time Range inputs.
      const to24Hr = (t) => {
        if (!t) return '';
        const s = String(t).trim();
        // AM/PM -> 24hr
        const ampm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
        if (ampm) {
          let h = parseInt(ampm[1], 10) % 12;
          if (ampm[4].toUpperCase() === 'PM') h += 12;
          return `${String(h).padStart(2,'0')}:${ampm[2]}:${ampm[3] || '00'}`;
        }
        // HH:MM or HH:MM:SS already 24hr
        const parts = s.split(':');
        if (parts.length >= 2) {
          const h = String(parseInt(parts[0],10)||0).padStart(2,'0');
          const m = parts[1].padStart(2,'0');
          const sec = (parts[2] || '00').padStart(2,'0');
          return `${h}:${m}:${sec}`;
        }
        return '';
      };
      const assignedTime = to24Hr(row.Time) || generatedTimes[i] || startTime;
      
      const testData = {
        producer: row.Producer || 'Gautam Solar',
        moduleType: `${selectedWattage}W`, // Use selected wattage
        serialNumber: row.SerialNumber || '',
        testDate: row.Date || defaultDate || new Date().toLocaleDateString('en-CA'),
        testTime: assignedTime,
        irradiance: row.Irradiance || 1000,
        moduleTemp: row.ModuleTemp || 25,
        ambientTemp: row.AmbientTemp || 23,
        moduleArea: row.ModuleArea || 2.7,
        results: {
          pmax: row.Pmax || 0,
          vpm: row.Vpm || 0,
          ipm: row.Ipm || 0,
          voc: row.Voc || 0,
          isc: row.Isc || 0,
          fillFactor: row.FF || 0,
          rs: row.Rs || 0,
          rsh: row.Rsh || 0,
          efficiency: row.Eff || 0
        }
      };

        // Get random graph from CACHED graphs (NO API call - much faster!)
        const graphImage = getRandomGraphFromCache(selectedWattage, modType);
        
        if (!graphImage) {
          console.warn(`Warning: Could not load graph image for ${testData.serialNumber}`);
        }

        try {
          // Generate PDF blob (for both PDF and Word we generate PDF first, Word will be created later)
          const blob = await generateSinglePDFBlob(testData, graphImage);
          return {
            blob: blob,
            serialNumber: testData.serialNumber,
            moduleType: testData.moduleType,
            pmax: testData.results.pmax,
            testData: testData, // Keep testData for Word generation
            graphImage: graphImage // Keep graph for Word generation
          };
        } catch (error) {
          console.error(`Error generating PDF for ${testData.serialNumber}:`, error);
          return null;
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Add successful results to array
      batchResults.forEach(result => {
        if (result) pdfDataArray.push(result);
      });
      
      // Update progress
      setProgress((batchEnd / excelData.length) * 85);
      
      // Small delay between batches to prevent browser freeze (reduced from 500ms)
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Download based on selected mode and format
    // eslint-disable-next-line no-unused-vars
    let downloadSuccess = false;
    if (pdfDataArray.length > 0) {
      if (format === 'word') {
        // Word format generation
        try {
          setProgress(87);
          // eslint-disable-next-line no-unused-vars
          const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ImageRun } = await import('docx');
          const { saveAs } = await import('file-saver');
          
          if (downloadMode === 'split') {
            // Generate individual Word files
            for (let i = 0; i < pdfDataArray.length; i++) {
              const item = pdfDataArray[i];
              const td = item.testData;
              
              const doc = new Document({
                sections: [{
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Production Testing Report', bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: `Producer: ${td.producer}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Module Type: ${td.moduleType}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `S/N: ${td.serialNumber}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Test Conditions', bold: true, size: 28 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Date: ${td.testDate}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Time: ${td.testTime}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Irradiance: ${td.irradiance?.toFixed(2) || 1000} W/m²`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Module Temp: ${td.moduleTemp?.toFixed(2) || 25} °C`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Ambient Temp: ${td.ambientTemp?.toFixed(2) || 25} °C`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Test Results', bold: true, size: 28 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Pmax: ${td.results.pmax?.toFixed(2) || 0} W`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Vpm: ${td.results.vpm?.toFixed(2) || 0} V`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Ipm: ${td.results.ipm?.toFixed(2) || 0} A`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Voc: ${td.results.voc?.toFixed(2) || 0} V`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Isc: ${td.results.isc?.toFixed(2) || 0} A`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Fill Factor: ${td.results.fillFactor?.toFixed(2) || 0} %`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Rs: ${td.results.rs?.toFixed(2) || 0} Ω`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Rsh: ${td.results.rsh?.toFixed(2) || 0} Ω`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Efficiency: ${td.results.efficiency?.toFixed(2) || 0} %`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Module Area: ${td.moduleArea || 2.7} m²`, size: 24 })] }),
                  ]
                }]
              });
              
              const blob = await Packer.toBlob(doc);
              saveAs(blob, `FTR_${item.serialNumber.replace(/\//g, '_')}.docx`);
              setProgress(87 + Math.round(((i + 1) / pdfDataArray.length) * 10));
              await new Promise(r => setTimeout(r, 150));
            }
            downloadSuccess = true;
          } else {
            // Merged Word document
            const sections = pdfDataArray.map((item, idx) => {
              const td = item.testData;
              return {
                children: [
                  new Paragraph({ children: [new TextRun({ text: `Report ${idx + 1} of ${pdfDataArray.length}`, bold: true, size: 20, color: '666666' })], alignment: AlignmentType.RIGHT }),
                  new Paragraph({ children: [new TextRun({ text: 'Production Testing Report', bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: `Producer: ${td.producer}`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: `Module Type: ${td.moduleType}`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: `S/N: ${td.serialNumber}`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'Test Conditions', bold: true, size: 28 })] }),
                  new Paragraph({ children: [new TextRun({ text: `Date: ${td.testDate}  |  Time: ${td.testTime}`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: `Irradiance: ${td.irradiance?.toFixed(2) || 1000} W/m²  |  Module Temp: ${td.moduleTemp?.toFixed(2) || 25} °C`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'Test Results', bold: true, size: 28 })] }),
                  new Paragraph({ children: [new TextRun({ text: `Pmax: ${td.results.pmax?.toFixed(2) || 0} W  |  Vpm: ${td.results.vpm?.toFixed(2) || 0} V  |  Ipm: ${td.results.ipm?.toFixed(2) || 0} A`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: `Voc: ${td.results.voc?.toFixed(2) || 0} V  |  Isc: ${td.results.isc?.toFixed(2) || 0} A  |  FF: ${td.results.fillFactor?.toFixed(2) || 0} %`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: `Rs: ${td.results.rs?.toFixed(2) || 0} Ω  |  Rsh: ${td.results.rsh?.toFixed(2) || 0} Ω  |  Eff: ${td.results.efficiency?.toFixed(2) || 0} %`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: `Module Area: ${td.moduleArea || 2.7} m²`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: '─'.repeat(50), size: 24, color: '999999' })], alignment: AlignmentType.CENTER }),
                ],
                properties: idx < pdfDataArray.length - 1 ? { page: { pageBreak: true } } : {}
              };
            });
            
            const doc = new Document({ sections });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `FTR_Reports_Merged_${new Date().toISOString().split('T')[0]}_${pdfDataArray.length}files.docx`);
            downloadSuccess = true;
          }
          setProgress(98);
        } catch (wordError) {
          console.error('Word generation error:', wordError);
          alert('⚠️ Word generation failed: ' + wordError.message);
        }
      } else {
        // PDF format (existing code)
        if (downloadMode === 'split') {
          // Split mode: download each PDF individually
          setProgress(87);
          for (let i = 0; i < pdfDataArray.length; i++) {
            const item = pdfDataArray[i];
            const url = window.URL.createObjectURL(item.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `FTR_${item.serialNumber.replace(/\//g, '_')}.pdf`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }, 200);
            
            setProgress(87 + Math.round(((i + 1) / pdfDataArray.length) * 10));
            await new Promise(r => setTimeout(r, 150));
          }
          downloadSuccess = true;
        } else {
          // Merged mode: merge all PDFs into single file
          try {
            setProgress(87);
            const { PDFDocument } = await import('pdf-lib');
            const mergedPdf = await PDFDocument.create();

            for (let i = 0; i < pdfDataArray.length; i++) {
              const item = pdfDataArray[i];
              const arrayBuffer = await item.blob.arrayBuffer();
              const donor = await PDFDocument.load(arrayBuffer);
              const copied = await mergedPdf.copyPages(donor, donor.getPageIndices());
              copied.forEach((p) => mergedPdf.addPage(p));
              setProgress(87 + Math.round(((i + 1) / pdfDataArray.length) * 10));
              await new Promise(r => setTimeout(r, 50));
            }

            const mergedBytes = await mergedPdf.save();
            const mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });

            const url = window.URL.createObjectURL(mergedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `FTR_Reports_Merged_${new Date().toISOString().split('T')[0]}_${pdfDataArray.length}files.pdf`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }, 1000);
            
            downloadSuccess = true;
          } catch (mergeError) {
            console.error('Error merging PDFs:', mergeError);
            alert('⚠️ PDF merge failed: ' + mergeError.message + '\nDownloading individual PDFs instead...');
            
            // Fallback: download each PDF individually
            for (const item of pdfDataArray) {
              const url = window.URL.createObjectURL(item.blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `FTR_${item.serialNumber.replace(/\//g, '_')}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              await new Promise(r => setTimeout(r, 150));
            }
            downloadSuccess = true;
          }
        }
        setProgress(98);
      }
    }

    // Upload all PDFs to backend
    try {
      const uploadResult = await uploadPDFsToBackend(pdfDataArray);
      // Anti-throttle cleanup
      if (antiThrottle) antiThrottle.close().catch(() => {});
      setIsGenerating(false);
      const formatText = format === 'word' ? 'Word' : 'PDF';
      const modeText = downloadMode === 'merged' ? `merged ${formatText}` : `${pdfDataArray.length} individual ${formatText} files`;
      alert(`✅ ${uploadResult.files.length} FTR reports generated!\n📥 Downloaded: ${modeText}`);
    } catch (error) {
      if (antiThrottle) antiThrottle.close().catch(() => {});
      setIsGenerating(false);
      const formatText = format === 'word' ? 'Word' : 'PDF';
      const modeText = downloadMode === 'merged' ? `merged ${formatText}` : `${pdfDataArray.length} individual ${formatText} files`;
      alert(`✅ ${pdfDataArray.length} FTR reports generated!\n📥 Downloaded: ${modeText}\n\n⚠️ Upload to server failed: ${error.message}`);
    }
  };

  // Download all PDFs as a ZIP file
  const downloadAllAsZip = async (pdfDataArray) => {
    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Add all PDFs to ZIP
      pdfDataArray.forEach((item, index) => {
        const filename = `FTR_${item.serialNumber.replace(/\//g, '_')}.pdf`;
        zip.file(filename, item.blob);
      });
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download ZIP
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FTR_Reports_${new Date().toISOString().split('T')[0]}_${pdfDataArray.length}files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Failed to create ZIP file: ' + error.message);
    }
  };

  // Delete a record
  const deleteRecord = (index) => {
    if (window.confirm('Delete this record?')) {
      const newData = excelData.filter((_, i) => i !== index);
      setExcelData(newData);
    }
  };

  // Start editing a record
  const startEdit = (index) => {
    setEditingIndex(index);
    setEditForm({...excelData[index]});
  };

  // Save edited record
  const saveEdit = () => {
    const newData = [...excelData];
    newData[editingIndex] = editForm;
    setExcelData(newData);
    setEditingIndex(null);
    setEditForm({});
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Clear all uploaded data?')) {
      setExcelData([]);
      setUploadedFile(null);
    }
  };

  // Server-side bulk generation for large datasets
  const serverGenerate = async () => {
    if (!uploadedFile) {
      alert('Please upload Excel file first!');
      return;
    }
    if (excelData.length === 0) {
      alert('No data found in Excel!');
      return;
    }

    const wattage = prompt('Enter module wattage (WP):', '630');
    if (!wattage) return;

    setServerGenerating(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('wattage', wattage);
      formData.append('module_area', '2.7');
      formData.append('download_type', 'zip');

      const endpoint = API_BASE_URL.endsWith('/api')
        ? `${API_BASE_URL}/ftr/bulk-generate-from-excel`
        : (API_BASE_URL ? `${API_BASE_URL}/api/ftr/bulk-generate-from-excel` : `/api/ftr/bulk-generate-from-excel`);

      const response = await axios.post(endpoint, formData, {
        responseType: 'blob',
        onDownloadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FTR_Reports_${excelData.length}_modules.zip`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);

      setProgress(100);
      setTimeout(() => setProgress(0), 2000);
    } catch (error) {
      console.error('Server generation error:', error);
      const msg = error.response?.data
        ? await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
              try { resolve(JSON.parse(reader.result).error); }
              catch { resolve(reader.result); }
            };
            reader.readAsText(error.response.data);
          })
        : error.message;
      alert('Server generation failed: ' + msg);
    } finally {
      setServerGenerating(false);
    }
  };

  // Download sample Excel template
  const downloadSampleTemplate = () => {
    // Sample data with all required columns
    const sampleData = [
      {
        'SerialNumber': 'GS-2026-001',
        'ModuleType': 'Mono PERC',
        'Producer': 'Gautam Solar',
        'Pmax': 545.50,
        'Vpm': 41.25,
        'Ipm': 13.23,
        'Voc': 49.80,
        'Isc': 14.05,
        'FillFactor': 78.50,
        'Rs': 0.25,
        'Rsh': 450.00,
        'Efficiency': 21.15,
        'Irradiance': 1000,
        'ModuleTemp': 25.0,
        'AmbientTemp': 23.0,
        'ModuleArea': 2.7,
        'Date': '2026-02-07',
        'Time': '10:30:00'
      },
      {
        'SerialNumber': 'GS-2026-002',
        'ModuleType': 'Mono PERC',
        'Producer': 'Gautam Solar',
        'Pmax': 548.20,
        'Vpm': 41.35,
        'Ipm': 13.26,
        'Voc': 49.90,
        'Isc': 14.08,
        'FillFactor': 78.65,
        'Rs': 0.24,
        'Rsh': 465.00,
        'Efficiency': 21.25,
        'Irradiance': 1000,
        'ModuleTemp': 25.0,
        'AmbientTemp': 23.0,
        'ModuleArea': 2.7,
        'Date': '2026-02-07',
        'Time': '10:32:15'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 15 }, // SerialNumber
      { wch: 12 }, // ModuleType
      { wch: 14 }, // Producer
      { wch: 8 },  // Pmax
      { wch: 8 },  // Vpm
      { wch: 8 },  // Ipm
      { wch: 8 },  // Voc
      { wch: 8 },  // Isc
      { wch: 10 }, // FillFactor
      { wch: 6 },  // Rs
      { wch: 8 },  // Rsh
      { wch: 10 }, // Efficiency
      { wch: 10 }, // Irradiance
      { wch: 12 }, // ModuleTemp
      { wch: 12 }, // AmbientTemp
      { wch: 11 }, // ModuleArea
      { wch: 12 }, // Date
      { wch: 10 }, // Time
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FTR Data');
    
    // Download the file
    XLSX.writeFile(wb, 'FTR_Sample_Template.xlsx');
  };

  return (
    <div className="bulk-ftr-container">
      <h2>Bulk FTR Report Generator</h2>
      
      <div className="upload-section">
        <div className="upload-box" style={{gridColumn: '1 / -1'}}>
          <h3>Upload Excel Data</h3>
          <p style={{fontSize: '13px', color: '#666', marginBottom: '10px'}}>Excel should have columns: SerialNumber, ModuleType, Producer, Pmax, Vpm, Ipm, Voc, Isc, FillFactor, Rs, Rsh, Efficiency, Irradiance, ModuleTemp, AmbientTemp, ModuleArea, Date, Time</p>
          
          {/* Download Template Button */}
          <button 
            onClick={downloadSampleTemplate}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto 15px auto'
            }}
          >
            📥 Download Sample Template
          </button>
          
          <p style={{fontSize: '12px', color: '#1e3a8a', fontWeight: '600', marginBottom: '10px'}}>📊 Graphs will be automatically loaded from Graph Manager</p>
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            onChange={handleExcelUpload}
            className="file-input"
          />
          {excelData.length > 0 && (
            <div className="success-msg">✓ {excelData.length} records loaded</div>
          )}
        </div>
      </div>

      {/* Data Table with CRUD */}
      {excelData.length > 0 && (
        <div className="data-table-section">
          <div className="table-header">
            <h3>📋 Uploaded Records ({excelData.length})</h3>
            {isSuperAdmin() && (
              <button onClick={clearAllData} className="btn-clear" title="Clear all data">
                🗑️ Clear All
              </button>
            )}
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Serial Number</th>
                  <th>Module Type</th>
                  <th>Producer</th>
                  <th>Pmax (W)</th>
                  <th>Voc (V)</th>
                  <th>Isc (A)</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, index) => (
                  <tr key={index}>
                    {editingIndex === index ? (
                      <>
                        <td>{index + 1}</td>
                        <td>
                          <input 
                            value={editForm.SerialNumber || editForm['Serial Number'] || ''}
                            onChange={(e) => setEditForm({...editForm, SerialNumber: e.target.value})}
                            style={{width: '100%', padding: '4px'}}
                          />
                        </td>
                        <td>
                          <input 
                            value={editForm.ModuleType || editForm['Module Type'] || ''}
                            onChange={(e) => setEditForm({...editForm, ModuleType: e.target.value})}
                            style={{width: '100%', padding: '4px'}}
                          />
                        </td>
                        <td>
                          <input 
                            value={editForm.Producer || ''}
                            onChange={(e) => setEditForm({...editForm, Producer: e.target.value})}
                            style={{width: '100%', padding: '4px'}}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            value={editForm.Pmax || ''}
                            onChange={(e) => setEditForm({...editForm, Pmax: e.target.value})}
                            style={{width: '80px', padding: '4px'}}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            value={editForm.Voc || ''}
                            onChange={(e) => setEditForm({...editForm, Voc: e.target.value})}
                            style={{width: '70px', padding: '4px'}}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            value={editForm.Isc || ''}
                            onChange={(e) => setEditForm({...editForm, Isc: e.target.value})}
                            style={{width: '70px', padding: '4px'}}
                          />
                        </td>
                        <td>
                          <input 
                            type="date"
                            value={editForm.Date || ''}
                            onChange={(e) => setEditForm({...editForm, Date: e.target.value})}
                            style={{width: '120px', padding: '4px'}}
                          />
                        </td>
                        <td>
                          <button onClick={saveEdit} className="btn-save" title="Save">✓</button>
                          <button onClick={cancelEdit} className="btn-cancel" title="Cancel">✕</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{index + 1}</td>
                        <td>{row.SerialNumber || row['Serial Number'] || '-'}</td>
                        <td>{row.ModuleType || row['Module Type'] || '-'}</td>
                        <td>{row.Producer || '-'}</td>
                        <td>{row.Pmax || '-'}</td>
                        <td>{row.Voc || '-'}</td>
                        <td>{row.Isc || '-'}</td>
                        <td>{row.Date || '-'}</td>
                        <td>
                          <button onClick={() => startEdit(index)} className="btn-edit" title="Edit">✏️</button>
                          {isSuperAdmin() && (
                            <button onClick={() => deleteRecord(index)} className="btn-delete" title="Delete">🗑️</button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="generate-section" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          
          {/* Module Type */}
          <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Module Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', border: moduleType === 'monofacial' ? '2px solid #10b981' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: moduleType === 'monofacial' ? '#ecfdf5' : '#fff', transition: 'all 0.2s' }}>
                <input type="radio" name="moduleType" value="monofacial" checked={moduleType === 'monofacial'} onChange={(e) => setModuleType(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>◻️ Mono</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', border: moduleType === 'bifacial' ? '2px solid #10b981' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: moduleType === 'bifacial' ? '#ecfdf5' : '#fff', transition: 'all 0.2s' }}>
                <input type="radio" name="moduleType" value="bifacial" checked={moduleType === 'bifacial'} onChange={(e) => setModuleType(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>🔄 Bifacial</span>
              </label>
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time Range</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', width: '45px', color: '#64748b' }}>📅 Date</span>
                <input type="date" value={defaultDate} onChange={(e) => setDefaultDate(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>⏰</span>
                  <input type="time" value={startTime.substring(0, 5)} onChange={(e) => setStartTime(e.target.value + ':00')} style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
                </div>
                <span style={{ color: '#94a3b8', alignSelf: 'center' }}>→</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="time" value={endTime.substring(0, 5)} onChange={(e) => setEndTime(e.target.value + ':00')} style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
                </div>
              </div>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: '4px 0 0 0', textAlign: 'center' }}>Random gap: 45s - 3min</p>
            </div>
          </div>

          {/* Download Format */}
          <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Format</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', border: downloadFormat === 'pdf' ? '2px solid #ec4899' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: downloadFormat === 'pdf' ? '#fdf2f8' : '#fff', transition: 'all 0.2s' }}>
                <input type="radio" name="downloadFormat" value="pdf" checked={downloadFormat === 'pdf'} onChange={(e) => setDownloadFormat(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>📄 PDF</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', border: downloadFormat === 'word' ? '2px solid #ec4899' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: downloadFormat === 'word' ? '#fdf2f8' : '#fff', transition: 'all 0.2s' }}>
                <input type="radio" name="downloadFormat" value="word" checked={downloadFormat === 'word'} onChange={(e) => setDownloadFormat(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>📝 Word</span>
              </label>
            </div>
          </div>

          {/* Download Type */}
          <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Output Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '10px 8px', border: downloadType === 'merged' ? '2px solid #3b82f6' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: downloadType === 'merged' ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}>
                <input type="radio" name="downloadType" value="merged" checked={downloadType === 'merged'} onChange={(e) => setDownloadType(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>📄 Merged</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Single file</span>
              </label>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '10px 8px', border: downloadType === 'split' ? '2px solid #3b82f6' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: downloadType === 'split' ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}>
                <input type="radio" name="downloadType" value="split" checked={downloadType === 'split'} onChange={(e) => setDownloadType(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>📑 Split</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Individual</span>
              </label>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => generateAllReports(downloadType, downloadFormat, moduleType)}
            disabled={isGenerating || excelData.length === 0}
            className="generate-btn"
            style={{ flex: '1', minWidth: '200px', maxWidth: '400px' }}
          >
            {isGenerating ? `⚡ Browser Gen... ${Math.round(progress)}%` : `🚀 Generate (Browser)`}
          </button>

          <button
            onClick={serverGenerate}
            disabled={serverGenerating || excelData.length === 0 || !uploadedFile}
            className="generate-btn"
            style={{
              flex: '1', minWidth: '200px', maxWidth: '400px',
              background: serverGenerating ? '#94a3b8' : '#7c3aed',
              borderColor: serverGenerating ? '#94a3b8' : '#7c3aed'
            }}
          >
            {serverGenerating
              ? `☁️ Server Gen... ${Math.round(progress)}%`
              : `☁️ Server Generate (Fast) - ${excelData.length > 1000 ? '✅ Recommended' : ''}`}
          </button>
        </div>
        {excelData.length > 1000 && (
          <p style={{ textAlign: 'center', color: '#7c3aed', fontSize: '12px', marginTop: '6px' }}>
            💡 For {excelData.length} records, use <strong>Server Generate</strong> for best performance
          </p>
        )}
      </div>

      {isGenerating && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      {serverGenerating && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: '#7c3aed' }}></div>
        </div>
      )}
    </div>
  );
};

export default BulkFTRGenerator;
