# Kuang Lab Inventory System

A comprehensive lab chemical and equipment inventory management system for the Kuang Research Lab at UW-Madison.

🌐 **Live Demo**: [https://dibisa.github.io/kuanglab-inventory/](https://dibisa.github.io/kuanglab-inventory/)

> **Note**: The public demo uses sample data only. Actual lab inventory data is private and not included in this repository.

## Features

- 🧪 **Chemical Inventory** - Track chemicals with CAS numbers, SDS links, hazard info
- 🔬 **Equipment Management** - Lab instruments with specifications (range, accuracy, resolution)
- 📅 **Reservation System** - Calendar-based equipment booking
- 💰 **Budget Tracking** - Financial overview with category breakdowns
- 📦 **Consumables** - Lab supplies organized by category
- 📍 **Location Management** - Track storage locations

## Quick Start

### Local Development

1. **Install dependencies**
   ```bash
   cd client
   npm install
   
   cd ../server
   npm install
   ```

2. **Start the backend server**
   ```bash
   cd server
   node index.js
   ```
   Server runs at http://localhost:3001

3. **Start the frontend**
   ```bash
   cd client
   npm run dev
   ```
   Frontend runs at http://localhost:5173

## Deployment to GitHub Pages

### Option 1: Automatic (GitHub Actions)

1. Create a GitHub repository named `kuanglab-inventory`
2. Push this code to the `main` branch
3. Go to Settings → Pages → Source: GitHub Actions
4. The site will deploy automatically at `https://yourusername.github.io/kuanglab-inventory/`

### Option 2: Manual

1. Build the static site:
   ```bash
   cd client
   npm run build
   ```

2. Deploy the `dist` folder to GitHub Pages

## Project Structure

```
Chemical Inventory/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service
│   │   ├── App.jsx        # Main app with routing
│   │   └── index.css      # Styles
│   └── public/
│       └── data.json      # Static data for GitHub Pages
├── server/                 # Express.js backend
│   ├── index.js           # API server
│   └── inventory.db       # SQLite database
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Actions deployment
```

## Tech Stack

- **Frontend**: React 19, React Router 7, Vite 6, Lucide React
- **Backend**: Express.js, sql.js (SQLite)
- **Styling**: Custom CSS with CSS variables
- **Deployment**: GitHub Pages with GitHub Actions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/chemicals` | List all chemicals |
| GET | `/api/chemicals/:id` | Get chemical details |
| POST | `/api/chemicals` | Add new chemical |
| PUT | `/api/chemicals/:id` | Update chemical |
| DELETE | `/api/chemicals/:id` | Delete chemical |
| GET | `/api/equipment` | List all equipment |
| GET | `/api/reservations` | List reservations |
| POST | `/api/reservations` | Create reservation |
| GET | `/api/budget` | Budget items |
| GET | `/api/consumables` | Consumables |

## Data Sources

- Chemical data imported from lab Excel inventory
- Equipment specifications from [AM2 Facilities](https://am2.engr.wisc.edu/facilities/)
- SDS links from Sigma-Aldrich, Fisher Scientific, and manufacturer sites

## License

MIT License - Kuang Research Lab, University of Wisconsin-Madison
