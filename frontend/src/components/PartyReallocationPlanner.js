import React, { useEffect, useMemo, useState } from 'react';
import '../styles/PartyReallocationPlanner.css';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5003/api'
  : '/api';

const PartyReallocationPlanner = () => {
  const [parties, setParties] = useState([]);
  const [packedPartyId, setPackedPartyId] = useState('');
  const [dispatchPartyId, setDispatchPartyId] = useState('');
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadParties = async () => {
      setLoadingParties(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/ftr/sales-parties`);
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to load parties');
        }
        const list = Array.isArray(data.parties) ? data.parties : [];
        setParties(list);
      } catch (err) {
        setError(err.message || 'Unable to load party list');
        setParties([]);
      } finally {
        setLoadingParties(false);
      }
    };

    loadParties();
  }, []);

  const packedParty = useMemo(
    () => parties.find((p) => String(p.id) === String(packedPartyId)),
    [parties, packedPartyId]
  );

  const dispatchParty = useMemo(
    () => parties.find((p) => String(p.id) === String(dispatchPartyId)),
    [parties, dispatchPartyId]
  );

  const runAnalysis = async () => {
    if (!packedPartyId || !dispatchPartyId) {
      setError('Please select both packed party and dispatch party.');
      return;
    }

    setLoadingAnalysis(true);
    setError('');
    setAnalysis(null);

    try {
      const packedUrl = `${API_BASE_URL}/ftr/packing-count-by-party/${packedPartyId}`;
      const dispatchUrl = `${API_BASE_URL}/ftr/dispatch-by-party/${dispatchPartyId}?name=${encodeURIComponent(dispatchParty?.companyName || '')}`;

      const [packedResp, dispatchResp] = await Promise.all([
        fetch(packedUrl),
        fetch(dispatchUrl)
      ]);

      const packedData = await packedResp.json();
      const dispatchData = await dispatchResp.json();

      if (!packedData.success) {
        throw new Error(packedData.error || 'Unable to fetch packed-party count');
      }
      if (!dispatchData.success) {
        throw new Error(dispatchData.error || 'Unable to fetch dispatch-party data');
      }

      const packedCount = Number(packedData.packing_count || 0);
      const dispatchCount = Number(dispatchData?.summary?.dispatched || 0);
      const feasibility = packedCount > 0 ? 'Possible' : 'No packed modules found for selected packed party';

      setAnalysis({
        packedPartyName: packedData.party_name,
        packedPartyId: packedData.party_id,
        packedCount,
        dispatchPartyName: dispatchParty?.companyName || dispatchData.company_name || dispatchPartyId,
        dispatchPartyId,
        dispatchCount,
        feasibility,
        dispatchGroups: dispatchData.dispatch_groups || [],
        palletGroups: dispatchData.pallet_groups || []
      });
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="party-reallocation-planner">
      <div className="planner-header">
        <h1>Dynamic Party Reallocation Planner</h1>
        <p>
          Read-only analysis tool: packed party aur dispatch party ko dynamic select karo.
          Existing Dispatch Tracker logic unchanged rahega.
        </p>
      </div>

      <div className="planner-card">
        <div className="planner-grid">
          <div className="planner-field">
            <label htmlFor="packed-party">Packed Under Party</label>
            <select
              id="packed-party"
              value={packedPartyId}
              onChange={(e) => setPackedPartyId(e.target.value)}
              disabled={loadingParties || loadingAnalysis}
            >
              <option value="">-- Select Packed Party --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="planner-field">
            <label htmlFor="dispatch-party">Dispatch To Party</label>
            <select
              id="dispatch-party"
              value={dispatchPartyId}
              onChange={(e) => setDispatchPartyId(e.target.value)}
              disabled={loadingParties || loadingAnalysis}
            >
              <option value="">-- Select Dispatch Party --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="planner-actions">
          <button
            className="analyze-btn"
            type="button"
            onClick={runAnalysis}
            disabled={loadingParties || loadingAnalysis}
          >
            {loadingAnalysis ? 'Analyzing...' : 'Analyze Reallocation'}
          </button>
        </div>

        {loadingParties && <p className="info">Loading parties...</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {analysis && (
        <div className="planner-results">
          <div className="result-card">
            <h3>Packed Party</h3>
            <p><strong>Name:</strong> {analysis.packedPartyName}</p>
            <p><strong>Party ID:</strong> {analysis.packedPartyId}</p>
            <p><strong>Packing Count:</strong> {analysis.packedCount.toLocaleString()}</p>
          </div>

          <div className="result-card">
            <h3>Dispatch Party</h3>
            <p><strong>Name:</strong> {analysis.dispatchPartyName}</p>
            <p><strong>Party ID:</strong> {analysis.dispatchPartyId}</p>
            <p><strong>Already Dispatched:</strong> {analysis.dispatchCount.toLocaleString()}</p>
          </div>

          <div className="result-card highlight">
            <h3>Decision Support</h3>
            <p><strong>Status:</strong> {analysis.feasibility}</p>
            <p><strong>Vehicle/Invoice Groups:</strong> {analysis.dispatchGroups.length}</p>
            <p><strong>Pallet Groups:</strong> {analysis.palletGroups.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartyReallocationPlanner;
