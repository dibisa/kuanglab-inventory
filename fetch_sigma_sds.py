import pandas as pd
import json
import requests
from bs4 import BeautifulSoup
import time

# Load your chemicals data (from Excel or JSON)
EXCEL_PATH = 'Organized_Inventory.xlsx'
JSON_PATH = 'client/public/data.json'
OUTPUT_PATH = 'client/public/data_with_sds.json'

# Try to load from Excel first, fallback to JSON
try:
    df = pd.read_excel(EXCEL_PATH)
    chemicals = df.to_dict(orient='records')
except Exception:
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        chemicals = json.load(f)

# Helper to fetch SDS link from Sigma-Aldrich
SIGMA_SEARCH_URL = 'https://www.sigmaaldrich.com/US/en/search/{}?focus=products&page=1&perPage=10&sort=relevance&term={}&type=product'
SIGMA_BASE = 'https://www.sigmaaldrich.com'

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

def fetch_sigma_sds_url(cas):
    try:
        url = SIGMA_SEARCH_URL.format(cas, cas)
        resp = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(resp.text, 'html.parser')
        # Find first product link
        prod_link = soup.find('a', {'data-testid': 'product-title-link'})
        if not prod_link:
            return None
        prod_url = SIGMA_BASE + prod_link['href']
        prod_resp = requests.get(prod_url, headers=headers, timeout=10)
        prod_soup = BeautifulSoup(prod_resp.text, 'html.parser')
        # Find SDS link
        sds_link = prod_soup.find('a', string=lambda s: s and 'Safety Data Sheet' in s)
        if sds_link:
            return SIGMA_BASE + sds_link['href']
        # Sometimes SDS is in a button or different place
        sds_btn = prod_soup.find('a', {'data-testid': 'sds-link'})
        if sds_btn:
            return SIGMA_BASE + sds_btn['href']
        return None
    except Exception as e:
        print(f"Error fetching SDS for CAS {cas}: {e}")
        return None

# Main loop: update chemicals with SDS URLs
for chem in chemicals:
    cas = str(chem.get('cas_number', '')).strip()
    if cas and not chem.get('sds_url'):
        print(f"Looking up SDS for CAS {cas}...")
        sds_url = fetch_sigma_sds_url(cas)
        if sds_url:
            chem['sds_url'] = sds_url
            print(f"  Found: {sds_url}")
        else:
            print("  Not found.")
        time.sleep(2)  # Be polite to Sigma-Aldrich

# Save updated data
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(chemicals, f, ensure_ascii=False, indent=2)

print(f"Done. Updated data with SDS links saved to {OUTPUT_PATH}")
