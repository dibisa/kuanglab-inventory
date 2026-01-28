import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X,
  Clock,
  User,
  Microscope,
  Trash2
} from 'lucide-react';
import { getEquipment, getReservations, createReservation, deleteReservation } from '../api';

function Reservations() {
  const [searchParams] = useSearchParams();
  const equipmentFilter = searchParams.get('equipment');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [equipment, setEquipment] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(equipmentFilter || '');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (equipmentFilter) {
      setSelectedEquipment(equipmentFilter);
    }
  }, [equipmentFilter]);

  async function loadData() {
    try {
      const [eqData, resData] = await Promise.all([
        getEquipment(),
        getReservations().catch(() => []) // May not exist yet
      ]);
      setEquipment(eqData);
      setReservations(resData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteReservation(id) {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await deleteReservation(id);
        setReservations(reservations.filter(r => r.id !== id));
      } catch (error) {
        alert('Failed to cancel reservation');
      }
    }
  }

  function getMonthDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add days from previous month
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }

  function getReservationsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(r => {
      const start = r.start_date?.split('T')[0];
      const end = r.end_date?.split('T')[0];
      return dateStr >= start && dateStr <= end;
    }).filter(r => !selectedEquipment || r.equipment_id == selectedEquipment);
  }

  function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const filteredReservations = selectedEquipment 
    ? reservations.filter(r => r.equipment_id == selectedEquipment)
    : reservations;

  const upcomingReservations = filteredReservations
    .filter(r => new Date(r.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 10);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipment Reservations</h1>
          <p className="page-subtitle">Schedule and manage instrument reservations</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedDate(new Date()); setShowAddModal(true); }}>
          <Plus size={20} />
          New Reservation
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select 
          className="filter-select" 
          value={selectedEquipment} 
          onChange={(e) => setSelectedEquipment(e.target.value)}
          style={{ minWidth: '250px' }}
        >
          <option value="">All Instruments</option>
          {equipment.map(eq => (
            <option key={eq.id} value={eq.id}>{eq.name} {eq.model ? `(${eq.model})` : ''}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon size={16} />
            Calendar
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="calendar-container">
          <div className="calendar-header">
            <h3 style={{ margin: 0 }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="calendar-nav">
              <button 
                className="calendar-nav-btn"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                className="calendar-nav-btn"
                onClick={() => setCurrentDate(new Date())}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Today
              </button>
              <button 
                className="calendar-nav-btn"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {dayNames.map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
            
            {getMonthDays().map(({ date, isCurrentMonth }, idx) => {
              const dayReservations = getReservationsForDate(date);
              return (
                <div 
                  key={idx}
                  className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday(date) ? 'today' : ''}`}
                  onClick={() => { setSelectedDate(date); setShowAddModal(true); }}
                >
                  <div className="calendar-date">{date.getDate()}</div>
                  {dayReservations.slice(0, 3).map(res => {
                    const eq = equipment.find(e => e.id == res.equipment_id);
                    return (
                      <div 
                        key={res.id} 
                        className="calendar-event reserved"
                        onClick={(e) => e.stopPropagation()}
                        title={`${eq?.name || 'Equipment'} - ${res.user_name || 'Unknown'}`}
                      >
                        {eq?.name || 'Reserved'}
                      </div>
                    );
                  })}
                  {dayReservations.length > 3 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      +{dayReservations.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Upcoming Reservations</h3>
          {upcomingReservations.length === 0 ? (
            <div className="empty-state">
              <CalendarIcon className="empty-state-icon" size={80} />
              <h3 className="empty-state-title">No upcoming reservations</h3>
              <p>Click "New Reservation" to schedule an instrument</p>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Instrument</th>
                    <th>Reserved By</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingReservations.map(res => {
                    const eq = equipment.find(e => e.id == res.equipment_id);
                    return (
                      <tr key={res.id}>
                        <td style={{ fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Microscope size={16} />
                            {eq?.name || 'Unknown'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} />
                            {res.user_name || 'Unknown'}
                          </div>
                        </td>
                        <td>{res.start_date?.split('T')[0]}</td>
                        <td>{res.end_date?.split('T')[0]}</td>
                        <td>{res.start_time || '-'} - {res.end_time || '-'}</td>
                        <td>{res.purpose || '-'}</td>
                        <td>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDeleteReservation(res.id)}
                          >
                            <Trash2 size={16} />
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
      )}

      {/* Legend */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.2)' }}></div>
          Reserved
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(59, 130, 246, 0.3)' }}></div>
          Today
        </div>
      </div>

      {/* Add Reservation Modal */}
      {showAddModal && (
        <AddReservationModal 
          equipment={equipment}
          selectedDate={selectedDate}
          preselectedEquipment={selectedEquipment}
          onClose={() => setShowAddModal(false)} 
          onSuccess={(newRes) => {
            setReservations([...reservations, newRes]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddReservationModal({ equipment, selectedDate, preselectedEquipment, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    equipment_id: preselectedEquipment || '',
    user_name: '',
    user_email: '',
    start_date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    end_date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    purpose: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.equipment_id || !formData.user_name || !formData.start_date) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const result = await createReservation(formData);
      onSuccess(result);
    } catch (error) {
      alert('Failed to create reservation: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Reservation</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Instrument *</label>
                <select
                  className="form-select"
                  value={formData.equipment_id}
                  onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                  required
                >
                  <option value="">Select instrument</option>
                  {equipment.filter(eq => eq.status === 'Available' || eq.id == formData.equipment_id).map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} {eq.model ? `(${eq.model})` : ''} - {eq.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.user_name}
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Purpose</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="What will you be using this for?"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Reservations;
