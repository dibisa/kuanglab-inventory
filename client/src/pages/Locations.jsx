import { useState, useEffect } from 'react';
import { 
  Plus, 
  MapPin,
  X,
  Trash2,
  Building,
  DoorOpen,
  Archive
} from 'lucide-react';
import { getLocations, createLocation, deleteLocation } from '../api';

function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this location? Items stored here will need to be reassigned.')) {
      try {
        await deleteLocation(id);
        setLocations(locations.filter(l => l.id !== id));
      } catch (error) {
        alert('Failed to delete location');
      }
    }
  }

  // Group locations by building
  const groupedLocations = locations.reduce((acc, loc) => {
    const building = loc.building || 'Unassigned';
    if (!acc[building]) acc[building] = [];
    acc[building].push(loc);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Storage Locations</h1>
          <p className="page-subtitle">Manage lab storage locations and organization</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="empty-state">
          <MapPin className="empty-state-icon" size={80} />
          <h3 className="empty-state-title">No locations defined</h3>
          <p>Add storage locations to organize your inventory</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ marginTop: '1rem' }}>
            <Plus size={20} />
            Add First Location
          </button>
        </div>
      ) : (
        <div>
          {Object.entries(groupedLocations).map(([building, locs]) => (
            <div key={building} style={{ marginBottom: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Building size={20} />
                {building}
              </h3>
              <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {locs.map(loc => (
                  <div key={loc.id} className="item-card" style={{ cursor: 'default' }}>
                    <div className="item-card-header">
                      <div>
                        <div className="item-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <DoorOpen size={18} />
                          {loc.room || 'Room not specified'}
                        </div>
                        <div className="item-card-subtitle">{loc.building || 'Building not specified'}</div>
                      </div>
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDelete(loc.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="item-card-body">
                      {loc.cabinet && (
                        <div className="item-card-row">
                          <span className="item-card-label">Cabinet</span>
                          <span className="item-card-value">{loc.cabinet}</span>
                        </div>
                      )}
                      {loc.shelf && (
                        <div className="item-card-row">
                          <span className="item-card-label">Shelf</span>
                          <span className="item-card-value">{loc.shelf}</span>
                        </div>
                      )}
                      {loc.bin && (
                        <div className="item-card-row">
                          <span className="item-card-label">Bin/Container</span>
                          <span className="item-card-value">{loc.bin}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <Archive size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                      Full path: {[loc.building, loc.room, loc.cabinet, loc.shelf, loc.bin].filter(Boolean).join(' → ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddLocationModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={(newLoc) => {
            setLocations([...locations, newLoc]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddLocationModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    building: '',
    room: '',
    cabinet: '',
    shelf: '',
    bin: ''
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.room && !formData.building) {
      alert('Please specify at least a building or room');
      return;
    }

    setSaving(true);
    try {
      const result = await createLocation(formData);
      onSuccess(result);
    } catch (error) {
      alert('Failed to add location: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Add Storage Location</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Define a storage location for chemicals and equipment. You can be as specific or general as needed.
            </p>
            
            <div className="form-group">
              <label className="form-label">Building</label>
              <input
                type="text"
                className="form-input"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                placeholder="e.g., Science Building, Lab A"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Room</label>
              <input
                type="text"
                className="form-input"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g., Room 101, Main Lab"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cabinet / Storage Unit</label>
              <input
                type="text"
                className="form-input"
                value={formData.cabinet}
                onChange={(e) => setFormData({ ...formData, cabinet: e.target.value })}
                placeholder="e.g., Flammables Cabinet, Freezer 1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shelf</label>
              <input
                type="text"
                className="form-input"
                value={formData.shelf}
                onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                placeholder="e.g., Top Shelf, Shelf 3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bin / Container</label>
              <input
                type="text"
                className="form-input"
                value={formData.bin}
                onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                placeholder="e.g., Bin A, Box 1"
              />
            </div>

            <div style={{ background: 'var(--bg-dark)', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Preview:</div>
              <div style={{ fontWeight: 500 }}>
                {[formData.building, formData.room, formData.cabinet, formData.shelf, formData.bin]
                  .filter(Boolean)
                  .join(' → ') || 'Enter location details above'}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Locations;
