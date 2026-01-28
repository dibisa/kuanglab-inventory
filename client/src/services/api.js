// API service that works both in development (with backend) and production (static data)

const isDev = import.meta.env.DEV;
const BASE_URL = isDev ? '/api' : '';

let staticData = null;

async function loadStaticData() {
  if (staticData) return staticData;
  
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data.json`);
    staticData = await response.json();
    return staticData;
  } catch (error) {
    console.error('Failed to load static data:', error);
    return { chemicals: [], equipment: [], locations: [], reservations: [], budget_items: [], consumables: [] };
  }
}

// Generic fetch with fallback
async function fetchWithFallback(endpoint, staticKey) {
  if (isDev) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`API call failed, falling back to static data: ${error.message}`);
    }
  }
  
  const data = await loadStaticData();
  return data[staticKey] || [];
}

// API functions
export const api = {
  // Stats
  async getStats() {
    if (isDev) {
      try {
        const response = await fetch(`${BASE_URL}/stats`);
        if (response.ok) return await response.json();
      } catch (error) {
        console.warn('Stats API failed, using static data');
      }
    }
    
    const data = await loadStaticData();
    return {
      chemicals: data.chemicals?.length || 0,
      equipment: data.equipment?.length || 0,
      locations: data.locations?.length || 0,
      reservations: data.reservations?.length || 0,
    };
  },

  // Chemicals
  async getChemicals() {
    return fetchWithFallback('/chemicals', 'chemicals');
  },

  async getChemical(id) {
    if (isDev) {
      try {
        const response = await fetch(`${BASE_URL}/chemicals/${id}`);
        if (response.ok) return await response.json();
      } catch (error) {}
    }
    const data = await loadStaticData();
    return data.chemicals?.find(c => c.id === parseInt(id));
  },

  async createChemical(chemical) {
    if (!isDev) throw new Error('Cannot create in read-only mode');
    const response = await fetch(`${BASE_URL}/chemicals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chemical),
    });
    return response.json();
  },

  async updateChemical(id, chemical) {
    if (!isDev) throw new Error('Cannot update in read-only mode');
    const response = await fetch(`${BASE_URL}/chemicals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chemical),
    });
    return response.json();
  },

  async deleteChemical(id) {
    if (!isDev) throw new Error('Cannot delete in read-only mode');
    return fetch(`${BASE_URL}/chemicals/${id}`, { method: 'DELETE' });
  },

  // Equipment
  async getEquipment() {
    return fetchWithFallback('/equipment', 'equipment');
  },

  async getEquipmentById(id) {
    if (isDev) {
      try {
        const response = await fetch(`${BASE_URL}/equipment/${id}`);
        if (response.ok) return await response.json();
      } catch (error) {}
    }
    const data = await loadStaticData();
    return data.equipment?.find(e => e.id === parseInt(id));
  },

  async createEquipment(equipment) {
    if (!isDev) throw new Error('Cannot create in read-only mode');
    const response = await fetch(`${BASE_URL}/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipment),
    });
    return response.json();
  },

  async updateEquipment(id, equipment) {
    if (!isDev) throw new Error('Cannot update in read-only mode');
    const response = await fetch(`${BASE_URL}/equipment/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipment),
    });
    return response.json();
  },

  async deleteEquipment(id) {
    if (!isDev) throw new Error('Cannot delete in read-only mode');
    return fetch(`${BASE_URL}/equipment/${id}`, { method: 'DELETE' });
  },

  // Locations
  async getLocations() {
    return fetchWithFallback('/locations', 'locations');
  },

  async createLocation(location) {
    if (!isDev) throw new Error('Cannot create in read-only mode');
    const response = await fetch(`${BASE_URL}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location),
    });
    return response.json();
  },

  // Reservations
  async getReservations() {
    return fetchWithFallback('/reservations', 'reservations');
  },

  async createReservation(reservation) {
    if (!isDev) throw new Error('Cannot create in read-only mode');
    const response = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    });
    return response.json();
  },

  async updateReservation(id, reservation) {
    if (!isDev) throw new Error('Cannot update in read-only mode');
    const response = await fetch(`${BASE_URL}/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    });
    return response.json();
  },

  async deleteReservation(id) {
    if (!isDev) throw new Error('Cannot delete in read-only mode');
    return fetch(`${BASE_URL}/reservations/${id}`, { method: 'DELETE' });
  },

  // Budget
  async getBudgetItems() {
    return fetchWithFallback('/budget', 'budget_items');
  },

  // Consumables
  async getConsumables() {
    return fetchWithFallback('/consumables', 'consumables');
  },
};

export default api;
