"""
Script to organize and clean the Chemical Inventory Excel data
Creates organized sheets for:
1. Chemicals - properly formatted for the inventory system
2. Budget - financial view with categories and totals
3. Consumables - organized by category
"""

import pandas as pd
import numpy as np
from datetime import datetime

# File paths
input_file = r"C:\Users\dibis\OneDrive\Desktop\Chemical Inventory\XiaoKuang_Chemical_Inventory.xlsx"
output_file = r"C:\Users\dibis\OneDrive\Desktop\Chemical Inventory\Organized_Inventory.xlsx"

print("Reading Excel file...")

# ============================================================
# 1. CHEMICALS SHEET - Organize and clean
# ============================================================
print("\n1. Processing Chemicals sheet...")

df_chem_raw = pd.read_excel(input_file, sheet_name='3_Chemicals&Reagents')

# The actual data starts at row 1 (after header row 0)
# Column mapping based on the structure:
# Unnamed: 0 = Category (Presusors/polymers, Reagents, Initiators, etc.)
# Unnamed: 1 = Amount on hand
# Unnamed: 2 = Date Open
# Unnamed: 3 = Name
# Unnamed: 4 = Vendor
# Unnamed: 5 = Quantity  
# Unnamed: 6 = CAS no.
# Unnamed: 7 = cat. no. (catalog number)
# Unnamed: 8 = Size/quantity
# Location = Location
# Unnamed: 10 = Molecule Weight
# Unnamed: 12 = Estimated Costs
# Unnamed: 13 = Link

# Create cleaned chemicals dataframe
chemicals = []
current_category = "Uncategorized"

for idx, row in df_chem_raw.iterrows():
    if idx == 0:  # Skip header row
        continue
    
    name = row['Unnamed: 3']
    
    # Skip empty rows
    if pd.isna(name) or str(name).strip() == '':
        continue
    
    # Check if this row has a category label in first column
    cat_cell = row['Unnamed: 0']
    if pd.notna(cat_cell) and str(cat_cell).strip() != '':
        cat_str = str(cat_cell).strip()
        # These are category headers
        if cat_str in ['Presusors/polymers', 'Reagents', 'Initiators', 'Acrylate/acryamide', 
                       'Solvent', 'Fillers and particles', 'Surfactant', 'Wax', 'Liposome']:
            current_category = cat_str
    
    # Parse quantity on hand
    qty_on_hand = row['Unnamed: 1']
    if pd.isna(qty_on_hand) or str(qty_on_hand).strip() in ['', '`']:
        qty_on_hand = 0
    else:
        try:
            qty_on_hand = int(float(str(qty_on_hand).strip()))
        except:
            qty_on_hand = 0
    
    # Parse date opened
    date_open = row['Unnamed: 2']
    if pd.notna(date_open):
        if isinstance(date_open, datetime):
            date_open = date_open.strftime('%Y-%m-%d')
        else:
            date_open = str(date_open).strip()
    else:
        date_open = ''
    
    # Parse CAS number - clean up
    cas = row['Unnamed: 6']
    if pd.notna(cas):
        cas = str(cas).strip().replace('\n', '').lstrip('0')
        # Remove date-like CAS numbers (parsing errors)
        if ' 00:00:00' in cas:
            cas = cas.replace(' 00:00:00', '')
    else:
        cas = ''
    
    # Parse molecular weight
    mw = row['Unnamed: 10']
    if pd.notna(mw):
        mw_str = str(mw).strip()
        # Handle special cases like "4000k", "100k"
        if mw_str.endswith('k'):
            try:
                mw = float(mw_str[:-1]) * 1000
            except:
                mw = ''
        else:
            try:
                mw = float(mw_str)
            except:
                mw = ''
    else:
        mw = ''
    
    # Parse cost
    cost = row['Unnamed: 12']
    if pd.notna(cost):
        try:
            cost = float(cost)
        except:
            cost = ''
    else:
        cost = ''
    
    # Build chemical record
    chemical = {
        'name': str(name).strip(),
        'category': current_category,
        'cas_number': cas,
        'vendor': str(row['Unnamed: 4']).strip() if pd.notna(row['Unnamed: 4']) else '',
        'catalog_number': str(row['Unnamed: 7']).strip() if pd.notna(row['Unnamed: 7']) else '',
        'quantity': qty_on_hand,
        'unit': str(row['Unnamed: 8']).strip() if pd.notna(row['Unnamed: 8']) else '',
        'molecular_weight': mw,
        'location': str(row['Location']).strip() if pd.notna(row['Location']) else '',
        'date_opened': date_open,
        'estimated_cost': cost,
        'link': str(row['Unnamed: 13']).strip() if pd.notna(row['Unnamed: 13']) else ''
    }
    chemicals.append(chemical)

df_chemicals = pd.DataFrame(chemicals)

# Clean up vendor names
df_chemicals['vendor'] = df_chemicals['vendor'].replace({
    'nan': '',
    'Sigma-Aldrich': 'Sigma-Aldrich',
    'Sigma Aldrich': 'Sigma-Aldrich',
    'SIGMA': 'Sigma-Aldrich',
    'SIGMA ALDRICH': 'Sigma-Aldrich',
    'Sigma Aldrich ': 'Sigma-Aldrich',
    'Sigma-Aldrich ': 'Sigma-Aldrich',
    'Fisher Scientific': 'Fisher Scientific',
    'FISHER SCIENTIFIC': 'Fisher Scientific',
    'Thermo Scientific': 'Thermo Scientific',
    'Thermo fisher': 'Thermo Fisher'
})

# Clean up categories
category_map = {
    'Presusors/polymers': 'Precursors & Polymers',
    'Reagents': 'Reagents',
    'Initiators': 'Initiators',
    'Acrylate/acryamide': 'Acrylates & Acrylamides',
    'Solvent': 'Solvents',
    'Fillers and particles': 'Fillers & Particles',
    'Surfactant': 'Surfactants',
    'Wax': 'Waxes',
    'Liposome': 'Liposomes'
}
df_chemicals['category'] = df_chemicals['category'].map(category_map).fillna(df_chemicals['category'])

# Clean location
df_chemicals['location'] = df_chemicals['location'].replace({'nan': '', 'flamable cabnet': 'Flammable Cabinet'})

print(f"   Processed {len(df_chemicals)} chemicals")
print(f"   Categories: {df_chemicals['category'].unique().tolist()}")

# ============================================================
# 2. BUDGET SHEET - Create financial view
# ============================================================
print("\n2. Processing Budget sheet...")

df_budget_raw = pd.read_excel(input_file, sheet_name='1_Overall Budget ')

# Parse budget data into structured format
budget_items = []
current_category = ""

for idx, row in df_budget_raw.iterrows():
    if idx < 10:  # Skip header rows
        continue
    
    cat_cell = row['Unnamed: 0']
    content = row['Unnamed: 1']
    vendor_model = row['Unnamed: 2']
    description = row['Unnamed: 3']
    cost = row['Unnamed: 4']
    
    # Track category from first column
    if pd.notna(cat_cell) and str(cat_cell).strip() != '':
        cat_str = str(cat_cell).strip()
        if cat_str not in ['NaN', 'and']:
            current_category = cat_str
    
    # Skip rows without content or cost
    if pd.isna(content) or str(content).strip() == '' or str(content) == 'nan':
        continue
    
    # Parse cost
    if pd.notna(cost):
        try:
            cost_val = float(cost)
            if cost_val > 0:
                budget_items.append({
                    'category': current_category,
                    'item': str(content).strip(),
                    'vendor_model': str(vendor_model).strip() if pd.notna(vendor_model) else '',
                    'description': str(description).strip() if pd.notna(description) else '',
                    'cost': cost_val
                })
        except:
            pass

df_budget = pd.DataFrame(budget_items)

# Clean up categories
budget_category_map = {
    'Utrasound imgaing/printing equipment': 'Ultrasound Imaging/Printing Equipment',
    'Material preparation equipment': 'Material Preparation Equipment',
    'Material characterization equipment': 'Material Characterization Equipment',
    'Cell culture': 'Cell Culture & Animal Experiments',
    'use of shared': 'Shared Facility Usage',
    'access to a departmental': 'Departmental Machine Shop',
    'Common equipment': 'Common Equipment',
    'Safety equipment': 'Safety Equipment',
    'Supplies': 'Supplies',
    'Office': 'Office & Computing',
    'Personnel': 'Personnel'
}

df_budget['category'] = df_budget['category'].replace(budget_category_map)

# Create summary by category
budget_summary = df_budget.groupby('category').agg({
    'cost': 'sum',
    'item': 'count'
}).rename(columns={'cost': 'total_cost', 'item': 'item_count'}).reset_index()
budget_summary = budget_summary.sort_values('total_cost', ascending=False)

print(f"   Processed {len(df_budget)} budget items")
print(f"   Total budget: ${df_budget['cost'].sum():,.2f}")

# ============================================================
# 3. CONSUMABLES SHEET - Organize by category
# ============================================================
print("\n3. Processing Consumables sheet...")

df_cons_raw = pd.read_excel(input_file, sheet_name='2_Consumables')

consumables = []
current_category = "General"

for idx, row in df_cons_raw.iterrows():
    if idx == 0:  # Skip header
        continue
    
    cat_cell = row['Unnamed: 0']
    content = row['Unnamed: 1']
    vendor = row['Unnamed: 2']
    cost = row['Unnamed: 3']
    
    # Track category
    if pd.notna(cat_cell) and str(cat_cell).strip() != '':
        current_category = str(cat_cell).strip()
    
    # Skip empty rows
    if pd.isna(content) or str(content).strip() == '' or str(content) == 'nan':
        continue
    
    # Parse cost
    cost_val = 0
    if pd.notna(cost):
        try:
            cost_val = float(cost)
        except:
            cost_val = 0
    
    consumables.append({
        'category': current_category,
        'item': str(content).strip(),
        'vendor': str(vendor).strip() if pd.notna(vendor) else '',
        'estimated_cost': cost_val
    })

df_consumables = pd.DataFrame(consumables)

# Filter out summary rows
df_consumables = df_consumables[~df_consumables['item'].str.contains('Other general consumables', na=False)]

# Create consumables summary
cons_summary = df_consumables.groupby('category').agg({
    'estimated_cost': 'sum',
    'item': 'count'
}).rename(columns={'estimated_cost': 'total_cost', 'item': 'item_count'}).reset_index()

print(f"   Processed {len(df_consumables)} consumable items")

# ============================================================
# 4. EXPORT TO NEW EXCEL FILE
# ============================================================
print("\n4. Creating organized Excel file...")

with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
    # Chemicals sheet - main inventory
    df_chemicals.to_excel(writer, sheet_name='Chemicals', index=False)
    
    # Budget detail sheet
    df_budget.to_excel(writer, sheet_name='Budget Details', index=False)
    
    # Budget summary sheet (financial overview)
    budget_summary.to_excel(writer, sheet_name='Budget Summary', index=False)
    
    # Consumables by category
    df_consumables.to_excel(writer, sheet_name='Consumables', index=False)
    
    # Consumables summary
    cons_summary.to_excel(writer, sheet_name='Consumables Summary', index=False)

print(f"\n✓ Organized data saved to: {output_file}")
print("\nSummary:")
print(f"  - Chemicals: {len(df_chemicals)} items in {df_chemicals['category'].nunique()} categories")
print(f"  - Budget: {len(df_budget)} items, Total: ${df_budget['cost'].sum():,.2f}")
print(f"  - Consumables: {len(df_consumables)} items in {df_consumables['category'].nunique()} categories")
