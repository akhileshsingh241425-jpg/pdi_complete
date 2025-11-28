import React, { useState, useEffect } from 'react';
import '../styles/RejectionUpload.css';

const RejectionUpload = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://backend.gspl.cloud/api/master/orders');
      const result = await response.json();
      if (response.ok) {
        setOrders(result.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadRejections = async () => {
    if (!file || !selectedOrder) {
      setMessage({ text: 'Please select an order and Excel file!', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }

    setLoading(true);
    setMessage({ text: '⏳ Uploading rejection data...', type: 'info' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('order_id', selectedOrder);

      const response = await fetch('http://backend.gspl.cloud/api/master/upload-rejections', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload rejections');
      }

      let messageText = `✅ Successfully marked ${result.rejected_count} modules as rejected!`;
      
      if (result.warning) {
        messageText += `\n⚠️ ${result.warning}`;
        if (result.not_found_serials && result.not_found_serials.length > 0) {
          messageText += `\nNot found: ${result.not_found_serials.join(', ')}...`;
        }
      }

      setMessage({ text: messageText, type: 'success' });
      
      // Reset form
      setFile(null);
      document.getElementById('rejection-file-input').value = '';
      
      // Refresh orders to update counts
      fetchOrders();
      
      setTimeout(() => setMessage({ text: '', type: '' }), 7000);
      
    } catch (error) {
      console.error('Error uploading rejections:', error);
      setMessage({ text: `❌ Error: ${error.message}`, type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rejection-upload-container">
      <h1>🚫 Rejection Upload</h1>
      <p className="subtitle">Mark modules as rejected - they will not appear in FTR downloads</p>

      {message.text && (
        <div className={`message ${message.type}`} style={{ whiteSpace: 'pre-line' }}>
          {message.text}
        </div>
      )}

      <div className="upload-section">
        <h2>Upload Rejection Excel</h2>
        
        <div className="form-group">
          <label>Select Order *</label>
          <select
            value={selectedOrder}
            onChange={(e) => setSelectedOrder(e.target.value)}
            required
          >
            <option value="">-- Select Order --</option>
            {orders.map(order => (
              <option key={order.id} value={order.id}>
                {order.company_name} - {order.order_number} ({order.total_modules.toLocaleString()} modules)
              </option>
            ))}
          </select>
        </div>

        <div className="file-upload-section">
          <label>Excel File *</label>
          <input
            id="rejection-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            required
          />
          {file && <p className="file-name">Selected: {file.name}</p>}
        </div>

        <div className="info-box">
          <h3>📋 Excel Format:</h3>
          <ul>
            <li><strong>Column A:</strong> Serial Number (required)</li>
            <li><strong>Column B:</strong> Rejection Reason (optional)</li>
          </ul>
          <p><strong>Example:</strong></p>
          <table className="example-table">
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>GS04890TG3002500001</td>
                <td>Low Pmax</td>
              </tr>
              <tr>
                <td>GS04890TG3002500050</td>
                <td>Visual defect</td>
              </tr>
              <tr>
                <td>GS04890TG3002500150</td>
                <td>EL failure</td>
              </tr>
            </tbody>
          </table>
          <p className="note">✅ Simple format - just serial numbers in Column A</p>
          <p className="note">✅ Rejected modules will NOT appear in FTR downloads</p>
          <p className="note">✅ Already rejected modules will be updated</p>
        </div>

        <button 
          onClick={uploadRejections} 
          className="btn-upload"
          disabled={loading}
        >
          {loading ? '⏳ Uploading...' : '🚫 Upload Rejections'}
        </button>
      </div>

      <div className="orders-summary">
        <h2>📦 Orders Summary</h2>
        {orders.length === 0 ? (
          <p className="no-data">No orders available</p>
        ) : (
          <div className="orders-grid">
            {orders.map(order => {
              const rejectionRate = order.total_modules > 0 
                ? ((order.rejection_count / order.total_modules) * 100).toFixed(2)
                : 0;
              
              return (
                <div key={order.id} className="order-card">
                  <h3>{order.company_name}</h3>
                  <p><strong>Order #:</strong> {order.order_number}</p>
                  <p><strong>Total Modules:</strong> {order.total_modules.toLocaleString()}</p>
                  <p><strong>✅ FTR (Good):</strong> {(order.total_modules - order.rejection_count).toLocaleString()}</p>
                  <p className="rejection-count"><strong>🚫 Rejected:</strong> {order.rejection_count.toLocaleString()}</p>
                  <p className="rejection-rate"><strong>Rejection Rate:</strong> {rejectionRate}%</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RejectionUpload;
