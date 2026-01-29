import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  FlaskConical,
  X,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { getChemicals, createChemical, deleteChemical, getLocations, getStats } from '../api';

function Chemicals() {
  const navigate = useNavigate();
  const [chemicals, setChemicals] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [hazardFilter, setHazardFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadChemicals();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, hazardFilter]);

  async function loadData() {
    try {
      const [chemData, locData, statsData] = await Promise.all([
        getChemicals(),
        getLocations(),
        getStats()
      ]);
      setChemicals(chemData);
      setLocations(locData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadChemicals() {
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (hazardFilter) params.hazard = hazardFilter;
      const data = await getChemicals(params);
      setChemicals(data);
    } catch (error) {
      console.error('Failed to load chemicals:', error);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chemical?')) {
      try {
        await deleteChemical(id);
        setChemicals(chemicals.filter(c => c.id !== id));
      } catch (error) {
        alert('Failed to delete chemical');
      }
    }
  }

  function getHazardColor(hazard) {
    if (!hazard) return 'default';
    const h = hazard.toLowerCase();
    if (h.includes('flammable')) return 'flammable';
    if (h.includes('toxic') || h.includes('poison')) return 'toxic';
    if (h.includes('corrosive')) return 'corrosive';
    if (h.includes('oxidizer') || h.includes('oxidizing')) return 'oxidizer';
    return 'default';
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Chemicals</h1>
          <p className="page-subtitle">Manage your chemical inventory</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Chemical
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, CAS number, formula, or catalog number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filters-bar">
        <select 
          className="filter-select" 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {stats?.categories?.filter(c => c).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          className="filter-select" 
          value={hazardFilter} 
          onChange={(e) => setHazardFilter(e.target.value)}
        >
          <option value="">All Hazard Classes</option>
          {stats?.hazardClasses?.filter(h => h).map(hazard => (
            <option key={hazard} value={hazard}>{hazard}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('table')}
          >
            Table
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('cards')}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Results */}
      {chemicals.length === 0 ? (
        <div className="empty-state">
          <FlaskConical className="empty-state-icon" size={80} />
          <h3 className="empty-state-title">No chemicals found</h3>
          <p>Try adjusting your search or add a new chemical</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>CAS Number</th>
                <th>Formula</th>
                <th>Quantity</th>
                <th>Category</th>
                <th>Hazard</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chemicals.map(chem => (
                <tr key={chem.id} onClick={() => navigate(`/chemicals/${chem.id}`)}>
                  <td style={{ fontWeight: 500 }}>{chem.name}</td>
                  <td>{chem.cas_number || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{chem.formula || '-'}</td>
                  <td>
                    {chem.quantity ? (
                      <span style={{ color: chem.quantity < 10 ? '#f59e0b' : 'inherit' }}>
                        {chem.quantity} {chem.unit || ''}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    {chem.category && <span className="badge badge-blue">{chem.category}</span>}
                  </td>
                  <td>
                    {chem.hazard_class && (
                      <span className="hazard-indicator">
                        <span className={`hazard-dot ${getHazardColor(chem.hazard_class)}`}></span>
                        {chem.hazard_class}
                      </span>
                    )}
                  </td>
                  <td>
                    {chem.room ? `${chem.building || ''} ${chem.room}${chem.cabinet ? `, ${chem.cabinet}` : ''}` : '-'}
                  </td>
                  <td>
                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                      <button className="action-btn" onClick={() => navigate(`/chemicals/${chem.id}`)}>
                        <Eye size={16} />
                      </button>
                      <button className="action-btn delete" onClick={(e) => handleDelete(chem.id, e)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cards-grid">
          {chemicals.map(chem => (
            <div 
              key={chem.id} 
              className="item-card"
              onClick={() => navigate(`/chemicals/${chem.id}`)}
            >
              <div className="item-card-header">
                <div>
                  <div className="item-card-title">{chem.name}</div>
                  <div className="item-card-subtitle">{chem.cas_number || 'No CAS #'}</div>
                </div>
                {chem.hazard_class && (
                  <span className="badge badge-red">{chem.hazard_class}</span>
                )}
              </div>
              <div className="item-card-body">
                {chem.formula && (
                  <div className="item-card-row">
                    <span className="item-card-label">Formula</span>
                    <span className="item-card-value" style={{ fontFamily: 'monospace' }}>{chem.formula}</span>
                  </div>
                )}
                <div className="item-card-row">
                  <span className="item-card-label">Quantity</span>
                  <span className="item-card-value" style={{ color: chem.quantity < 10 ? '#f59e0b' : 'inherit' }}>
                    {chem.quantity ? `${chem.quantity} ${chem.unit || ''}` : 'Not specified'}
                  </span>
                </div>
                {chem.room && (
                  <div className="item-card-row">
                    <span className="item-card-label">Location</span>
                    <span className="item-card-value">
                      {`${chem.building || ''} ${chem.room}${chem.cabinet ? `, ${chem.cabinet}` : ''}`}
                    </span>
                  </div>
                )}
                {chem.supplier && (
                  <div className="item-card-row">
                    <span className="item-card-label">Supplier</span>
                    <span className="item-card-value">{chem.supplier}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddChemicalModal 
          locations={locations}
          onClose={() => setShowAddModal(false)} 
          onSuccess={(newChem) => {
            setChemicals([newChem, ...chemicals]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddChemicalModal({ locations, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    cas_number: '',
    formula: '',
    molecular_weight: '',
    quantity: '',
    unit: 'g',
    category: '',
    hazard_class: '',
    state: '',
    purity: '',
    supplier: '',
    catalog_number: '',
    lot_number: '',
    location_id: '',
    storage_conditions: '',
    notes: '',
    sds_url: '',
    tech_url: ''
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    setSaving(true);
    try {
      const result = await createChemical(formData);
      onSuccess(result);
    } catch (error) {
      alert('Failed to add chemical: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Chemical</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
                            {/* SDS URL */}
                            <div className="form-group">
                              <label htmlFor="sds_url">SDS URL</label>
                              <input
                                type="url"
                                id="sds_url"
                                className="form-input"
                                value={formData.sds_url}
                                onChange={e => setFormData({ ...formData, sds_url: e.target.value })}
                                placeholder="https://..."
                              />
                            </div>
                            {/* Technical Paper URL */}
                            <div className="form-group">
                              <label htmlFor="tech_url">Technical Paper URL</label>
                              <input
                                type="url"
                                id="tech_url"
                                className="form-input"
                                value={formData.tech_url}
                                onChange={e => setFormData({ ...formData, tech_url: e.target.value })}
                                placeholder="https://..."
                              />
                            </div>
              <div className="form-group full-width">
                <label className="form-label">Chemical Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sodium Chloride"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">CAS Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.cas_number}
                  onChange={(e) => setFormData({ ...formData, cas_number: e.target.value })}
                  placeholder="e.g., 7647-14-5"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Molecular Formula</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.formula}
                  onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                  placeholder="e.g., NaCl"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Molecular Weight</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.molecular_weight}
                  onChange={(e) => setFormData({ ...formData, molecular_weight: e.target.value })}
                  placeholder="g/mol"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Physical State</label>
                <select
                  className="form-select"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  <option value="">Select state</option>
                  <option value="Solid">Solid</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Gas">Gas</option>
                  <option value="Solution">Solution</option>
                  <option value="Powder">Powder</option>
                  <option value="Crystal">Crystal</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Amount"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-select"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="mg">Milligrams (mg)</option>
                  <option value="mL">Milliliters (mL)</option>
                  <option value="L">Liters (L)</option>
                  <option value="mol">Moles (mol)</option>
                  <option value="units">Units</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Solvent, Acid, Salt"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hazard Class</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.hazard_class}
                  onChange={(e) => setFormData({ ...formData, hazard_class: e.target.value })}
                  placeholder="e.g., Flammable, Toxic"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purity</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  placeholder="e.g., 99.9%, ACS Grade"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supplier</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="e.g., Sigma-Aldrich"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Catalog Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.catalog_number}
                  onChange={(e) => setFormData({ ...formData, catalog_number: e.target.value })}
                  placeholder="Product catalog #"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lot Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.lot_number}
                  onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                  placeholder="Batch/Lot #"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Storage Location</label>
                <select
                  className="form-select"
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                >
                  <option value="">Select location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {`${loc.building || ''} ${loc.room || ''}${loc.cabinet ? ` - ${loc.cabinet}` : ''}${loc.shelf ? ` (${loc.shelf})` : ''}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Storage Conditions</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.storage_conditions}
                  onChange={(e) => setFormData({ ...formData, storage_conditions: e.target.value })}
                  placeholder="e.g., Store at 2-8°C, Keep away from light"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Chemical'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chemicals;
