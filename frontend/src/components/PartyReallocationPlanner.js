import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import '../styles/PartyReallocationPlanner.css';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5003/api'
  : '/api';

// Only these parties should appear in the Packed Under Party selector.
const VALID_PACKING_PARTY_IDS = [
  'fda91e0b-f0fd-4749-863f-ed7a56842a0e',
  'ec1a1584-a5d2-4bfe-bb02-150c844dcf6a',
  '141b81a0-2bab-4790-b825-3c8734d41484',
  '0700f941-cfea-41b7-af89-4f07f48d3f03',
  '4eb20c96-03f6-4ae7-97d7-7e9377a7ef85',
  'dc60ecbe-e490-4063-8ab5-385d2698bf7f',
  'e6c9c89a-df64-4dbd-8e2e-68442513d0fa',
  'f0c1cca6-ec37-4e07-ab28-b067dc7020f5',
  '6831a72b-a8cf-4d3e-969a-d1376dea07b2',
  '41c8dd06-ef43-453a-bcec-d6a2e115b408',
  'b1f03e86-b8dd-43dc-9daa-f97db87d9f8c',
  '56e5d3c9-3a47-4f3e-b7e8-a464d04c70d3',
  '61b36a5d-a521-4c5c-afef-de24e20795e3',
  '6a65c156-ad9f-44d7-a981-219a50b3a326',
  '640f8f8a-f8db-4944-aba3-cadb1bc37a3b',
  'cdd7fde6-22ef-42fb-a3c1-b885f4ede3ff',
  'bcf78c5c-03e1-4ab0-84af-16ed0e82e492',
  'f9d1d0b3-1321-4fa5-a1a3-3ce218e26761',
  '4f349ea4-c00f-4e9e-aa84-49c9b33ebd04',
  '027b287b-d263-4dde-b791-a14319254edf',
  '105f975a-92d5-4b44-bb25-ab38db14e6bd',
  '88943d4f-8114-4f10-b7b0-c8ce8f851036',
  'a28ee199-97ec-4fdd-9b69-10e1b3a3710b',
  'c3a077f7-8fcd-45e1-b5c1-c52254f0a7c2',
  '1dbdc9dd-1371-4dce-b6ef-88c5aefa1822',
  '2e6eccad-11b3-400c-899a-b6601585b878',
  '9c62bda6-1dca-4ecb-9e90-ddf93d230a99',
  'bf29ae45-a8ad-4148-889f-0c6e68408104',
  '37f25d1d-07c7-4f7d-abab-55fa8a5cb76a',
  'a5663a7b-a757-4a93-b9d6-ca0d4383ef37',
  '2a10a825-9060-4b89-ae4c-36341ecbcc2d',
  '1b787595-4dee-4d78-8863-94ec1a258bb0',
  '6b825e44-2617-425f-aca1-55468543fdf5',
  '4666e7a6-9d5e-4456-8b73-0d5211fc73f4',
  'af8f8a8b-7667-4202-a45b-f698f7869357',
  '7c01ecff-e66d-49f8-9c74-c5ea92285b63',
  '9fa1b570-cff2-4f6e-8292-847efe465b90',
  '6121c749-f501-4afa-a2f8-2fbd2e98506a',
  '84db7871-439e-404c-b6f8-994a79d2790d',
  'a46e1a8d-e5f2-4584-a7db-44c41bcedce4',
  '6ab5098c-6232-49e3-ac87-1124c0556e9b',
  '931db2c5-b016-4914-b378-69e9f22562a7',
  'a868e97e-afd7-48fc-9068-abd4d093d8bf',
  '6ed97fd8-6bbb-4371-8d56-f9af22e55bb0',
  '125d8a73-a049-4072-886f-a9bb232a92eb',
  '22f70b96-f5c5-49d3-9cb2-6d147f4c8544',
  'd4e90eed-ae2c-41f7-abc4-c4c009018537',
  'd7e17b71-aa20-4165-a729-6f62f0505943'
];

const VALID_PACKING_PARTY_NAMES = [
  'KPI GREEN ENERGY LIMITED',
  'BONDADA ENGINEERING LIMITED',
  'STERLING AND WILSON RENEWABLE ENERGY LIMITED',
  'ILIOS POWER PRIVATE LIMITED',
  'PURSHOTAM PROFILES PVT LTD',
  'ORIANA POWER LIMITED',
  'MEGHA ENGINEERING AND INFRASTRUCTURES LIMITED',
  'PERIMETER SOLUTIONS',
  'EASTMAN AUTO & POWER LIMITED',
  'SUNDROPS ENERGIA PRIVATE LIMITED',
  'RENNY STRIPS PVT LTD',
  'KIRLOSKAR SOLAR TECHNOLOGIES PVT LTD',
  'M/S VIDYUT ENERGY SYSTEMS PRIVATE LIMITED',
  'ENRICH ENERGY PVT. LTD.',
  'RMC SWITCH GEARS LIMITED',
  'ENERTURE TECHNOLOGIES PVT LTD',
  'ULTRA VIBRANT SOLAR ENERGY PVT. LTD.',
  'MATHURESH SYNERGY PVT LTD',
  'B R MANJU CONSTRUCTION COMPANY',
  'POLYCAB INDIA LIMITED',
  'EAPRO GLOBAL ENERGY PRIVATE LIMITED',
  'QUANT SOLAR',
  'SMARTEN POWER SYSTEMS LTD',
  'TERAVON GREEN ENERGIES LIMITED',
  'SARIKA NHPC',
  'GODREJ & BOYCE MFG CO LTD.',
  'JOTTER RENEWABLES PRIVATE LIMITED',
  'GO SOLAR ENERGY SOLUTION PRIVATE LIMITED',
  'NEVRONAS SOLAR PRIVATE LIMITED',
  'LIVGUARD ENERGY TECHNOLOGIES PVT LTD',
  'MOGLI LABS (INDIA) PRIVATE LIMITED',
  'SU-KAM POWER SYSTEMS LTD',
  'LIVFAST BATTERIES PVT. LTD.',
  'VIDYUT ENERGY SYSTEMS PRIVATE LIMITED',
  'NEXUS SOLAR ENERGY PVT LTD',
  'RENEWPRO ENERGY PVT. LTD.',
  'ABORIGINAL ENERGY PVT LTD',
  'GALO ENERGY PVT LTD',
  'SOLAR ERA',
  'KIRLOSKAR SOLAR TECHNOLOGIES PVT LTD,MH',
  'NEXAUM ENERGY PVT.LTD.',
  'RAYS POWER INFRA LIMITED',
  'SMART CONSTRUCTION',
  'ROCS ENGINEERS',
  'CARTWHEEL ENERGY',
  'GHANPRIYA ENERGY SOLUTION PRIVATE LIMITED',
  'TEST',
  'REDINGTON LIMITED KARNATAKA'
];

const filterBySearch = (parties, term) => {
  const query = (term || '').trim().toLowerCase();
  if (!query) return parties;
  return parties.filter((p) => (p.companyName || '').toLowerCase().includes(query));
};

const normalizeName = (value) => (value || '').trim().toLowerCase();

const parseSerials = (value) => {
  const tokens = (value || '')
    .split(/[\s,;|]+/)
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);

  return Array.from(new Set(tokens));
};

const getWorkspaceCounts = (workspace = {}) => ({
  pdiCount: Number(workspace?.counts?.pdi || 0),
  runningCount: Number(workspace?.counts?.runningOrder || 0),
  barcodeCount: Number(workspace?.counts?.barcode || 0),
  rejectionCount: Number(workspace?.counts?.rejection || 0),
  smtModuleCount: Number(workspace?.counts?.smtModule || 0)
});

const buildWorkspaceComparison = (pdiText, runningOrderText, barcodeText, rejectionText, smtModuleText) => {
  const pdiSet = new Set(parseSerials(pdiText));
  const runningSet = new Set(parseSerials(runningOrderText));
  const barcodeSet = new Set(parseSerials(barcodeText));
  const rejectionSet = new Set(parseSerials(rejectionText));
  const smtSet = new Set(parseSerials(smtModuleText));

  const pdiOnly = Array.from(pdiSet).filter((x) => !runningSet.has(x));
  const runningOnly = Array.from(runningSet).filter((x) => !pdiSet.has(x));
  const barcodeOnly = Array.from(barcodeSet).filter((x) => !pdiSet.has(x));
  const pdiNotInBarcode = Array.from(pdiSet).filter((x) => !barcodeSet.has(x));
  const matchedPdiRunning = Array.from(pdiSet).filter((x) => runningSet.has(x));
  const matchedPdiBarcode = Array.from(pdiSet).filter((x) => barcodeSet.has(x));
  const rejectedAlsoInPdi = Array.from(rejectionSet).filter((x) => pdiSet.has(x));
  const smtNotInPdi = Array.from(smtSet).filter((x) => !pdiSet.has(x));

  return {
    totals: {
      pdi: pdiSet.size,
      running: runningSet.size,
      barcode: barcodeSet.size,
      rejection: rejectionSet.size,
      smtModule: smtSet.size,
      matchedPdiRunning: matchedPdiRunning.length,
      matchedPdiBarcode: matchedPdiBarcode.length,
      rejectedAlsoInPdi: rejectedAlsoInPdi.length
    },
    pdiOnly,
    runningOnly,
    barcodeOnly,
    pdiNotInBarcode,
    smtNotInPdi
  };
};

const PartyReallocationPlanner = () => {
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialCompanyNameFromUrl = (queryParams.get('companyName') || '').trim();
  const initialPartyIdFromUrl = (queryParams.get('partyId') || '').trim();
  const [detailPartyId, setDetailPartyId] = useState(initialPartyIdFromUrl);
  const [detailPartyName, setDetailPartyName] = useState(initialCompanyNameFromUrl);
  const isPartyDetailMode = Boolean(detailPartyId);

  const openPartyDetail = (party) => {
    setDetailPartyId(party.id);
    setDetailPartyName(party.companyName || '');
    setActivePartyId(party.id);
    setPartyDetailTab('cards');
    setActiveBatchId(null);
    setActiveBatchData(null);
    setBatchCompareData(null);
    const newUrl = `${window.location.pathname}?section=party-reallocation&partyId=${encodeURIComponent(party.id)}&companyName=${encodeURIComponent(party.companyName || '')}`;
    window.history.pushState({ partyId: party.id, companyName: party.companyName }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitPartyDetail = () => {
    setDetailPartyId('');
    setDetailPartyName('');
    setPartyPdiList([]);
    setPdiLookupData(null);
    setPdiLookupError('');
    setPartyPdiListError('');
    setPartyNameIdInput('');
    setPartyDetailTab('cards');
    setActualBatches([]);
    setActiveBatchId(null);
    setActiveBatchData(null);
    setBatchCompareData(null);
    const newUrl = `${window.location.pathname}?section=party-reallocation`;
    window.history.pushState({}, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [parties, setParties] = useState([]);
  const [packedPartyIds, setPackedPartyIds] = useState([]);
  const [dispatchPartyIds, setDispatchPartyIds] = useState([]);
  const [packedSearch, setPackedSearch] = useState('');
  const [dispatchSearch, setDispatchSearch] = useState('');
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [partyCardSearch, setPartyCardSearch] = useState('');
  const [activePartyId, setActivePartyId] = useState(initialPartyIdFromUrl);

  // New PDI lookup (mrp.umanerp.com/get/get_pdi_barcodes.php)
  const [pdiIdInput, setPdiIdInput] = useState('');
  const [partyNameIdInput, setPartyNameIdInput] = useState('');
  const [partyPdiListLoading, setPartyPdiListLoading] = useState(false);
  const [partyPdiListError, setPartyPdiListError] = useState('');
  const [partyPdiList, setPartyPdiList] = useState([]);
  const [pdiLookupLoading, setPdiLookupLoading] = useState(false);
  const [pdiLookupError, setPdiLookupError] = useState('');
  const [pdiLookupData, setPdiLookupData] = useState(null);
  const [pdiBarcodeFilter, setPdiBarcodeFilter] = useState('');

  // PDI status (Rays-style summary)
  const [pdiStatusLoading, setPdiStatusLoading] = useState(false);
  const [pdiStatusError, setPdiStatusError] = useState('');
  const [pdiStatusData, setPdiStatusData] = useState(null);
  const [pdiStatusActiveId, setPdiStatusActiveId] = useState('');
  const [statusSearch, setStatusSearch] = useState('');

  // Actual PDI compare
  const [actualFileName, setActualFileName] = useState('');
  const [actualBarcodes, setActualBarcodes] = useState([]);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [savedBarcodesMeta, setSavedBarcodesMeta] = useState(null); // {count, filename, updated_at}
  const [savingBarcodes, setSavingBarcodes] = useState(false);
  const [actualCompareLoading, setActualCompareLoading] = useState(false);
  const [actualCompareError, setActualCompareError] = useState('');
  const [actualCompareData, setActualCompareData] = useState(null);
  const actualFileRef = useRef(null);

  // Party-level Actual PDI batches (multi-PDI: PDI 1, PDI 2, ...)
  const [partyDetailTab, setPartyDetailTab] = useState('cards'); // 'cards' | 'actual'
  const [actualBatches, setActualBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [activeBatchData, setActiveBatchData] = useState(null);
  const [batchCompareLoading, setBatchCompareLoading] = useState(false);
  const [batchCompareError, setBatchCompareError] = useState('');
  const [batchCompareData, setBatchCompareData] = useState(null);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [addBatchName, setAddBatchName] = useState('');
  const [addBatchFile, setAddBatchFile] = useState('');
  const [addBatchBarcodes, setAddBatchBarcodes] = useState([]);
  const [addBatchManual, setAddBatchManual] = useState('');
  const [addBatchSaving, setAddBatchSaving] = useState(false);
  const addBatchFileRef = useRef(null);

  const [pdiCards, setPdiCards] = useState([]);
  const [loadingPdiCards, setLoadingPdiCards] = useState(false);
  const [newPdiCardName, setNewPdiCardName] = useState('');
  const [activePdiKey, setActivePdiKey] = useState('');
  const [partyWorkspaceMap, setPartyWorkspaceMap] = useState({});
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [editorPdi, setEditorPdi] = useState('');
  const [editorRunningOrder, setEditorRunningOrder] = useState('');
  const [editorBarcode, setEditorBarcode] = useState('');
  const [editorRejection, setEditorRejection] = useState('');
  const [editorSmtModule, setEditorSmtModule] = useState('');
  const [editorPdiNumber, setEditorPdiNumber] = useState('');
  const [editorRunningOrderNumber, setEditorRunningOrderNumber] = useState('');
  const [rfidExcelFile, setRfidExcelFile] = useState(null);
  const [uploadingRfid, setUploadingRfid] = useState(false);
  const [rfidRowCount, setRfidRowCount] = useState(0);
  const [rfidUploadedAt, setRfidUploadedAt] = useState('');
  const [workspaceSavedAt, setWorkspaceSavedAt] = useState('');

  const packingNameSet = useMemo(
    () => new Set(VALID_PACKING_PARTY_NAMES.map(normalizeName)),
    []
  );
  const packingIdSet = useMemo(() => new Set(VALID_PACKING_PARTY_IDS), []);

  useEffect(() => {
    const CACHE_KEY = 'pr_parties_cache_v1';
    const SUMMARY_KEY = 'pr_party_summary_cache_v1';

    // Hydrate instantly from localStorage (no spinner wait)
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Array.isArray(cached.parties) && cached.parties.length) {
        setParties(cached.parties);
        setLoadingParties(false);
      }
      const cachedSum = JSON.parse(localStorage.getItem(SUMMARY_KEY) || 'null');
      if (cachedSum && typeof cachedSum === 'object') {
        setPartyWorkspaceMap(cachedSum);
      }
    } catch (_) {}

    const loadParties = async () => {
      // Only show spinner if no cached data on screen
      setParties(prev => {
        if (!prev || prev.length === 0) setLoadingParties(true);
        return prev;
      });
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/ftr/parties-with-pdis`);
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to load parties');
        }
        const list = Array.isArray(data.parties) ? data.parties : [];
        setParties(list);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ parties: list, ts: Date.now() })); } catch (_) {}

        const summaryRes = await fetch(`${API_BASE_URL}/ftr/party-workspace-summaries`);
        const summaryData = await summaryRes.json();
        if (summaryData?.success && summaryData?.summaries) {
          setPartyWorkspaceMap(summaryData.summaries);
          try { localStorage.setItem(SUMMARY_KEY, JSON.stringify(summaryData.summaries)); } catch (_) {}
        }
      } catch (err) {
        // Don't wipe cached list on network error
        setParties(prev => (prev && prev.length ? prev : []));
        if (!parties || parties.length === 0) {
          setError(err.message || 'Unable to load party list');
        }
      } finally {
        setLoadingParties(false);
      }
    };

    loadParties();
  }, []);

  useEffect(() => {
    if (!isPartyDetailMode && !activePartyId && parties.length > 0) {
      setActivePartyId(parties[0].id);
    }
  }, [activePartyId, parties, isPartyDetailMode]);

  // Sync detail mode with browser back/forward
  useEffect(() => {
    const onPop = () => {
      const sp = new URLSearchParams(window.location.search);
      const pid = (sp.get('partyId') || '').trim();
      const cname = (sp.get('companyName') || '').trim();
      setDetailPartyId(pid);
      setDetailPartyName(cname);
      if (pid) setActivePartyId(pid);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const packedOnlyParties = useMemo(
    () => parties.filter((p) => (
      packingIdSet.has(p.id) || packingNameSet.has(normalizeName(p.companyName))
    )),
    [parties, packingIdSet, packingNameSet]
  );

  const packedFiltered = useMemo(
    () => filterBySearch(packedOnlyParties, packedSearch),
    [packedOnlyParties, packedSearch]
  );
  const dispatchFiltered = useMemo(() => filterBySearch(parties, dispatchSearch), [parties, dispatchSearch]);
  const partyCardsFiltered = useMemo(() => filterBySearch(parties, partyCardSearch), [parties, partyCardSearch]);

  const activeParty = useMemo(
    () => parties.find((p) => p.id === activePartyId) || null,
    [activePartyId, parties]
  );

  const comparison = useMemo(
    () => buildWorkspaceComparison(editorPdi, editorRunningOrder, editorBarcode, editorRejection, editorSmtModule),
    [editorPdi, editorRunningOrder, editorBarcode, editorRejection, editorSmtModule]
  );

  useEffect(() => {
    const loadPdiCards = async () => {
      if (!isPartyDetailMode || !activePartyId) return;
      setLoadingPdiCards(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards`);
        const data = await resp.json();
        if (!data?.success) {
          throw new Error(data?.error || 'Unable to load PDI cards');
        }
        const cards = Array.isArray(data.cards) ? data.cards : [];
        setPdiCards(cards);

        if (!activePdiKey && cards.length > 0) {
          setActivePdiKey(cards[0].pdiKey || '');
        }
      } catch (err) {
        setError(err.message || 'Unable to load PDI cards');
      } finally {
        setLoadingPdiCards(false);
      }
    };

    loadPdiCards();
  }, [activePartyId, activePdiKey, isPartyDetailMode]);

  useEffect(() => {
    const loadActiveWorkspace = async () => {
      if (!isPartyDetailMode || !activePartyId || !activePdiKey) return;
      setLoadingWorkspace(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards/${encodeURIComponent(activePdiKey)}`);
        const data = await resp.json();
        if (!data?.success) {
          throw new Error(data?.error || 'Unable to load PDI workspace');
        }
        const ws = data.workspace || {};
        setEditorPdi(ws.pdiSerials || '');
        setEditorRunningOrder(ws.runningOrderSerials || '');
        setEditorBarcode(ws.barcodeSerials || '');
        setEditorRejection(ws.rejectionSerials || '');
        setEditorSmtModule(ws.smtModuleSerials || '');
        setEditorPdiNumber(ws.pdiNumber || activePdiKey);
        setEditorRunningOrderNumber(ws.runningOrderNumber || '');
        setRfidRowCount(Number(ws.rfidRowCount || 0));
        setRfidUploadedAt(ws.rfidUploadedAt || '');
        setRfidExcelFile(null);
        setWorkspaceSavedAt(ws.updatedAt || '');
      } catch (err) {
        setError(err.message || 'Unable to load PDI workspace');
      } finally {
        setLoadingWorkspace(false);
      }
    };

    loadActiveWorkspace();
  }, [activePartyId, activePdiKey, isPartyDetailMode]);

  useEffect(() => {
    // Keep only valid packed-party selections when list changes.
    setPackedPartyIds((prev) => prev.filter((id) => packedOnlyParties.some((p) => p.id === id)));
  }, [packedOnlyParties]);

  const togglePacked = (id) => {
    setPackedPartyIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const toggleDispatch = (id) => {
    setDispatchPartyIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const selectAllPackedFiltered = () => {
    setPackedPartyIds((prev) => {
      const next = new Set(prev);
      packedFiltered.forEach((p) => next.add(p.id));
      return Array.from(next);
    });
  };

  const selectAllDispatchFiltered = () => {
    setDispatchPartyIds((prev) => {
      const next = new Set(prev);
      dispatchFiltered.forEach((p) => next.add(p.id));
      return Array.from(next);
    });
  };

  const openPartyWorkspace = (partyId) => {
    const url = `${window.location.pathname}?section=party-reallocation&partyId=${encodeURIComponent(partyId)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const fetchAllPdisForParty = async (partyNameIdValue = partyNameIdInput) => {
    const partyNameId = String(partyNameIdValue || '').trim();
    if (!partyNameId) {
      setPartyPdiListError('party_name_id missing');
      return;
    }

    setPartyNameIdInput(partyNameId);
    setPartyPdiListLoading(true);
    setPartyPdiListError('');
    setPartyPdiList([]);
    setPdiLookupError('');
    setPdiLookupData(null);

    try {
      const resp = await fetch(`${API_BASE_URL}/ftr/mrp-party-pdis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ party_name_id: partyNameId })
      });
      const data = await resp.json();
      if (!resp.ok || data?.status !== 'success') {
        throw new Error(data?.message || data?.error || 'Failed to fetch PDIs for this party');
      }
      const list = Array.isArray(data?.data) ? data.data : [];
      setPartyPdiList(list);
      if (!list.length) {
        setPartyPdiListError('No PDI found for this party_name_id');
      }
    } catch (err) {
      setPartyPdiListError(err.message || 'Failed to fetch PDIs for this party');
    } finally {
      setPartyPdiListLoading(false);
    }
  };

  // Auto-load PDIs only when this tab was opened with ?partyId=... (detail mode)
  useEffect(() => {
    if (!isPartyDetailMode) return;
    if (!activePartyId) return;
    if (partyNameIdInput === activePartyId) return;
    fetchAllPdisForParty(activePartyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartyDetailMode, activePartyId]);

  const fetchPdiBarcodesById = async (pdiIdValue) => {
    const pdiId = String(pdiIdValue || '').trim();
    if (!pdiId) {
      setPdiLookupError('Please enter a PDI ID');
      return;
    }
    setPdiIdInput(pdiId);
    setPdiLookupLoading(true);
    setPdiLookupError('');
    setPdiLookupData(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/ftr/mrp-pdi-barcodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdi_id: pdiId })
      });
      const data = await resp.json();
      if (!resp.ok || data?.status !== 'success') {
        throw new Error(data?.message || data?.error || 'Failed to fetch PDI barcodes');
      }
      setPdiLookupData({
        pdiId,
        pdiName: data?.pdi_details?.pdi_name || '',
        wattage: data?.pdi_details?.wattage || '',
        quantity: Number(data?.pdi_details?.quantity || 0),
        barcodeCount: Number(data?.barcode_count || 0),
        barcodes: Array.isArray(data?.barcodes) ? data.barcodes : []
      });
    } catch (err) {
      setPdiLookupError(err.message || 'Failed to fetch PDI barcodes');
    } finally {
      setPdiLookupLoading(false);
    }
  };

  // Fetch barcodes from MRP using just the PDI ID
  const fetchPdiBarcodesFromMrp = async () => {
    await fetchPdiBarcodesById(pdiIdInput);
  };

  // Fetch full Rays-style status for a PDI (bulk party-dispatch history intersection)
  const fetchPdiStatus = async (pdiIdValue, opts = {}) => {
    const pid = String(pdiIdValue || '').trim();
    if (!pid) return;
    const partyId = detailPartyId || activePartyId;
    if (!partyId) {
      setPdiStatusError('Party ID missing');
      return;
    }
    setPdiStatusActiveId(pid);
    setPdiStatusLoading(true);
    setPdiStatusError('');
    setPdiStatusData(null);
    // Reset previous PDI's barcode state when switching cards
    setActualBarcodes([]);
    setActualFileName('');
    setManualBarcodeInput('');
    setActualCompareData(null);
    setSavedBarcodesMeta(null);
    try {
      const forceParam = opts.force ? '&force=1' : '';
      const resp = await fetch(`${API_BASE_URL}/ftr/pdi-status/${encodeURIComponent(pid)}?party_id=${encodeURIComponent(partyId)}${forceParam}`);
      const raw = await resp.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (e) {
        data = null;
      }
      if (!resp.ok || !data?.success) {
        // Nginx/Passenger 502 pages are HTML, not JSON.
        if (!data) {
          throw new Error(`PDI status API failed (${resp.status}). Server returned non-JSON response.`);
        }
        throw new Error(data?.error || 'Failed to fetch PDI status');
      }
      setPdiStatusData(data);
      // Auto-load previously saved actual barcodes for this PDI (independent of card)
      try {
        const sr = await fetch(`${API_BASE_URL}/ftr/actual-pdi-barcodes/${encodeURIComponent(pid)}`);
        const savedRaw = await sr.text();
        let sj = null;
        try {
          sj = savedRaw ? JSON.parse(savedRaw) : null;
        } catch (e) {
          sj = null;
        }
        if (sr.ok && sj?.success && sj.exists) {
          const bcs = sj.barcodes || [];
          setActualBarcodes(bcs);
          setActualFileName(sj.filename || '');
          setSavedBarcodesMeta({
            count: sj.count || bcs.length,
            filename: sj.filename || '',
            updated_at: sj.updated_at || sj.uploaded_at || ''
          });
          // Auto-run compare so summary + RO breakdown show actual-vs-plan immediately
          if (bcs.length) {
            const partyNameAuto = sj.party_name || detailPartyName || (parties.find((p) => p.id === partyId) || {}).companyName || '';
            runActualCompareWith(pid, partyId, partyNameAuto, bcs);
          }
        }
      } catch (e) { /* ignore — saved load is optional */ }
    } catch (err) {
      setPdiStatusError(err.message || 'Failed to fetch PDI status');
    } finally {
      setPdiStatusLoading(false);
    }
  };

  // Save actual barcodes to DB (independent of card — pdi_id used only as key)
  const persistActualBarcodes = async (pdiId, partyName, barcodes, filename) => {
    if (!pdiId || !barcodes?.length) return;
    setSavingBarcodes(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/ftr/actual-pdi-barcodes/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdi_id: pdiId,
          party_name: partyName || '',
          filename: filename || '',
          barcodes
        })
      });
      const j = await resp.json();
      if (resp.ok && j?.success) {
        setSavedBarcodesMeta({
          count: j.count,
          filename: filename || '',
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) { /* ignore — save is best-effort */ }
    finally { setSavingBarcodes(false); }
  };

  const closePdiStatus = () => {
    setPdiStatusActiveId('');
    setPdiStatusData(null);
    setPdiStatusError('');
    setActualCompareData(null);
    setActualCompareError('');
    setActualBarcodes([]);
    setActualFileName('');
    setManualBarcodeInput('');
    setSavedBarcodesMeta(null);
  };

  // ---- Actual PDI upload + compare ----
  const handleActualFile = async (file) => {
    if (!file) return;
    setActualCompareError('');
    setActualCompareData(null);
    setActualFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
      // Flatten all cells, pick candidates that look like serial numbers
      const bag = new Set();
      for (const row of rows) {
        for (const cell of row) {
          const v = String(cell || '').trim();
          if (v && v.length >= 6 && /^[A-Za-z0-9\-_/]+$/.test(v)) {
            bag.add(v.toUpperCase());
          }
        }
      }
      // If there's a column named "serial" / "barcode", prefer that
      if (rows.length > 1) {
        const header = rows[0].map((h) => String(h || '').toLowerCase().trim());
        const col = header.findIndex((h) => h === 'serial' || h === 'serial_number' || h === 'barcode' || h === 'module_id' || h === 'module' || h === 'sr no');
        if (col >= 0) {
          bag.clear();
          for (let i = 1; i < rows.length; i++) {
            const v = String(rows[i][col] || '').trim();
            if (v) bag.add(v.toUpperCase());
          }
        }
      }
      setActualBarcodes(Array.from(bag));
    } catch (err) {
      setActualCompareError('Failed to parse file: ' + (err.message || err));
    }
  };

  const runActualCompareWith = async (pdiId, partyId, partyName, combined) => {
    if (!pdiId || !partyId || !combined?.length) return;
    setActualCompareLoading(true);
    setActualCompareError('');
    setActualCompareData(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/ftr/pdi-actual-compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdi_id: pdiId,
          party_id: partyId,
          party_name: partyName || '',
          actual_barcodes: combined
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Compare failed');
      }
      setActualCompareData(data);
      return data;
    } catch (err) {
      setActualCompareError(err.message || 'Compare failed');
    } finally {
      setActualCompareLoading(false);
    }
  };

  const runActualCompare = async () => {
    if (!pdiStatusActiveId) {
      setActualCompareError('Select a PDI first');
      return;
    }
    const partyId = detailPartyId || activePartyId;
    if (!partyId) {
      setActualCompareError('Party ID missing');
      return;
    }
    const manualParsed = parseSerials(manualBarcodeInput);
    const combined = Array.from(new Set([...actualBarcodes, ...manualParsed]));
    if (!combined.length) {
      setActualCompareError('Please add barcodes first — upload a file or paste them manually.');
      return;
    }
    const partyNameForRun = detailPartyName || (parties.find((p) => p.id === partyId) || {}).companyName || '';
    const data = await runActualCompareWith(pdiStatusActiveId, partyId, partyNameForRun, combined);
    if (data) {
      persistActualBarcodes(pdiStatusActiveId, partyNameForRun, combined, actualFileName);
    }
  };

  // ============================================================
  // Actual PDI BATCHES (party-level multi-PDI: PDI 1, PDI 2, ...)
  // ============================================================
  const loadActualBatches = async (partyId) => {
    if (!partyId) return;
    setLoadingBatches(true);
    try {
      const r = await fetch(`${API_BASE_URL}/ftr/actual-pdi-batches/${encodeURIComponent(partyId)}`);
      const j = await r.json();
      if (r.ok && j?.success) {
        setActualBatches(j.batches || []);
      } else {
        setActualBatches([]);
      }
    } catch (e) { setActualBatches([]); }
    finally { setLoadingBatches(false); }
  };

  // Excel/CSV → array of barcode strings (same logic as handleActualFile)
  const parseExcelToBarcodes = async (file) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
    const bag = new Set();
    for (const row of rows) {
      for (const cell of row) {
        const v = String(cell || '').trim();
        if (v && v.length >= 6 && /^[A-Za-z0-9\-_/]+$/.test(v)) {
          bag.add(v.toUpperCase());
        }
      }
    }
    if (rows.length > 1) {
      const header = rows[0].map((h) => String(h || '').toLowerCase().trim());
      const col = header.findIndex((h) => h === 'serial' || h === 'serial_number' || h === 'barcode' || h === 'module_id' || h === 'module' || h === 'sr no');
      if (col >= 0) {
        bag.clear();
        for (let i = 1; i < rows.length; i++) {
          const v = String(rows[i][col] || '').trim();
          if (v) bag.add(v.toUpperCase());
        }
      }
    }
    return Array.from(bag);
  };

  const handleAddBatchFile = async (file) => {
    if (!file) return;
    setAddBatchFile(file.name);
    try {
      const bcs = await parseExcelToBarcodes(file);
      setAddBatchBarcodes(bcs);
    } catch (e) {
      alert('File parse error: ' + (e.message || e));
    }
  };

  const resetAddBatchForm = () => {
    setShowAddBatch(false);
    setAddBatchName('');
    setAddBatchFile('');
    setAddBatchBarcodes([]);
    setAddBatchManual('');
  };

  const submitAddBatch = async () => {
    const partyId = detailPartyId;
    if (!partyId) return;
    const combined = Array.from(new Set([...addBatchBarcodes, ...parseSerials(addBatchManual)]));
    if (!combined.length) {
      alert('Please add barcodes first (upload a file or paste manually).');
      return;
    }
    setAddBatchSaving(true);
    try {
      const r = await fetch(`${API_BASE_URL}/ftr/actual-pdi-batches/${encodeURIComponent(partyId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_name: detailPartyName || '',
          batch_name: addBatchName.trim() || null,
          filename: addBatchFile || null,
          barcodes: combined
        })
      });
      const j = await r.json();
      if (!r.ok || !j?.success) throw new Error(j?.error || 'Save failed');
      resetAddBatchForm();
      await loadActualBatches(partyId);
      // auto-open new batch
      if (j.id) openBatch(j.id);
    } catch (e) {
      alert('Save failed: ' + (e.message || e));
    } finally {
      setAddBatchSaving(false);
    }
  };

  const deleteBatch = async (batchId) => {
    if (!detailPartyId || !batchId) return;
    if (!window.confirm('Yeh PDI batch delete kar dein?')) return;
    try {
      await fetch(`${API_BASE_URL}/ftr/actual-pdi-batches/${encodeURIComponent(detailPartyId)}/${batchId}`, { method: 'DELETE' });
      if (activeBatchId === batchId) {
        setActiveBatchId(null);
        setActiveBatchData(null);
        setBatchCompareData(null);
      }
      await loadActualBatches(detailPartyId);
    } catch (e) { alert('Delete failed: ' + (e.message || e)); }
  };

  const openBatch = async (batchId) => {
    if (!detailPartyId || !batchId) return;
    setActiveBatchId(batchId);
    setActiveBatchData(null);
    setBatchCompareData(null);
    setBatchCompareError('');
    setBatchCompareLoading(true);
    try {
      // Fetch batch barcodes
      const br = await fetch(`${API_BASE_URL}/ftr/actual-pdi-batches/${encodeURIComponent(detailPartyId)}/${batchId}`);
      const bj = await br.json();
      if (!br.ok || !bj?.success) throw new Error(bj?.error || 'Batch fetch failed');
      setActiveBatchData(bj);
      // Run compare
      const cr = await fetch(`${API_BASE_URL}/ftr/actual-pdi-batch-compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_id: detailPartyId,
          party_name: detailPartyName || bj.party_name || '',
          barcodes: bj.barcodes || []
        })
      });
      const cj = await cr.json();
      if (!cr.ok || !cj?.success) throw new Error(cj?.error || 'Compare failed');
      setBatchCompareData(cj);
    } catch (e) {
      setBatchCompareError(e.message || 'Failed');
    } finally {
      setBatchCompareLoading(false);
    }
  };

  const closeBatch = () => {
    setActiveBatchId(null);
    setActiveBatchData(null);
    setBatchCompareData(null);
    setBatchCompareError('');
  };

  // Auto-load batches when party detail opens or tab switches to 'actual'
  useEffect(() => {
    if (detailPartyId && partyDetailTab === 'actual') {
      loadActualBatches(detailPartyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailPartyId, partyDetailTab]);

  const downloadSerialsCsv = (name, serials) => {
    if (!serials || !serials.length) return;
    const blob = new Blob(['serial\n' + serials.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Single-button complete Excel report for a PDI card (multi-sheet).
  // Sheets: Summary, Dispatched, Packed, Not Packed (Pending)
  const downloadCompleteCardReport = () => {
    if (!pdiStatusData) return;
    const pdi = pdiStatusData.pdi || {};
    const sum = pdiStatusData.summary || {};
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryRows = [
      ['PDI Card Report'],
      [],
      ['PDI Name', pdi.name || ''],
      ['PDI ID', pdi.id || ''],
      ['Wattage', pdi.wattage || ''],
      ['Plan Quantity', pdi.quantity || 0],
      ['Total kW', pdi.total_kw || 0],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['Metric', 'Count', '%'],
      ['Total Produced (MRP)', sum.total_barcodes || 0, '100%'],
      ['Dispatched', sum.dispatched || 0, `${sum.dispatched_percent || 0}%`],
      ['Packed (not dispatched)', sum.packed || 0, `${sum.packed_percent || 0}%`],
      ['Not Packed (Pending)', sum.pending || 0, `${sum.pending_percent || 0}%`]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Sheet 2: Dispatched (with vehicle/date/invoice if available)
    const dispatchedSerials = pdiStatusData.all_dispatched || [];
    const dispMap = {};
    (pdiStatusData.dispatch_groups || []).forEach((g) => {
      (g.serials || []).forEach((s) => {
        dispMap[s] = {
          vehicle: g.vehicle_no || '',
          date: g.dispatch_date || '',
          invoice: g.invoice_no || '',
          dispatch_party: g.dispatch_party || ''
        };
      });
    });
    const dispRows = [['Serial Number', 'Vehicle No', 'Dispatch Date', 'Invoice No', 'Dispatch Party']];
    dispatchedSerials.forEach((s) => {
      const m = dispMap[s] || {};
      dispRows.push([s, m.vehicle || '', m.date || '', m.invoice || '', m.dispatch_party || '']);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(dispRows);
    ws2['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, ws2, `Dispatched (${dispatchedSerials.length})`);

    // Sheet 3: Packed (with pallet info if available)
    const packedSerials = pdiStatusData.all_packed || [];
    const packMap = {};
    (pdiStatusData.pallet_groups || pdiStatusData.packed_groups || []).forEach((g) => {
      (g.serials || []).forEach((s) => {
        packMap[s] = {
          pallet: g.pallet_no || '',
          vehicle: g.vehicle_no || '',
          date: g.packing_date || g.dispatch_date || ''
        };
      });
    });
    const packRows = [['Serial Number', 'Pallet No', 'Vehicle No', 'Date']];
    packedSerials.forEach((s) => {
      const m = packMap[s] || {};
      packRows.push([s, m.pallet || '', m.vehicle || '', m.date || '']);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(packRows);
    ws3['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, `Packed (${packedSerials.length})`);

    // Sheet 4: Not Packed (Pending)
    const pendingSerials = pdiStatusData.all_pending || [];
    const pendRows = [['Serial Number']];
    pendingSerials.forEach((s) => pendRows.push([s]));
    const ws4 = XLSX.utils.aoa_to_sheet(pendRows);
    ws4['!cols'] = [{ wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws4, `Not Packed (${pendingSerials.length})`);

    const fname = `PDI-${pdi.id || 'report'}-${(pdi.name || '').replace(/[^A-Za-z0-9_-]+/g, '_')}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fname);
  };

  const downloadPdiBarcodesCsv = () => {
    if (!pdiLookupData || !pdiLookupData.barcodes.length) return;
    const header = 'barcode\n';
    const body = pdiLookupData.barcodes.join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdi_${pdiLookupData.pdiId}_barcodes.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyPdiBarcodesToClipboard = async () => {
    if (!pdiLookupData || !pdiLookupData.barcodes.length) return;
    try {
      await navigator.clipboard.writeText(pdiLookupData.barcodes.join('\n'));
    } catch (e) {
      // ignore clipboard failures
    }
  };

  const createNewPdiCard = async () => {
    if (!activePartyId) return;

    const key = (newPdiCardName || '').trim();
    if (!key) {
      setError('PDI card name required. Example: 1 or PDI-1');
      return;
    }

    const selectedParty = parties.find((p) => p.id === activePartyId);

    try {
      const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: selectedParty?.companyName || '',
          pdiNumber: key,
          runningOrderNumber: '',
          pdiSerials: '',
          runningOrderSerials: '',
          barcodeSerials: '',
          rejectionSerials: '',
          smtModuleSerials: ''
        })
      });
      const data = await resp.json();
      if (!data?.success) {
        throw new Error(data?.error || 'Unable to create PDI card');
      }

      setPdiCards((prev) => {
        const exists = prev.some((x) => (x.pdiKey || '') === key);
        if (exists) return prev;
        return [{
          pdiKey: key,
          pdiNumber: key,
          runningOrderNumber: '',
          counts: { pdi: 0, runningOrder: 0, barcode: 0, rejection: 0, smtModule: 0 },
          rfidRowCount: 0,
          updatedAt: null
        }, ...prev];
      });
      setActivePdiKey(key);
      setEditorPdi('');
      setEditorRunningOrder('');
      setEditorBarcode('');
      setEditorRejection('');
      setEditorSmtModule('');
      setEditorPdiNumber(key);
      setEditorRunningOrderNumber('');
      setRfidRowCount(0);
      setRfidUploadedAt('');
      setWorkspaceSavedAt('');
      setNewPdiCardName('');
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to create PDI card');
    }
  };

  const savePartyWorkspace = async () => {
    if (!activePartyId || !activePdiKey) {
      setError('Create or select a PDI card first.');
      return;
    }

    const selectedParty = parties.find((p) => p.id === activePartyId);
    if (!editorPdiNumber.trim() || !editorRunningOrderNumber.trim()) {
      setError('PDI Number and Running Order Number are required before save.');
      return;
    }
    setSavingWorkspace(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards/${encodeURIComponent(activePdiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: selectedParty?.companyName || '',
          pdiKey: activePdiKey,
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          pdiSerials: editorPdi,
          runningOrderSerials: editorRunningOrder,
          barcodeSerials: editorBarcode,
          rejectionSerials: editorRejection,
          smtModuleSerials: editorSmtModule
        })
      });
      const data = await resp.json();
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to save party data');
      }

      const now = new Date().toISOString();
      setWorkspaceSavedAt(now);
      setPdiCards((prev) => prev.map((card) => {
        if ((card.pdiKey || '') !== activePdiKey) return card;
        return {
          ...card,
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          rfidRowCount,
          rfidUploadedAt,
          counts: data.counts || card.counts,
          updatedAt: now
        };
      }));
      setPartyWorkspaceMap((prev) => ({
        ...prev,
        [activePartyId]: {
          partyName: selectedParty?.companyName || '',
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          rfidRowCount,
          rfidUploadedAt,
          counts: data.counts || {
            pdi: 0,
            runningOrder: 0,
            barcode: 0,
            rejection: 0,
            smtModule: 0
          },
          updatedAt: now
        }
      }));
    } catch (err) {
      setError(err.message || 'Failed to save party data');
    } finally {
      setSavingWorkspace(false);
    }
  };

  const clearActivePartyWorkspace = () => {
    if (!activePartyId) return;
    setEditorPdi('');
    setEditorRunningOrder('');
    setEditorBarcode('');
    setEditorRejection('');
    setEditorSmtModule('');
    setEditorPdiNumber('');
    setEditorRunningOrderNumber('');
    setRfidExcelFile(null);
    setRfidRowCount(0);
    setRfidUploadedAt('');
    setWorkspaceSavedAt('');
  };

  const uploadRfidExcel = async () => {
    if (!activePartyId || !activePdiKey) {
      setError('Create or select a PDI card first.');
      return;
    }
    if (!rfidExcelFile) {
      setError('Please select RFID Excel file first.');
      return;
    }

    setUploadingRfid(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', rfidExcelFile);

      const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards/${encodeURIComponent(activePdiKey)}/upload-rfid-excel`, {
        method: 'POST',
        body: form
      });
      const data = await resp.json();
      if (!data?.success) {
        if (Array.isArray(data?.missingColumns) && data.missingColumns.length) {
          throw new Error(`Missing RFID columns: ${data.missingColumns.join(', ')}`);
        }
        throw new Error(data?.error || 'RFID upload failed');
      }

      const now = new Date().toISOString();
      setRfidRowCount(Number(data.rfidRows || 0));
      setRfidUploadedAt(now);
      setRfidExcelFile(null);
      setEditorBarcode((prev) => prev);
      setPdiCards((prev) => prev.map((card) => {
        if ((card.pdiKey || '') !== activePdiKey) return card;
        return {
          ...card,
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          rfidRowCount: Number(data.rfidRows || 0),
          counts: {
            ...(card.counts || {}),
            barcode: Number(data.barcodeCount || 0)
          },
          updatedAt: now
        };
      }));

      setPartyWorkspaceMap((prev) => ({
        ...prev,
        [activePartyId]: {
          ...(prev[activePartyId] || {}),
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          rfidRowCount: Number(data.rfidRows || 0),
          rfidUploadedAt: now,
          counts: {
            ...((prev[activePartyId] || {}).counts || {}),
            barcode: Number(data.barcodeCount || 0)
          }
        }
      }));
    } catch (err) {
      setError(err.message || 'RFID upload failed');
    } finally {
      setUploadingRfid(false);
    }
  };

  const runAnalysis = async () => {
    if (packedPartyIds.length === 0 || dispatchPartyIds.length === 0) {
      setError('Please select at least one packed party and one dispatch party.');
      return;
    }

    setLoadingAnalysis(true);
    setError('');
    setAnalysis(null);

    try {
      const packedSelections = parties.filter((p) => packedPartyIds.includes(p.id));
      const dispatchSelections = parties.filter((p) => dispatchPartyIds.includes(p.id));

      const packedSummaries = await Promise.all(
        packedSelections.map(async (party) => {
          const resp = await fetch(`${API_BASE_URL}/ftr/packing-count-by-party/${party.id}`);
          const data = await resp.json();
          if (!data.success) {
            throw new Error(data.error || `Unable to fetch packing count for ${party.companyName}`);
          }
          return {
            partyId: party.id,
            partyName: party.companyName,
            packingCount: Number(data.packing_count || 0)
          };
        })
      );

      const dispatchSummaries = await Promise.all(
        dispatchSelections.map(async (party) => {
          const resp = await fetch(
            `${API_BASE_URL}/ftr/dispatch-by-party/${party.id}?name=${encodeURIComponent(party.companyName || '')}`
          );
          const data = await resp.json();
          if (!data.success) {
            throw new Error(data.error || `Unable to fetch dispatch data for ${party.companyName}`);
          }
          return {
            partyId: party.id,
            partyName: party.companyName,
            dispatchCount: Number(data?.summary?.dispatched || 0),
            vehicleGroups: (data.dispatch_groups || []).length,
            palletGroups: (data.pallet_groups || []).length
          };
        })
      );

      const rows = [];
      packedSummaries.forEach((packed) => {
        dispatchSummaries.forEach((dispatch) => {
          rows.push({
            packedPartyName: packed.partyName,
            packedPartyId: packed.partyId,
            packedCount: packed.packingCount,
            dispatchPartyName: dispatch.partyName,
            dispatchPartyId: dispatch.partyId,
            dispatchCount: dispatch.dispatchCount,
            status: packed.packingCount > 0 ? 'Possible' : 'No packed modules found'
          });
        });
      });

      setAnalysis({
        packedSummaries,
        dispatchSummaries,
        rows,
        totalPackedCount: packedSummaries.reduce((sum, x) => sum + x.packingCount, 0),
        totalDispatchedCount: dispatchSummaries.reduce((sum, x) => sum + x.dispatchCount, 0)
      });
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="party-reallocation-planner">
      {/* PWA / mobile branded top bar */}
      <div className="gs-topbar show-in-pwa show-on-mobile">
        <div className="gs-topbar-brand">
          <div className="gs-logo">GS</div>
          <div className="gs-topbar-text">
            <h1>Gautam Solar</h1>
            <span>Party Reallocation</span>
          </div>
        </div>
      </div>

      <div className="planner-header hide-in-pwa hide-on-mobile">
        <h1>Dynamic Party Reallocation Planner</h1>
        <p>
          Read-only analysis dashboard: select packed party and dispatch party dynamically.
          The existing Dispatch Tracker logic remains unchanged.
        </p>
      </div>

      <div className="planner-card workspace-card">
        <div className="workspace-header-row">
          <h2>Automatic Party to PDI Cards</h2>
          <small>Source: umanmrp.in/get_all_pdi.php + mrp.umanerp.com/get_pdi_barcodes.php</small>
        </div>

        {!isPartyDetailMode && (
          <div className="workspace-editor-grid">
            <div className="workspace-field">
              <label>Search Party</label>
              <input
                type="text"
                value={partyCardSearch}
                onChange={(e) => setPartyCardSearch(e.target.value)}
                placeholder="Search by party name"
              />
            </div>
          </div>
        )}

        {loadingParties && !isPartyDetailMode && <p className="info">Loading parties...</p>}
        {error && <p className="error">{error}</p>}

        {!isPartyDetailMode && (
          <div className="party-cards-grid">
            {partyCardsFiltered.map((party) => (
              <button
                type="button"
                key={`party-auto-${party.id}`}
                className="party-card-btn party-card-clickable"
                onClick={() => openPartyDetail(party)}
              >
                <div className="party-card-avatar">{(party.companyName || '?').charAt(0).toUpperCase()}</div>
                <div className="party-card-body">
                  <h4>{party.companyName}</h4>
                  <div className="party-card-stats">
                    <span>{party.pdiCount || 0} PDI</span>
                  </div>
                </div>
                <span className="party-card-arrow">&rsaquo;</span>
              </button>
            ))}
            {!partyCardsFiltered.length && !loadingParties && (
              <p className="info">No parties match your search.</p>
            )}
          </div>
        )}

        {isPartyDetailMode && (
          <div className="party-detail-header">
            <button type="button" className="back-btn" onClick={exitPartyDetail}>
              &larr; Back to Parties
            </button>
            <div className="party-detail-title">
              <h3>{(activeParty && activeParty.companyName) || detailPartyName || 'Selected Party'}</h3>
              <p><strong>Party ID:</strong> {detailPartyId}</p>
            </div>
            <div className="party-detail-tabs">
              <button
                type="button"
                className={`tab-btn ${partyDetailTab === 'cards' ? 'active' : ''}`}
                onClick={() => { setPartyDetailTab('cards'); }}
              >
                📋 PDI Cards
              </button>
              <button
                type="button"
                className={`tab-btn ${partyDetailTab === 'actual' ? 'active' : ''}`}
                onClick={() => { setPartyDetailTab('actual'); closePdiStatus(); }}
              >
                📤 Actual PDIs
              </button>
            </div>
          </div>
        )}

        {partyDetailTab === 'cards' && partyPdiListLoading && <p className="info">Loading PDIs for selected party...</p>}
        {partyDetailTab === 'cards' && partyPdiListError && <p className="error">{partyPdiListError}</p>}

        {partyDetailTab === 'cards' && partyPdiList.length > 0 && !pdiStatusActiveId && (
          <div className="workspace-editor">
            <div className="workspace-editor-header">
              <h3>{partyPdiList[0]?.party_name || 'Selected Party'} - PDI Cards</h3>
              <p><strong>Total PDIs:</strong> {partyPdiList.length}</p>
            </div>
            <div className="party-cards-grid">
              {partyPdiList.map((item) => (
                <button
                  type="button"
                  key={`party-pdi-${item.id}`}
                  className={`party-card-btn party-card-clickable ${String(pdiStatusActiveId || '') === String(item.id) ? 'active' : ''}`}
                  onClick={() => fetchPdiStatus(item.id)}
                >
                  <div className="party-card-avatar pdi-avatar">PDI</div>
                  <div className="party-card-body">
                    <h4>{item.pdi_name || `PDI ${item.id}`}</h4>
                    <div className="party-card-stats">
                      <span>ID: {item.id}</span>
                    </div>
                  </div>
                  <span className="party-card-arrow">&rsaquo;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {partyDetailTab === 'cards' && pdiStatusLoading && (
          <div className="pdi-status-loading">
            <div className="spinner" />
            <p>Loading PDI status... party dispatch history ek hi API call me aa rahi hai.</p>
          </div>
        )}
        {partyDetailTab === 'cards' && pdiStatusError && <p className="error">{pdiStatusError}</p>}

        {partyDetailTab === 'cards' && pdiStatusData && (
          <div className="pdi-status-panel">
            <div className="pdi-status-header">
              <div>
                <h3>{pdiStatusData.pdi?.name || `PDI ${pdiStatusData.pdi?.id}`}</h3>
                <p>
                  <strong>PDI ID:</strong> {pdiStatusData.pdi?.id} &nbsp;|&nbsp;
                  <strong>Wattage:</strong> {pdiStatusData.pdi?.wattage || '-'}W &nbsp;|&nbsp;
                  <strong>Plan Qty:</strong> {pdiStatusData.pdi?.quantity} &nbsp;|&nbsp;
                  <strong>Total kW:</strong> {pdiStatusData.pdi?.total_kw || 0}
                </p>
              </div>
              <button type="button" className="back-btn" onClick={closePdiStatus}>Close</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0', gap: 8, alignItems: 'center' }}>
              {pdiStatusData.cached && (
                <span style={{ fontSize: 12, color: '#666' }}>⚡ cached — click refresh for latest</span>
              )}
              <button
                type="button"
                className="back-btn"
                onClick={() => fetchPdiStatus(pdiStatusActiveId, { force: true })}
                disabled={pdiStatusLoading}
                title="Bypass cache and re-check every barcode against MRP now"
              >
                {pdiStatusLoading ? 'Refreshing…' : '↻ Refresh latest'}
              </button>
            </div>

            <div className="status-cards-grid">
              <div className="status-card status-total">
                <div className="status-card-label">Total Produced</div>
                <div className="status-card-value">{pdiStatusData.summary?.total_barcodes || 0}</div>
                <div className="status-card-sub">Barcodes from MRP</div>
              </div>
              <div className="status-card status-dispatched">
                <div className="status-card-label">Dispatched</div>
                <div className="status-card-value">{pdiStatusData.summary?.dispatched || 0}</div>
                <div className="status-card-sub">{pdiStatusData.summary?.dispatched_percent || 0}%</div>
              </div>
              <div className="status-card status-packed">
                <div className="status-card-label">Packed (not dispatched)</div>
                <div className="status-card-value">{pdiStatusData.summary?.packed || 0}</div>
                <div className="status-card-sub">{pdiStatusData.summary?.packed_percent || 0}%</div>
              </div>
              <div className="status-card status-pending">
                <div className="status-card-label">Not Packed</div>
                <div className="status-card-value">{pdiStatusData.summary?.pending || 0}</div>
                <div className="status-card-sub">{pdiStatusData.summary?.pending_percent || 0}%</div>
              </div>
              <div className="status-card status-tracked">
                <div className="status-card-label">Party Universe</div>
                <div className="status-card-value">{pdiStatusData.summary?.party_dispatch_universe || 0}</div>
                <div className="status-card-sub">All party dispatched</div>
              </div>
            </div>

            {pdiStatusData.summary?.pack_skipped_due_to_cap > 0 && (
              <p className="info">
                Note: {pdiStatusData.summary.pack_skipped_due_to_cap} barcodes were skipped during packing check (cap {pdiStatusData.summary.pack_check_capped_at}). For exact packed count, pass <code>?pack_cap=10000</code>.
              </p>
            )}

            <div className="status-progress">
              <div className="status-progress-fill dispatched" style={{ width: `${pdiStatusData.summary?.dispatched_percent || 0}%` }} title={`Dispatched ${pdiStatusData.summary?.dispatched_percent || 0}%`} />
              <div className="status-progress-fill packed" style={{ width: `${pdiStatusData.summary?.packed_percent || 0}%` }} title={`Packed ${pdiStatusData.summary?.packed_percent || 0}%`} />
              <div className="status-progress-fill pending" style={{ width: `${pdiStatusData.summary?.pending_percent || 0}%` }} title={`Pending ${pdiStatusData.summary?.pending_percent || 0}%`} />
            </div>

            <div className="status-toolbar">
              <input
                type="text"
                placeholder="Search barcode / vehicle / pallet..."
                value={statusSearch}
                onChange={(e) => setStatusSearch(e.target.value)}
              />
              <button
                type="button"
                className="primary"
                onClick={downloadCompleteCardReport}
                title="Single Excel file with Summary, Dispatched, Packed, Not Packed sheets"
              >
                📊 Download Complete Report (Excel)
              </button>
              <button type="button" onClick={() => downloadSerialsCsv(`pdi-${pdiStatusData.pdi?.id}-dispatched`, pdiStatusData.all_dispatched)}>Dispatched CSV</button>
              <button type="button" onClick={() => downloadSerialsCsv(`pdi-${pdiStatusData.pdi?.id}-packed`, pdiStatusData.all_packed)}>Packed CSV</button>
              <button type="button" onClick={() => downloadSerialsCsv(`pdi-${pdiStatusData.pdi?.id}-pending`, pdiStatusData.all_pending)}>Pending CSV</button>
            </div>

            <div className="status-tables hide-on-mobile">
              <div className="status-table-block">
                <h4>Dispatch Vehicles ({(pdiStatusData.dispatch_groups || []).length})</h4>
                <div className="status-table-scroll">
                  <table>
                    <thead><tr><th>Vehicle</th><th>Date</th><th>Invoice</th><th>Modules</th><th>Pallets</th></tr></thead>
                    <tbody>
                      {(pdiStatusData.dispatch_groups || [])
                        .filter((g) => !statusSearch || JSON.stringify(g).toLowerCase().includes(statusSearch.toLowerCase()))
                        .map((g) => (
                        <tr key={`v-${g.vehicle_no}-${g.dispatch_date}-${g.invoice_no}`}>
                          <td>{g.vehicle_no}</td>
                          <td>{g.dispatch_date || '-'}</td>
                          <td>{g.invoice_no || '-'}</td>
                          <td>{g.module_count}</td>
                          <td>{g.pallet_count}</td>
                        </tr>
                      ))}
                      {!(pdiStatusData.dispatch_groups || []).length && (
                        <tr><td colSpan={5} className="empty">No dispatch yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="status-table-block">
                <h4>Pallets ({(pdiStatusData.pallet_groups || []).length})</h4>
                <div className="status-table-scroll">
                  <table>
                    <thead><tr><th>Pallet</th><th>Vehicle</th><th>Date</th><th>Modules</th></tr></thead>
                    <tbody>
                      {(pdiStatusData.pallet_groups || [])
                        .filter((p) => !statusSearch || JSON.stringify(p).toLowerCase().includes(statusSearch.toLowerCase()))
                        .map((p) => (
                        <tr key={`p-${p.pallet_no}`}>
                          <td>{p.pallet_no}</td>
                          <td>{p.vehicle_no || '-'}</td>
                          <td>{p.dispatch_date || '-'}</td>
                          <td>{p.module_count}</td>
                        </tr>
                      ))}
                      {!(pdiStatusData.pallet_groups || []).length && (
                        <tr><td colSpan={4} className="empty">No pallet info</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Actual PDI Upload & Compare */}
            {actualCompareData && (
              <div className="actual-compare-panel">
                <h4>Comparison Result - {actualCompareData.pdi?.name}</h4>
                <p>
                  <strong>Planned:</strong> {actualCompareData.summary?.planned} &nbsp;|&nbsp;
                  <strong>Actual:</strong> {actualCompareData.summary?.actual_uploaded} &nbsp;|&nbsp;
                  <strong>Variance:</strong> {actualCompareData.summary?.variance_percent}% &nbsp;|&nbsp;
                  <strong>Planned kW:</strong> {actualCompareData.pdi?.planned_kw} &nbsp;|&nbsp;
                  <strong>Actual kW:</strong> {actualCompareData.pdi?.actual_kw}
                </p>

                <div className="status-cards-grid">
                  <div className="status-card status-dispatched">
                    <div className="status-card-label">Matched (in plan & actual)</div>
                    <div className="status-card-value">{actualCompareData.summary?.matched}</div>
                  </div>
                  <div className="status-card status-packed">
                    <div className="status-card-label">Extras (actual but not planned)</div>
                    <div className="status-card-value">{actualCompareData.summary?.extras}</div>
                  </div>
                  <div className="status-card status-pending">
                    <div className="status-card-label">Missing (planned but not delivered)</div>
                    <div className="status-card-value">{actualCompareData.summary?.missing}</div>
                  </div>
                  <div className="status-card status-total">
                    <div className="status-card-label">Actual Dispatched</div>
                    <div className="status-card-value">{actualCompareData.summary?.actual_dispatched}</div>
                  </div>
                  <div className="status-card status-tracked">
                    <div className="status-card-label">Actual Packed</div>
                    <div className="status-card-value">{actualCompareData.summary?.actual_packed}</div>
                  </div>
                  <div className="status-card status-unknown">
                    <div className="status-card-label">Actual Not Packed</div>
                    <div className="status-card-value">{actualCompareData.summary?.actual_pending}</div>
                  </div>
                </div>

                <div className="status-tables">
                  <div className="status-table-block">
                    <h4>Extras - Source PDI (kis PDI ke barcode extra aaye)</h4>
                    <div className="status-table-scroll">
                      <table>
                        <thead><tr><th>Source PDI</th><th>Count</th><th>Sample Serials</th></tr></thead>
                        <tbody>
                          {(actualCompareData.extras_breakdown || []).map((g, i) => (
                            <tr key={`ex-${g.pdi_id || 'unk'}-${i}`}>
                              <td>{g.pdi_name}</td>
                              <td>{g.count}</td>
                              <td className="mono" title={g.serials_sample.join(', ')}>{g.serials_sample.slice(0, 3).join(', ')}{g.serials_sample.length > 3 ? '...' : ''}</td>
                            </tr>
                          ))}
                          {!(actualCompareData.extras_breakdown || []).length && (
                            <tr><td colSpan={3} className="empty">No extras</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="status-table-block">
                    <h4>Missing - Found in Other PDIs</h4>
                    <div className="status-table-scroll">
                      <table>
                        <thead><tr><th>Other PDI</th><th>Count</th><th>Sample</th></tr></thead>
                        <tbody>
                          {(actualCompareData.missing_in_other_pdis || []).map((g, i) => (
                            <tr key={`mo-${g.pdi_id}-${i}`}>
                              <td>{g.pdi_name || `PDI ${g.pdi_id}`}</td>
                              <td>{g.count}</td>
                              <td className="mono">{g.serials_sample.slice(0, 3).join(', ')}</td>
                            </tr>
                          ))}
                          {!(actualCompareData.missing_in_other_pdis || []).length && (
                            <tr><td colSpan={3} className="empty">None</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="status-toolbar">
                  <button type="button" onClick={() => downloadSerialsCsv('matched', actualCompareData.matched_sample || [])}>Matched CSV</button>
                  <button type="button" onClick={() => downloadSerialsCsv('missing', actualCompareData.missing_sample || [])}>Missing CSV</button>
                  <button type="button" onClick={() => downloadSerialsCsv('extras', actualCompareData.extras_sample || [])}>Extras CSV</button>
                  <button type="button" onClick={() => downloadSerialsCsv('packed', (actualCompareData.packed_sample || []).map((x) => x.serial || x))}>Packed CSV</button>
                  <button type="button" onClick={() => downloadSerialsCsv('pending', actualCompareData.pending_sample || [])}>Not Packed CSV</button>
                  <button type="button" onClick={() => downloadSerialsCsv('dispatched', (actualCompareData.dispatched_sample || []).map((x) => x.serial || x))}>Dispatched CSV</button>
                </div>

                {/* Running Order Breakdown */}
                {(actualCompareData.running_order_breakdown || []).length > 0 && (
                  <div className="ro-breakdown-section">
                    <h4>📦 Running Order Breakdown — Kitna Pack Hua</h4>
                  <p className="muted">Packed barcodes grouped by their running order.</p>
                    <div className="status-table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Running Order</th>
                            <th>Packed Count</th>
                            <th>Sample Barcodes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(actualCompareData.running_order_breakdown || []).map((ro, i) => (
                            <tr key={`ro-${ro.running_order}-${i}`}>
                              <td>{i + 1}</td>
                              <td><strong>{ro.running_order}</strong></td>
                              <td><span className="badge-packed">{ro.packed_count}</span></td>
                              <td className="mono">{(ro.serials_sample || []).slice(0, 3).join(', ')}{(ro.serials_sample || []).length > 3 ? ' ...' : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Dispatch Vehicle Breakdown */}
                {(actualCompareData.dispatch_breakdown || []).length > 0 && (
                  <div className="ro-breakdown-section hide-on-mobile">
                    <h4>🚛 Dispatch Vehicle Breakdown — Actual Dispatched Modules</h4>
                  <p className="muted">Vehicle-wise breakdown of already-dispatched barcodes — showing packed party and dispatch party.</p>
                    <div className="status-table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Vehicle No.</th>
                            <th>Dispatch Date</th>
                            <th>Invoice No.</th>
                            <th>Dispatch Party</th>
                            <th>Modules</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(actualCompareData.dispatch_breakdown || []).map((veh, i) => (
                            <tr key={`veh-${veh.vehicle_no}-${i}`}>
                              <td>{i + 1}</td>
                              <td><strong>{veh.vehicle_no}</strong></td>
                              <td>{veh.dispatch_date || '-'}</td>
                              <td>{veh.invoice_no || '-'}</td>
                              <td className="dispatch-party-cell">{veh.dispatch_party || '-'}</td>
                              <td><span className="badge-dispatched">{veh.module_count}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Packed modules detail */}
                {(actualCompareData.packed_sample || []).length > 0 && (
                  <div className="ro-breakdown-section">
                    <h4>✅ Packed Modules Detail (first {(actualCompareData.packed_sample || []).length})</h4>
                    <div className="status-table-scroll">
                      <table>
                        <thead>
                          <tr><th>Serial</th><th>Packing Date</th><th>Pallet No.</th><th>Box No.</th><th>Running Order</th></tr>
                        </thead>
                        <tbody>
                          {(actualCompareData.packed_sample || []).slice(0, 100).map((item, i) => (
                            <tr key={`pk-${item.serial}-${i}`}>
                              <td className="mono">{item.serial}</td>
                              <td>{item.packing_date || '-'}</td>
                              <td>{item.pallet_no || '-'}</td>
                              <td>{item.box_no || '-'}</td>
                              <td>{item.running_order || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Not packed (pending) modules */}
                {(actualCompareData.pending_sample || []).length > 0 && (
                  <div className="ro-breakdown-section">
                    <h4>⚠️ Not Packed Modules (first {(actualCompareData.pending_sample || []).length})</h4>
                  <p className="muted">These barcodes were part of the actual PDI but are not yet packed.</p>
                    <div className="status-table-scroll">
                      <table>
                        <thead>
                          <tr><th>#</th><th>Serial</th></tr>
                        </thead>
                        <tbody>
                          {(actualCompareData.pending_sample || []).slice(0, 100).map((s, i) => (
                            <tr key={`pend-${s}-${i}`}>
                              <td>{i + 1}</td>
                              <td className="mono">{s}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {pdiLookupError && <p className="error">{pdiLookupError}</p>}

        {pdiLookupData && (
          <div className="workspace-editor">
            <div className="workspace-editor-header">
              <h3>{pdiLookupData.pdiName || `PDI ${pdiLookupData.pdiId}`}</h3>
              <p><strong>PDI ID:</strong> {pdiLookupData.pdiId}</p>
              <p><strong>Wattage:</strong> {pdiLookupData.wattage || '-'}</p>
              <p><strong>Quantity:</strong> {pdiLookupData.quantity}</p>
              <p><strong>Barcodes Returned:</strong> {pdiLookupData.barcodeCount}</p>
            </div>

            <div className="workspace-actions">
              <button type="button" onClick={downloadPdiBarcodesCsv} disabled={!pdiLookupData.barcodes.length}>
                Download CSV
              </button>
              <button type="button" className="secondary" onClick={copyPdiBarcodesToClipboard} disabled={!pdiLookupData.barcodes.length}>
                Copy All
              </button>
            </div>

            <div className="workspace-editor-grid">
              <div className="workspace-field">
                <label>Filter Barcodes</label>
                <input
                  type="text"
                  value={pdiBarcodeFilter}
                  onChange={(e) => setPdiBarcodeFilter(e.target.value)}
                  placeholder="Type to filter..."
                />
              </div>
            </div>

            <div className="compare-list-box" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <h5>Barcodes ({pdiLookupData.barcodes.filter((b) => !pdiBarcodeFilter || String(b).toLowerCase().includes(pdiBarcodeFilter.toLowerCase())).length} shown)</h5>
              <ul>
                {pdiLookupData.barcodes
                  .filter((b) => !pdiBarcodeFilter || String(b).toLowerCase().includes(pdiBarcodeFilter.toLowerCase()))
                  .slice(0, 1000)
                  .map((b, i) => <li key={`bc-${i}-${b}`}>{b}</li>)}
              </ul>
              {pdiLookupData.barcodes.length > 1000 && (
                <p className="info">Showing first 1000. Use filter or download CSV for full list.</p>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB B — Actual PDIs (party-level multi-batch) */}
        {/* ============================================================ */}
        {isPartyDetailMode && partyDetailTab === 'actual' && !activeBatchId && (
          <div className="workspace-editor">
            <div className="workspace-editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Actual PDIs — {detailPartyName}</h3>
                <p>Upload the actual barcodes received by the customer. Each PDI batch is tracked separately (PDI 1, PDI 2, …).</p>
              </div>
              <button type="button" className="primary" onClick={() => setShowAddBatch(true)}>+ Add PDI</button>
            </div>

            {showAddBatch && (
              <div className="add-batch-form">
                <h4>New Actual PDI Batch</h4>
                <div className="workspace-field">
                  <label>Batch Name (optional — defaults to "PDI N")</label>
                  <input type="text" value={addBatchName} onChange={(e) => setAddBatchName(e.target.value)} placeholder="e.g. PDI 1 - Lot 05" />
                </div>
                <div className="actual-pdi-section-label">Excel / CSV Upload</div>
                <div className="actual-pdi-actions">
                  <input
                    ref={addBatchFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={(e) => handleAddBatchFile(e.target.files?.[0])}
                  />
                  <button type="button" onClick={() => addBatchFileRef.current?.click()}>
                    {addBatchFile ? `📄 ${addBatchFile}` : '📁 Choose File'}
                  </button>
                  <span className="muted">{addBatchBarcodes.length ? `✅ ${addBatchBarcodes.length} barcodes` : 'No file'}</span>
                </div>
                <div className="actual-pdi-section-label">OR Manually Paste Barcodes</div>
                <textarea
                  className="actual-barcode-textarea"
                  rows={4}
                  placeholder="One barcode per line, or separated by commas / spaces"
                  value={addBatchManual}
                  onChange={(e) => setAddBatchManual(e.target.value)}
                />
                <div className="actual-pdi-manual-count">
                  {addBatchManual.trim() ? `✅ ${parseSerials(addBatchManual).length} barcodes detected` : 'Koi manual barcode nahi'}
                </div>
                <div className="actual-pdi-actions" style={{ marginTop: 10 }}>
                  <span className="muted">
                    Total: {new Set([...addBatchBarcodes, ...parseSerials(addBatchManual)]).size} unique
                  </span>
                  <button type="button" className="primary" onClick={submitAddBatch} disabled={addBatchSaving}>
                    {addBatchSaving ? '⏳ Saving...' : '💾 Save Batch'}
                  </button>
                  <button type="button" className="secondary" onClick={resetAddBatchForm} disabled={addBatchSaving}>Cancel</button>
                </div>
              </div>
            )}

            {loadingBatches && <p className="info">Loading batches...</p>}
            {!loadingBatches && actualBatches.length === 0 && !showAddBatch && (
              <p className="info">No Actual PDI batches yet. Click "+ Add PDI" above to create your first batch.</p>
            )}

            {actualBatches.length > 0 && (
              <div className="party-cards-grid">
                {actualBatches.map((b) => (
                  <div key={`batch-${b.id}`} className="party-card-btn party-card-clickable" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}
                      onClick={() => openBatch(b.id)}
                    >
                      <div className="party-card-avatar pdi-avatar">PDI</div>
                      <div className="party-card-body">
                        <h4>{b.batch_name}</h4>
                        <div className="party-card-stats">
                          <span>{b.count} barcodes</span>
                          {b.filename ? <span> · {b.filename}</span> : null}
                        </div>
                        <div className="party-card-stats" style={{ fontSize: 11, color: '#6b7280' }}>
                          {String(b.updated_at || b.created_at || '').slice(0, 19).replace('T', ' ')}
                        </div>
                      </div>
                      <span className="party-card-arrow">&rsaquo;</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteBatch(b.id); }}
                      title="Delete batch"
                      style={{ position: 'absolute', top: 8, right: 8, background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}
                    >🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Batch detail / report */}
        {isPartyDetailMode && partyDetailTab === 'actual' && activeBatchId && (
          <div className="pdi-status-panel">
            <div className="pdi-status-header">
              <div>
                <h3>{activeBatchData?.batch_name || `Batch #${activeBatchId}`}</h3>
                <p>
                  <strong>Barcodes:</strong> {activeBatchData?.count || 0}
                  {activeBatchData?.filename ? <> &nbsp;|&nbsp; <strong>File:</strong> {activeBatchData.filename}</> : null}
                  {activeBatchData?.updated_at ? <> &nbsp;|&nbsp; <strong>Updated:</strong> {String(activeBatchData.updated_at).slice(0, 19).replace('T', ' ')}</> : null}
                </p>
              </div>
              <button type="button" className="back-btn" onClick={closeBatch}>Close</button>
            </div>

            {batchCompareLoading && (
              <div className="pdi-status-loading">
                <div className="spinner" />
                <p>Comparing against all PDI cards, packing and dispatch records…</p>
              </div>
            )}
            {batchCompareError && <p className="error">{batchCompareError}</p>}

            {batchCompareData && (
              <>
                <div className="status-cards-grid">
                  <div className="status-card status-total">
                    <div className="status-card-label">Total Actual</div>
                    <div className="status-card-value">{batchCompareData.summary?.total_actual || 0}</div>
                  </div>
                  <div className="status-card status-dispatched">
                    <div className="status-card-label">Dispatched</div>
                    <div className="status-card-value">{batchCompareData.summary?.dispatched || 0}</div>
                  </div>
                  <div className="status-card status-packed">
                    <div className="status-card-label">Packed (not dispatched)</div>
                    <div className="status-card-value">{(batchCompareData.summary?.packed || 0) - (batchCompareData.summary?.dispatched || 0)}</div>
                  </div>
                  <div className="status-card status-pending">
                    <div className="status-card-label">Pending</div>
                    <div className="status-card-value">{batchCompareData.summary?.pending || 0}</div>
                  </div>
                  <div className="status-card status-extras">
                    <div className="status-card-label">Extras (no card)</div>
                    <div className="status-card-value">{batchCompareData.summary?.extras_no_card || 0}</div>
                  </div>
                </div>

                <div className="ro-breakdown-section">
                  <h4>📋 Per-PDI Card Breakdown</h4>
                  <p className="muted">Distribution of this batch across PDI cards — packed, dispatched and pending per card.</p>
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>PDI Card</th>
                        <th>Wattage</th>
                        <th>Plan Qty</th>
                        <th>Card Total</th>
                        <th>Actual in Card</th>
                        <th>Packed</th>
                        <th>Dispatched</th>
                        <th>Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(batchCompareData.card_breakdown || []).map((c, i) => (
                        <tr key={`cb-${c.pdi_id}`}>
                          <td>{i + 1}</td>
                          <td>{c.pdi_name}</td>
                          <td>{c.wattage}</td>
                          <td>{c.plan_qty}</td>
                          <td>{c.card_total_barcodes}</td>
                          <td><strong>{c.actual_in_card}</strong></td>
                          <td>{c.packed}</td>
                          <td>{c.dispatched}</td>
                          <td>{c.pending}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(batchCompareData.running_order_breakdown || []).length > 0 && (
                  <div className="ro-breakdown-section">
                    <h4>🏭 Running Order Breakdown</h4>
                    <table className="result-table">
                      <thead><tr><th>#</th><th>Running Order</th><th>Count</th></tr></thead>
                      <tbody>
                        {batchCompareData.running_order_breakdown.map((r, i) => (
                          <tr key={`ro-${i}`}><td>{i + 1}</td><td>{r.running_order}</td><td>{r.count}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {(batchCompareData.dispatch_breakdown || []).length > 0 && (
                  <div className="ro-breakdown-section hide-on-mobile">
                    <h4>🚚 Dispatch Vehicle Breakdown</h4>
                    <table className="result-table">
                      <thead><tr><th>#</th><th>Vehicle No</th><th>Dispatch Party</th><th>Count</th></tr></thead>
                      <tbody>
                        {batchCompareData.dispatch_breakdown.map((d, i) => (
                          <tr key={`vh-${i}`}>
                            <td>{i + 1}</td>
                            <td>{d.vehicle_no}</td>
                            <td>{d.dispatch_party}</td>
                            <td>{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="ro-breakdown-section">
                  <h4>📥 Downloads</h4>
                  <div className="actual-pdi-actions">
                    <button type="button" onClick={() => downloadSerialsCsv(`packed_${activeBatchId}`, batchCompareData.all_packed)} disabled={!batchCompareData.all_packed?.length}>Packed CSV</button>
                    <button type="button" onClick={() => downloadSerialsCsv(`dispatched_${activeBatchId}`, batchCompareData.all_dispatched)} disabled={!batchCompareData.all_dispatched?.length}>Dispatched CSV</button>
                    <button type="button" onClick={() => downloadSerialsCsv(`pending_${activeBatchId}`, batchCompareData.all_pending)} disabled={!batchCompareData.all_pending?.length}>Pending CSV</button>
                    <button type="button" onClick={() => downloadSerialsCsv(`extras_${activeBatchId}`, batchCompareData.all_extras)} disabled={!batchCompareData.all_extras?.length}>Extras CSV</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {analysis && (
        <>
        <div className="planner-results">
          <div className="result-card">
            <h3>Packed Parties</h3>
            <p><strong>Selected:</strong> {analysis.packedSummaries.length}</p>
            <p><strong>Total Packing Count:</strong> {analysis.totalPackedCount.toLocaleString()}</p>
          </div>

          <div className="result-card">
            <h3>Dispatch Parties</h3>
            <p><strong>Selected:</strong> {analysis.dispatchSummaries.length}</p>
            <p><strong>Total Already Dispatched:</strong> {analysis.totalDispatchedCount.toLocaleString()}</p>
          </div>

          <div className="result-card highlight">
            <h3>Decision Support</h3>
            <p><strong>Comparison Rows:</strong> {analysis.rows.length}</p>
            <p><strong>Status Rule:</strong> Possible if packed count &gt; 0</p>
            <p><strong>Mode:</strong> Multi-party matrix</p>
          </div>
        </div>

        <div className="result-table-wrap">
          <table className="result-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Packed Party</th>
                <th>Packed Count</th>
                <th>Dispatch Party</th>
                <th>Already Dispatched</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((row, idx) => (
                <tr key={`${row.packedPartyId}-${row.dispatchPartyId}`}>
                  <td>{idx + 1}</td>
                  <td>{row.packedPartyName}</td>
                  <td>{row.packedCount.toLocaleString()}</td>
                  <td>{row.dispatchPartyName}</td>
                  <td>{row.dispatchCount.toLocaleString()}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
};

export default PartyReallocationPlanner;
