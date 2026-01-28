"""
Import all data into the SQLite database including:
- Chemicals from organized Excel
- Budget items
- Consumables  
- Lab instruments from Kuang Lab facilities
"""

import pandas as pd
import sqlite3
import os

# File paths
excel_file = r"C:\Users\dibis\OneDrive\Desktop\Chemical Inventory\Organized_Inventory.xlsx"
db_path = r"C:\Users\dibis\OneDrive\Desktop\Chemical Inventory\server\inventory.db"

print("Importing data into database...")
print(f"Database path: {db_path}")

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# ============================================================
# Import Budget Items
# ============================================================
print("\n1. Importing budget items...")

df_budget = pd.read_excel(excel_file, sheet_name='Budget Details')

# Clear existing budget items
cursor.execute("DELETE FROM budget_items")

# Insert budget items
for _, row in df_budget.iterrows():
    cursor.execute("""
        INSERT INTO budget_items (category, item, vendor_model, description, cost)
        VALUES (?, ?, ?, ?, ?)
    """, (
        row['category'],
        row['item'],
        row['vendor_model'] if pd.notna(row['vendor_model']) else '',
        row['description'] if pd.notna(row['description']) else '',
        float(row['cost']) if pd.notna(row['cost']) else 0
    ))

print(f"   Imported {len(df_budget)} budget items")

# ============================================================
# Import Consumables
# ============================================================
print("\n2. Importing consumables...")

df_cons = pd.read_excel(excel_file, sheet_name='Consumables')

# Clear existing consumables
cursor.execute("DELETE FROM consumables")

# Insert consumables
for _, row in df_cons.iterrows():
    cursor.execute("""
        INSERT INTO consumables (category, item, vendor, estimated_cost)
        VALUES (?, ?, ?, ?)
    """, (
        row['category'],
        row['item'],
        row['vendor'] if pd.notna(row['vendor']) else '',
        float(row['estimated_cost']) if pd.notna(row['estimated_cost']) else 0
    ))

print(f"   Imported {len(df_cons)} consumable items")

# ============================================================
# Import Chemicals
# ============================================================
print("\n3. Importing chemicals...")

df_chem = pd.read_excel(excel_file, sheet_name='Chemicals')

# Clear existing chemicals
cursor.execute("DELETE FROM chemicals")

# Insert chemicals
for _, row in df_chem.iterrows():
    cursor.execute("""
        INSERT INTO chemicals (name, cas_number, category, supplier, catalog_number, 
                               quantity, unit, molecular_weight, notes, sds_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        row['name'],
        row['cas_number'] if pd.notna(row['cas_number']) else '',
        row['category'] if pd.notna(row['category']) else 'Uncategorized',
        row['vendor'] if pd.notna(row['vendor']) else '',
        row['catalog_number'] if pd.notna(row['catalog_number']) else '',
        int(row['quantity']) if pd.notna(row['quantity']) else 0,
        row['unit'] if pd.notna(row['unit']) else '',
        float(row['molecular_weight']) if pd.notna(row['molecular_weight']) and row['molecular_weight'] != '' else None,
        f"Location: {row['location']}" if pd.notna(row['location']) and row['location'] != '' else '',
        row['link'] if pd.notna(row['link']) else ''
    ))

print(f"   Imported {len(df_chem)} chemicals")

# ============================================================
# Import Lab Instruments (Kuang Lab Facilities)
# ============================================================
print("\n4. Importing lab instruments...")

# Clear existing equipment
cursor.execute("DELETE FROM equipment")

# Kuang Lab instruments from https://am2.engr.wisc.edu/facilities/
instruments = [
    {
        "name": "Discovery Hybrid Rheometer",
        "model": "DHR20",
        "manufacturer": "TA Instruments",
        "category": "Characterization",
        "status": "available",
        "measurement_range": "Torque: 0.5 nN·m to 200 mN·m",
        "accuracy": "Torque: ± 2 nN·m",
        "resolution": "0.1 nN·m",
        "measurement_units": "Pa·s, Pa, N·m",
        "limitations": "Sample size dependent on geometry",
        "notes": "Measure polymer mechanical and rheological properties"
    },
    {
        "name": "Home-made Focused Ultrasound (FUS) 3D Bioprinter",
        "model": "Custom Built",
        "manufacturer": "Kuang Lab",
        "category": "Manufacturing",
        "status": "available",
        "measurement_range": "Build volume: customizable",
        "accuracy": "Position: ± 50 μm",
        "resolution": "Layer thickness: 50-500 μm",
        "measurement_units": "mm, μm",
        "limitations": "Material compatibility dependent on acoustic properties",
        "notes": "Ultrasound-based bioprinting for tissue engineering"
    },
    {
        "name": "Digital Light Processing (DLP) 3D Printer",
        "model": "Custom Built (405 nm, RGB)",
        "manufacturer": "Kuang Lab",
        "category": "Manufacturing",
        "status": "available",
        "measurement_range": "Build volume: dependent on projector",
        "accuracy": "XY: ± 25 μm",
        "resolution": "XY: 25-50 μm, Z: 10-100 μm",
        "measurement_units": "μm",
        "limitations": "Photocurable resins only",
        "notes": "Multi-wavelength (405nm, RGB) for advanced photopolymerization"
    },
    {
        "name": "Dual-element Transducer",
        "model": "5 MHz",
        "manufacturer": "Olympus",
        "category": "Ultrasound",
        "status": "available",
        "measurement_range": "Frequency: 5 MHz",
        "accuracy": "± 0.1 MHz",
        "resolution": "Axial: ~0.3 mm",
        "measurement_units": "MHz, mm",
        "limitations": "Contact-based measurement",
        "notes": "For thickness measurement and material characterization"
    },
    {
        "name": "Ultrasound Imaging Probe (64-element Linear Array)",
        "model": "IP-105",
        "manufacturer": "Sonic Concepts",
        "category": "Ultrasound",
        "status": "available",
        "measurement_range": "64 elements, variable frequency",
        "accuracy": "Spatial resolution dependent on frequency",
        "resolution": "Lateral: 0.3-1 mm",
        "measurement_units": "MHz, mm",
        "limitations": "Requires Vantage platform",
        "notes": "Real-time ultrasound imaging"
    },
    {
        "name": "Vantage Platform for Ultrasound Imaging Control",
        "model": "Vantage 64LE",
        "manufacturer": "Verasonics",
        "category": "Ultrasound",
        "status": "available",
        "measurement_range": "64 independent transmit/receive channels",
        "accuracy": "Timing: < 5 ns",
        "resolution": "12-bit A/D conversion",
        "measurement_units": "channels, ns",
        "limitations": "Requires compatible transducers",
        "notes": "Programmable ultrasound research platform"
    },
    {
        "name": "Upright Fluorescence Microscope",
        "model": "BX61",
        "manufacturer": "Olympus",
        "category": "Imaging",
        "status": "available",
        "measurement_range": "4x - 100x magnification",
        "accuracy": "Stage: ± 1 μm",
        "resolution": "Optical: 0.2 μm (at 100x)",
        "measurement_units": "μm",
        "limitations": "Sample thickness limited by working distance",
        "notes": "Phase contrast and polarization capabilities"
    },
    {
        "name": "Single-element Focused Ultrasound Transducer (2.0 MHz, 3rd Harmonic)",
        "model": "H461",
        "manufacturer": "Sonic Concepts",
        "category": "Ultrasound",
        "status": "available",
        "measurement_range": "Fundamental: 2.0 MHz, 3rd Harmonic: 6.0 MHz",
        "accuracy": "Frequency: ± 2%",
        "resolution": "Focal spot: ~1 mm diameter",
        "measurement_units": "MHz, mm, W",
        "limitations": "Fixed focal length",
        "notes": "High-intensity focused ultrasound applications"
    },
    {
        "name": "Single-element Focused Ultrasound Transducer",
        "model": "SU101",
        "manufacturer": "Sonic Concepts",
        "category": "Ultrasound",
        "status": "available",
        "measurement_range": "Fundamental: 2.0 MHz, 3rd Harmonic: 6.0 MHz",
        "accuracy": "Frequency: ± 2%",
        "resolution": "Focal spot: ~1-2 mm diameter",
        "measurement_units": "MHz, mm, W",
        "limitations": "Fixed focal length",
        "notes": "Focused ultrasound for materials processing"
    },
    {
        "name": "RF Wattmeter",
        "model": "Model 23B",
        "manufacturer": "Sonic Concepts",
        "category": "Electronics",
        "status": "available",
        "measurement_range": "0-100 W",
        "accuracy": "± 5%",
        "resolution": "0.1 W",
        "measurement_units": "W",
        "limitations": "Frequency range dependent",
        "notes": "RF power measurement for transducer calibration"
    },
    {
        "name": "Function Generator",
        "model": "DG2052 / DG852 Pro",
        "manufacturer": "RIGOL",
        "category": "Electronics",
        "status": "available",
        "measurement_range": "1 μHz - 50 MHz (DG2052), 1 μHz - 25 MHz (DG852)",
        "accuracy": "Frequency: ± 1 ppm",
        "resolution": "1 μHz",
        "measurement_units": "Hz, V, s",
        "limitations": "Output impedance: 50 Ω",
        "notes": "Arbitrary waveform generation for ultrasound driving"
    },
    {
        "name": "RF Amplifier/Generator",
        "model": "AG 1016",
        "manufacturer": "T&C Power Conversion, Inc.",
        "category": "Electronics",
        "status": "available",
        "measurement_range": "10 kHz - 250 MHz, up to 16 W",
        "accuracy": "Gain: ± 1 dB",
        "resolution": "0.1 dB",
        "measurement_units": "W, dB, MHz",
        "limitations": "Continuous duty cycle limitations",
        "notes": "Power amplification for ultrasound transducers"
    },
    {
        "name": "Broadband Mini-Amplifier",
        "model": "ZFL-500-BNC",
        "manufacturer": "Mini-Circuits",
        "category": "Electronics",
        "status": "available",
        "measurement_range": "0.05 - 500 MHz",
        "accuracy": "Gain flatness: ± 0.5 dB",
        "resolution": "N/A",
        "measurement_units": "dB, MHz",
        "limitations": "Max output: +16 dBm",
        "notes": "Signal amplification for measurement systems"
    },
    {
        "name": "Digital Oscilloscope",
        "model": "DS1104Z Plus",
        "manufacturer": "RIGOL",
        "category": "Electronics",
        "status": "available",
        "measurement_range": "100 MHz bandwidth, 1 GSa/s",
        "accuracy": "DC: ± 3%",
        "resolution": "8-bit vertical",
        "measurement_units": "V, s, Hz",
        "limitations": "4 channels",
        "notes": "Record electrical signals for ultrasound systems"
    },
    {
        "name": "Dell Precision Workstation",
        "model": "Precision 3680 Tower",
        "manufacturer": "Dell NASPO",
        "category": "Computing",
        "status": "available",
        "measurement_range": "N/A",
        "accuracy": "N/A",
        "resolution": "N/A",
        "measurement_units": "N/A",
        "limitations": "N/A",
        "notes": "High-performance computing for data analysis and simulations"
    },
    {
        "name": "Magnetic Stirring Hotplate with Sensor",
        "model": "RET control-visc",
        "manufacturer": "IKA",
        "category": "Sample Preparation",
        "status": "available",
        "measurement_range": "Temp: 0-340°C, Speed: 0-1700 rpm",
        "accuracy": "Temp: ± 1°C",
        "resolution": "Temp: 1°C, Speed: 10 rpm",
        "measurement_units": "°C, rpm",
        "limitations": "Max stirring volume dependent on viscosity",
        "notes": "Precise temperature control with external sensor"
    },
    {
        "name": "Digital Camera",
        "model": "D90",
        "manufacturer": "Nikon",
        "category": "Imaging",
        "status": "available",
        "measurement_range": "12.3 MP, ISO 200-3200",
        "accuracy": "N/A",
        "resolution": "4288 x 2848 pixels",
        "measurement_units": "pixels",
        "limitations": "Video: 720p max",
        "notes": "Sample imaging and documentation"
    },
    {
        "name": "Single Syringe Pump",
        "model": "NE-1000",
        "manufacturer": "New Era Pump Systems, Inc.",
        "category": "Sample Preparation",
        "status": "available",
        "measurement_range": "0.73 μL/hr - 2120 mL/hr",
        "accuracy": "± 1%",
        "resolution": "0.001 μL",
        "measurement_units": "μL/hr, mL/hr",
        "limitations": "Syringe size: 0.5 μL - 140 mL",
        "notes": "Precision fluid delivery for bioprinting and experiments"
    },
    {
        "name": "Benchtop Centrifuge",
        "model": "Allegra V-15R",
        "manufacturer": "Beckman Coulter Life Sciences",
        "category": "Sample Preparation",
        "status": "available",
        "measurement_range": "200-15,000 rpm (21,000 x g max)",
        "accuracy": "Speed: ± 20 rpm",
        "resolution": "10 rpm",
        "measurement_units": "rpm, x g",
        "limitations": "Max volume per run: 4 x 750 mL",
        "notes": "Refrigerated centrifuge for sample separation"
    },
    {
        "name": "OmniCure UV Lamp",
        "model": "S2000 ELITE",
        "manufacturer": "Excelitas",
        "category": "Manufacturing",
        "status": "available",
        "measurement_range": "320-500 nm, 2-30 W/cm²",
        "accuracy": "Intensity: ± 5%",
        "resolution": "1% intensity adjustment",
        "measurement_units": "W/cm², nm",
        "limitations": "Spot curing only",
        "notes": "UV curing for photopolymerization"
    },
    {
        "name": "Analytical Balance",
        "model": "MX105",
        "manufacturer": "METTLER TOLEDO",
        "category": "Measurement",
        "status": "available",
        "measurement_range": "0-120 g",
        "accuracy": "± 0.01 mg",
        "resolution": "0.01 mg",
        "measurement_units": "mg, g",
        "limitations": "Draft shield required for high precision",
        "notes": "Semi-micro analytical balance for precise weighing"
    },
    {
        "name": "Benchtop Centrifuge (3L)",
        "model": "Allegra V-15R",
        "manufacturer": "Beckman Coulter",
        "category": "Sample Preparation",
        "status": "available",
        "measurement_range": "200-15,000 rpm",
        "accuracy": "Speed: ± 20 rpm",
        "resolution": "10 rpm",
        "measurement_units": "rpm, x g",
        "limitations": "3 L total capacity",
        "notes": "Refrigerated benchtop centrifuge"
    },
    {
        "name": "Benchtop Freeze-Dryer (4L)",
        "model": "FreeZone",
        "manufacturer": "Labconco",
        "category": "Sample Preparation",
        "status": "available",
        "measurement_range": "Collector temp: -50°C, Vacuum: < 0.133 mBar",
        "accuracy": "Temp: ± 2°C",
        "resolution": "1°C",
        "measurement_units": "°C, mBar",
        "limitations": "4 L ice capacity",
        "notes": "Lyophilization for sample preservation"
    },
    {
        "name": "Temperature and Environmental Control Stage",
        "model": "TMS600",
        "manufacturer": "LINKAM",
        "category": "Characterization",
        "status": "available",
        "measurement_range": "-196°C to 600°C",
        "accuracy": "± 0.1°C",
        "resolution": "0.01°C",
        "measurement_units": "°C, °C/min",
        "limitations": "Sample size limited by stage opening",
        "notes": "Microscopy heating/cooling stage with precise control"
    },
    {
        "name": "Contact Temperature Oven",
        "model": "DKN612C",
        "manufacturer": "Yamato Scientific",
        "category": "Sample Preparation",
        "status": "available",
        "measurement_range": "Ambient +10 to 260°C",
        "accuracy": "± 1°C",
        "resolution": "1°C",
        "measurement_units": "°C",
        "limitations": "Natural convection",
        "notes": "Gravity convection oven for heating and drying"
    }
]

for inst in instruments:
    cursor.execute("""
        INSERT INTO equipment (name, model, manufacturer, category, status, 
                               measurement_range, accuracy, resolution, 
                               measurement_units, limitations, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inst['name'],
        inst['model'],
        inst['manufacturer'],
        inst['category'],
        inst['status'],
        inst['measurement_range'],
        inst['accuracy'],
        inst['resolution'],
        inst['measurement_units'],
        inst['limitations'],
        inst['notes']
    ))

print(f"   Imported {len(instruments)} instruments")

# ============================================================
# Add some storage locations
# ============================================================
print("\n5. Adding storage locations...")

cursor.execute("DELETE FROM locations")

locations = [
    ("Engineering Hall", "1234", "Flammable Cabinet", "A", None),
    ("Engineering Hall", "1234", "Chemical Storage", "1", None),
    ("Engineering Hall", "1234", "Refrigerator", None, None),
    ("Engineering Hall", "1234", "Freezer -20C", None, None),
    ("Engineering Hall", "1234", "Benchtop", None, None),
    ("Engineering Hall", "1234", "Fume Hood", None, None),
]

for loc in locations:
    cursor.execute("""
        INSERT INTO locations (building, room, cabinet, shelf, bin)
        VALUES (?, ?, ?, ?, ?)
    """, loc)

print(f"   Added {len(locations)} locations")

# Commit and close
conn.commit()
conn.close()

print("\n" + "="*50)
print("IMPORT COMPLETE!")
print("="*50)
print(f"  Chemicals: {len(df_chem)}")
print(f"  Instruments: {len(instruments)}")
print(f"  Budget Items: {len(df_budget)}")
print(f"  Consumables: {len(df_cons)}")
print(f"  Locations: {len(locations)}")
