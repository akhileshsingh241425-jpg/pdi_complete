import React, { useState } from 'react';
import '../styles/MasterDataUpload.css';

const MasterDataUpload = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    order_number: '',
    serial_prefix: ''
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ percent: 0, status: '', current: 0, total: 0 });
  const [orders, setOrders] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadExcel = async () => {
    if (!file || !formData.company_name || !formData.order_number) {
      setMessage({ text: 'Please fill all required fields and select a file!', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }

    setLoading(true);
    setUploadProgress({ percent: 0, status: 'Reading Excel file...', current: 0, total: 0 });
    setMessage({ text: '', type: '' });

    // Start polling for backend progress
    let pollInterval = null;
    const startPolling = (orderId) => {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`https://backend.gspl.cloud/api/master/upload-progress/${orderId}`);
          const progress = await response.json();
          
          if (progress.percent > 50) {
            setUploadProgress({
              percent: 50 + (progress.percent / 2), // Scale 0-100 backend to 50-100 frontend
              status: progress.status || `Processing: ${progress.current.toLocaleString()} / ${progress.total.toLocaleString()} rows`,
              current: progress.current,
              total: progress.total
            });
          }
          
          if (progress.percent === 100) {
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000); // Poll every 2 seconds
    };

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('company_name', formData.company_name);
      formDataObj.append('order_number', formData.order_number);
      formDataObj.append('serial_prefix', formData.serial_prefix);

      // Simulate progress during upload
      setUploadProgress({ percent: 10, status: 'Uploading file to server...' });

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 50); // 0-50%
          setUploadProgress({ 
            percent: percentComplete, 
            status: `Uploading... ${(e.loaded / 1024 / 1024).toFixed(1)} MB / ${(e.total / 1024 / 1024).toFixed(1)} MB`
          });
        }
      });

      // Send request
      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', 'https://backend.gspl.cloud/api/master/upload-excel');
        
        xhr.onload = () => resolve(xhr);
        xhr.onerror = () => reject(new Error('Upload failed'));
        
        // Start processing indication after upload completes
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 201) {
              setUploadProgress(prev => ({ 
                ...prev,
                percent: 100, 
                status: 'Upload complete! ✅' 
              }));
            }
          }
        };
        
        xhr.send(formDataObj);
      });

      if (response.status !== 200 && response.status !== 201) {
        const result = JSON.parse(response.responseText);
        throw new Error(result.error || 'Failed to upload data');
      }

      const result = JSON.parse(response.responseText);

      if (!response.ok) {
        clearInterval(pollInterval);
        throw new Error(result.error || 'Failed to upload data');
      }

      // Start polling backend progress
      if (result.order && result.order.id) {
        startPolling(result.order.id);
      }

      setMessage({ 
        text: `✅ Successfully uploaded ${result.order.total_modules} modules! FTR: ${result.order.ftr_count}, Rejected: ${result.order.rejection_count}`, 
        type: 'success' 
      });
      
      // Reset form
      setFormData({ company_name: '', order_number: '', serial_prefix: '' });
      setFile(null);
      document.getElementById('file-input').value = '';
      
      // Refresh orders list
      fetchOrders();
      
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
      
    } catch (error) {
      console.error('Error uploading data:', error);
      if (pollInterval) clearInterval(pollInterval);
      setMessage({ text: `❌ Error: ${error.message}`, type: 'error' });
      setUploadProgress({ percent: 0, status: '', current: 0, total: 0 });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval);
        setUploadProgress({ percent: 0, status: '', current: 0, total: 0 });
      }, 3000);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://backend.gspl.cloud/api/master/orders');
      const result = await response.json();
      if (response.ok) {
        setOrders(result.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="master-data-container">
      <h1>📊 Master Data Upload</h1>
      <p className="subtitle">Upload Excel file with FTR and Rejection data</p>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {loading && uploadProgress.status && (
        <div className="progress-container">
          <div className="progress-bar-wrapper">
            <div className="progress-bar" style={{ width: `${uploadProgress.percent}%` }}>
              <span className="progress-text">{Math.round(uploadProgress.percent)}%</span>
            </div>
          </div>
          <p className="progress-status">{uploadProgress.status}</p>
          {uploadProgress.total > 0 && (
            <div className="progress-details">
              <span className="progress-numbers">
                ✅ Processed: <strong>{uploadProgress.current.toLocaleString()}</strong> / {uploadProgress.total.toLocaleString()} rows
              </span>
              <span className="progress-remaining">
                ⏳ Remaining: <strong>{(uploadProgress.total - uploadProgress.current).toLocaleString()}</strong> rows
              </span>
            </div>
          )}
        </div>
      )}

      <div className="upload-section">
        <h2>Upload New Order Data</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="e.g., ABC Solar Pvt Ltd"
              required
            />
          </div>

          <div className="form-group">
            <label>Order Number *</label>
            <input
              type="text"
              name="order_number"
              value={formData.order_number}
              onChange={handleChange}
              placeholder="e.g., ORD-2025-001"
              required
            />
          </div>

          <div className="form-group">
            <label>Serial Number Prefix</label>
            <input
              type="text"
              name="serial_prefix"
              value={formData.serial_prefix}
              onChange={handleChange}
              placeholder="e.g., GS04875KG302250"
            />
          </div>
        </div>

        <div className="file-upload-section">
          <label>Excel File *</label>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            required
          />
          {file && <p className="file-name">Selected: {file.name}</p>}
        </div>

        <button 
          onClick={uploadExcel} 
          className="btn-upload"
          disabled={loading}
        >
          {loading ? '⏳ Uploading...' : '📤 Upload Excel Data'}
        </button>
      </div>

      <div className="orders-section">
        <h2>📦 Uploaded Orders</h2>
        
        {orders.length === 0 ? (
          <p className="no-data">No orders uploaded yet</p>
        ) : (
          <div className="orders-grid">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <h3>{order.company_name}</h3>
                <p><strong>Order #:</strong> {order.order_number}</p>
                <p><strong>Total Modules:</strong> {order.total_modules.toLocaleString()}</p>
                <p><strong>Produced:</strong> {order.produced_modules.toLocaleString()}</p>
                <p><strong>Remaining:</strong> {order.remaining_modules.toLocaleString()}</p>
                <p><strong>Rejection Rate:</strong> {order.rejection_percentage}%</p>
                <p className="created-date">Created: {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterDataUpload;
