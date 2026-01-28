import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Microscope,
  X,
  Trash2,
  Eye,
  Calendar,
  Gauge,
  Activity
} from 'lucide-react';
import { getEquipment, createEquipment, deleteEquipment, getLocations } from '../api';

function Equipment() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('cards');

  const statuses = ['Available', 'In Use', 'Under Maintenance', 'Out of Service', 'Reserved'];
  const categories = [...new Set(equipment.map(e => e.category).filter(Boolean))];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEquipment();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, categoryFilter]);

  async function loadData() {
    try {
      const [eqData, locData] = await Promise.all([
        getEquipment(),
        getLocations()
      ]);
      setEquipment(eqData);
      setLocations(locData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEquipment() {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const data = await getEquipment(params);
      setEquipment(data);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this instrument?')) {
      try {
        await deleteEquipment(id);
        setEquipment(equipment.filter(e => e.id !== id));
      } catch (error) {
        alert('Failed to delete instrument');
      }
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'Available': return 'badge-green';
      case 'In Use': return 'badge-orange';
      case 'Reserved': return 'badge-blue';
      case 'Under Maintenance': return 'badge-purple';
      case 'Out of Service': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Instruments & Equipment</h1>
          <p className="page-subtitle">Manage lab instruments and equipment</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Instrument
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, model, serial number, or manufacturer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filters-bar">
        <select 
          className="filter-select" 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <select 
          className="filter-select" 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
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
      {equipment.length === 0 ? (
        <div className="empty-state">
          <Microscope className="empty-state-icon" size={80} />
          <h3 className="empty-state-title">No instruments found</h3>
          <p>Try adjusting your search or add a new instrument</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Model</th>
                <th>Manufacturer</th>
                <th>Serial #</th>
                <th>Status</th>
                <th>Category</th>
                <th>Location</th>
                <th>Next Calibration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(eq => (
                <tr key={eq.id} onClick={() => navigate(`/equipment/${eq.id}`)}>
                  <td style={{ fontWeight: 500 }}>{eq.name}</td>
                  <td>{eq.model || '-'}</td>
                  <td>{eq.manufacturer || '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{eq.serial_number || '-'}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(eq.status)}`}>
                      {eq.status || 'Available'}
                    </span>
                  </td>
                  <td>{eq.category || '-'}</td>
                  <td>{eq.room ? `${eq.building || ''} ${eq.room}` : '-'}</td>
                  <td style={{ color: eq.next_calibration && new Date(eq.next_calibration) < new Date() ? '#ef4444' : 'inherit' }}>
                    {eq.next_calibration || '-'}
                  </td>
                  <td>
                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                      <button className="action-btn" onClick={() => navigate(`/equipment/${eq.id}`)}>
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" onClick={() => navigate(`/reservations?equipment=${eq.id}`)}>
                        <Calendar size={16} />
                      </button>
                      <button className="action-btn delete" onClick={(e) => handleDelete(eq.id, e)}>
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
          {equipment.map(eq => (
            <div 
              key={eq.id} 
              className="item-card"
              onClick={() => navigate(`/equipment/${eq.id}`)}
            >
              <div className="item-card-header">
                <div>
                  <div className="item-card-title">{eq.name}</div>
                  <div className="item-card-subtitle">{eq.manufacturer || 'Unknown Manufacturer'}</div>
                </div>
                <span className={`badge ${getStatusBadge(eq.status)}`}>
                  {eq.status || 'Available'}
                </span>
              </div>
              <div className="item-card-body">
                {eq.model && (
                  <div className="item-card-row">
                    <span className="item-card-label">Model</span>
                    <span className="item-card-value">{eq.model}</span>
                  </div>
                )}
                {eq.serial_number && (
                  <div className="item-card-row">
                    <span className="item-card-label">Serial #</span>
                    <span className="item-card-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{eq.serial_number}</span>
                  </div>
                )}
                {eq.category && (
                  <div className="item-card-row">
                    <span className="item-card-label">Category</span>
                    <span className="item-card-value">{eq.category}</span>
                  </div>
                )}
                {eq.room && (
                  <div className="item-card-row">
                    <span className="item-card-label">Location</span>
                    <span className="item-card-value">{`${eq.building || ''} ${eq.room}`}</span>
                  </div>
                )}
                {eq.next_calibration && (
                  <div className="item-card-row">
                    <span className="item-card-label">Next Calibration</span>
                    <span className="item-card-value" style={{ color: new Date(eq.next_calibration) < new Date() ? '#ef4444' : 'inherit' }}>
                      {eq.next_calibration}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ flex: 1 }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/reservations?equipment=${eq.id}`); }}
                >
                  <Calendar size={16} />
                  Reserve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddEquipmentModal 
          locations={locations}
          onClose={() => setShowAddModal(false)} 
          onSuccess={(newEq) => {
            setEquipment([newEq, ...equipment]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddEquipmentModal({ locations, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    manufacturer: '',
    serial_number: '',
    asset_tag: '',
    status: 'Available',
    category: '',
    location_id: '',
    purchase_date: '',
    warranty_expiry: '',
    calibration_date: '',
    next_calibration: '',
    cost: '',
    // Measurement specs
    measurement_range: '',
    accuracy: '',
    resolution: '',
    measurement_units: '',
    operating_conditions: '',
    limitations: '',
    notes: ''
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
      const result = await createEquipment(formData);
      onSuccess(result);
    } catch (error) {
      alert('Failed to add instrument: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Instrument</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Basic Information</h4>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Instrument Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Analytical Balance, HPLC System"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Model number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manufacturer</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g., Mettler Toledo, Agilent"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Serial number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Asset Tag</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.asset_tag}
                  onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                  placeholder="Internal asset ID"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="Balance">Balance / Scale</option>
                  <option value="Chromatography">Chromatography</option>
                  <option value="Spectroscopy">Spectroscopy</option>
                  <option value="Microscopy">Microscopy</option>
                  <option value="Centrifuge">Centrifuge</option>
                  <option value="pH Meter">pH Meter</option>
                  <option value="Pipette">Pipette</option>
                  <option value="Thermometer">Thermometer</option>
                  <option value="Incubator">Incubator</option>
                  <option value="Fume Hood">Fume Hood</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <select
                  className="form-select"
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                >
                  <option value="">Select location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {`${loc.building || ''} ${loc.room || ''}${loc.cabinet ? ` - ${loc.cabinet}` : ''}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h4 style={{ margin: '1.5rem 0 1rem', color: 'var(--text-secondary)' }}>
              <Gauge size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Measurement Specifications
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Measurement Range</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.measurement_range}
                  onChange={(e) => setFormData({ ...formData, measurement_range: e.target.value })}
                  placeholder="e.g., 0.1 mg - 220 g"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Accuracy</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.accuracy}
                  onChange={(e) => setFormData({ ...formData, accuracy: e.target.value })}
                  placeholder="e.g., ±0.1 mg, ±0.01%"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resolution</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.resolution}
                  onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  placeholder="e.g., 0.01 mg"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Measurement Units</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.measurement_units}
                  onChange={(e) => setFormData({ ...formData, measurement_units: e.target.value })}
                  placeholder="e.g., mg, g, pH, nm"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Operating Conditions</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.operating_conditions}
                  onChange={(e) => setFormData({ ...formData, operating_conditions: e.target.value })}
                  placeholder="e.g., 15-30°C, 20-80% RH"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Limitations / Constraints</label>
                <textarea
                  className="form-textarea"
                  value={formData.limitations}
                  onChange={(e) => setFormData({ ...formData, limitations: e.target.value })}
                  placeholder="e.g., Not suitable for corrosive samples, Max sample weight 500g..."
                />
              </div>
            </div>

            <h4 style={{ margin: '1.5rem 0 1rem', color: 'var(--text-secondary)' }}>
              <Calendar size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Dates & Maintenance
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Warranty Expiry</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.warranty_expiry}
                  onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Calibration</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.calibration_date}
                  onChange={(e) => setFormData({ ...formData, calibration_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Next Calibration Due</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.next_calibration}
                  onChange={(e) => setFormData({ ...formData, next_calibration: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="Purchase cost"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes, instructions, or comments..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Instrument'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Equipment;
