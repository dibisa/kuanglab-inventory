"""
Import organized data from the Excel file into the SQLite database
"""

import pandas as pd
import sqlite3
import os

# File paths
excel_file = r"C:\Users\dibis\OneDrive\Desktop\Chemical Inventory\Organized_Inventory.xlsx"
db_path = r"C:\Users\dibis\OneDrive\Desktop\Chemical Inventory\server\inventory.db"

print("Importing data into database...")

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

# Commit and close
conn.commit()
conn.close()

print("\nImport complete!")
print(f"Database: {db_path}")
