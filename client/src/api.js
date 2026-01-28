const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

// Stats
export const getStats = () => fetchApi('/stats');

// Chemicals
export const getChemicals = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/chemicals${query ? `?${query}` : ''}`);
};
export const getChemical = (id) => fetchApi(`/chemicals/${id}`);
export const createChemical = (data) => fetchApi('/chemicals', { method: 'POST', body: JSON.stringify(data) });
export const updateChemical = (id, data) => fetchApi(`/chemicals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteChemical = (id) => fetchApi(`/chemicals/${id}`, { method: 'DELETE' });

// Equipment
export const getEquipment = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/equipment${query ? `?${query}` : ''}`);
};
export const getEquipmentById = (id) => fetchApi(`/equipment/${id}`);
export const createEquipment = (data) => fetchApi('/equipment', { method: 'POST', body: JSON.stringify(data) });
export const updateEquipment = (id, data) => fetchApi(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEquipment = (id) => fetchApi(`/equipment/${id}`, { method: 'DELETE' });

// Locations
export const getLocations = () => fetchApi('/locations');
export const createLocation = (data) => fetchApi('/locations', { method: 'POST', body: JSON.stringify(data) });
export const deleteLocation = (id) => fetchApi(`/locations/${id}`, { method: 'DELETE' });

// Reservations
export const getReservations = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/reservations${query ? `?${query}` : ''}`);
};
export const createReservation = (data) => fetchApi('/reservations', { method: 'POST', body: JSON.stringify(data) });
export const updateReservation = (id, data) => fetchApi(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteReservation = (id) => fetchApi(`/reservations/${id}`, { method: 'DELETE' });

// Import
export async function importFile(type, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/import/${type}`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Import failed' }));
    throw new Error(error.error);
  }
  
  return response.json();
}
