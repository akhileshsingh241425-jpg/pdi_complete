import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../services/apiService';
import '../styles/MasterDataViewer.css';

const MasterDataViewer = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchSerial, setSearchSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editModule, setEditModule] = useState(null);
  const modulesPerPage = 50;

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      fetchModules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder, currentPage, searchSerial]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(getApiUrl('master/orders'));
      const result = await response.json();
      if (response.ok) {
        setOrders(result.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * modulesPerPage;
      let url = getApiUrl(`master/modules/${selectedOrder}?limit=${modulesPerPage}&offset=${offset}`);
      
      if (searchSerial) {
        url += `&search=${searchSerial}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        setModules(result.modules);
        setTotalPages(Math.ceil(result.total / modulesPerPage));
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`master/module/${moduleId}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ text: '✅ Module deleted successfully!', type: 'success' });
        fetchModules();
        fetchOrders();
      } else {
        throw new Error('Failed to delete module');
      }
    } catch (error) {
      setMessage({ text: `❌ Error: ${error.message}`, type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this entire order? All modules will be deleted!')) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`master/order/${orderId}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ text: '✅ Order deleted successfully!', type: 'success' });
        setSelectedOrder(null);
        fetchOrders();
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      setMessage({ text: `❌ Error: ${error.message}`, type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const updateModule = async () => {
    try {
      const response = await fetch(getApiUrl(`master/module/${editModule.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editModule)
      });

      if (response.ok) {
        setMessage({ text: '✅ Module updated successfully!', type: 'success' });
        setEditModule(null);
        fetchModules();
      } else {
        throw new Error('Failed to update module');
      }
    } catch (error) {
      setMessage({ text: `❌ Error: ${error.message}`, type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  return (
    <div className="data-viewer-container">
      <h1>📊 Master Data Viewer</h1>
      <p className="subtitle">View and manage uploaded FTR data</p>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Orders Section */}
      <div className="orders-section">
        <h2>📦 Orders</h2>
        {orders.length === 0 ? (
          <p className="no-data">No orders uploaded yet</p>
        ) : (
          <div className="orders-grid">
            {orders.map(order => (
              <div 
                key={order.id} 
                className={`order-card ${selectedOrder === order.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedOrder(order.id);
                  setCurrentPage(1);
                }}
              >
                <h3>{order.company_name}</h3>
                <p><strong>Order #:</strong> {order.order_number}</p>
                <p><strong>Total:</strong> {order.total_modules.toLocaleString()} modules</p>
                <p><strong>Produced:</strong> {order.produced_modules.toLocaleString()}</p>
                <p><strong>Remaining:</strong> {order.remaining_modules.toLocaleString()}</p>
                <button 
                  className="btn-delete-order"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOrder(order.id);
                  }}
                >
                  🗑️ Delete Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modules Section */}
      {selectedOrder && (
        <div className="modules-section">
          <h2>📋 Modules Data</h2>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by Serial Number..."
              value={searchSerial}
              onChange={(e) => {
                setSearchSerial(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {loading ? (
            <p className="loading">⏳ Loading modules...</p>
          ) : modules.length === 0 ? (
            <p className="no-data">No modules found</p>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Serial Number</th>
                      <th>Date</th>
                      <th>Pmax</th>
                      <th>Isc</th>
                      <th>Voc</th>
                      <th>Eff</th>
                      <th>Class</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(module => (
                      <tr key={module.id}>
                        <td><strong>{module.serial_number}</strong></td>
                        <td>{module.date || '-'}</td>
                        <td>{module.pmax?.toFixed(2) || '-'}</td>
                        <td>{module.isc?.toFixed(2) || '-'}</td>
                        <td>{module.voc?.toFixed(2) || '-'}</td>
                        <td>{module.eff?.toFixed(2) || '-'}</td>
                        <td>{module.class_grade || '-'}</td>
                        <td>
                          <button 
                            className="btn-edit"
                            onClick={() => setEditModule(module)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => deleteModule(module.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editModule && (
        <div className="modal-overlay" onClick={() => setEditModule(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Edit Module</h3>
            <div className="edit-form">
              <div className="form-row">
                <label>Serial Number</label>
                <input 
                  type="text" 
                  value={editModule.serial_number}
                  onChange={(e) => setEditModule({...editModule, serial_number: e.target.value})}
                />
              </div>
              <div className="form-row">
                <label>Pmax</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editModule.pmax || ''}
                  onChange={(e) => setEditModule({...editModule, pmax: parseFloat(e.target.value)})}
                />
              </div>
              <div className="form-row">
                <label>Isc</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editModule.isc || ''}
                  onChange={(e) => setEditModule({...editModule, isc: parseFloat(e.target.value)})}
                />
              </div>
              <div className="form-row">
                <label>Voc</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editModule.voc || ''}
                  onChange={(e) => setEditModule({...editModule, voc: parseFloat(e.target.value)})}
                />
              </div>
              <div className="form-row">
                <label>Eff</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editModule.eff || ''}
                  onChange={(e) => setEditModule({...editModule, eff: parseFloat(e.target.value)})}
                />
              </div>
              <div className="form-row">
                <label>Class</label>
                <input 
                  type="text"
                  value={editModule.class_grade || ''}
                  onChange={(e) => setEditModule({...editModule, class_grade: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-save" onClick={updateModule}>💾 Save</button>
              <button className="btn-cancel" onClick={() => setEditModule(null)}>❌ Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDataViewer;
