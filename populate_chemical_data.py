"""
Comprehensive Chemical Data Population Script
Adds CAS numbers, molecular weights, formulas, hazard info, and SDS links
for all chemicals in the Kuang Lab inventory.
"""

import sqlite3

db_path = r"C:\Users\dibis\OneDrive\Desktop\Chemical Inventory\server\inventory.db"

# Comprehensive chemical database with SDS links and safety info
# Format: name_key: {cas, formula, mw, hazard, storage, sds_url}
CHEMICAL_DATA = {
    # Precursors & Polymers
    "agar": {
        "cas": "9002-18-0",
        "formula": "(C12H18O9)n",
        "mw": None,  # Polymer
        "hazard": "Non-hazardous",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/a1296"
    },
    "chitosan": {
        "cas": "9012-76-4",
        "formula": "(C6H11NO4)n",
        "mw": None,
        "hazard": "Non-hazardous",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/448877"
    },
    "gelatin": {
        "cas": "9000-70-8",
        "formula": "Protein",
        "mw": None,
        "hazard": "Non-hazardous",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/g1890"
    },
    "poly(vinyl alcohol)": {
        "cas": "9002-89-5",
        "formula": "(C2H4O)n",
        "mw": 89000,
        "hazard": "Non-hazardous",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/341584"
    },
    "gellan gum": {
        "cas": "71010-52-1",
        "formula": "C24H37O20",
        "mw": 1000000,
        "hazard": "Non-hazardous",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/g1910"
    },
    "polycaprolactone": {
        "cas": "36890-68-3",
        "formula": "(C6H10O2)n",
        "mw": 530,
        "hazard": "Non-hazardous",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/189405"
    },
    "sodium alginate": {
        "cas": "9005-38-3",
        "formula": "(C6H7NaO6)n",
        "mw": None,
        "hazard": "Non-hazardous",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/71238"
    },
    "poly(ethylene glycol)": {
        "cas": "25322-68-3",
        "formula": "H(OCH2CH2)nOH",
        "mw": 8000,
        "hazard": "Non-hazardous",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/p2139"
    },
    "poly(ethylene oxide)": {
        "cas": "25322-68-3",
        "formula": "(C2H4O)n",
        "mw": 4000000,
        "hazard": "Non-hazardous",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/189464"
    },

    # Reagents
    "bismaleimide": {
        "cas": "13676-54-5",
        "formula": "C22H14N2O4",
        "mw": 358.37,
        "hazard": "Irritant",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/227463"
    },
    "epoxy": {
        "cas": "25068-38-6",
        "formula": "C21H25ClO5",
        "mw": 392.87,
        "hazard": "Irritant, Sensitizer",
        "storage": "Room temperature",
        "sds": "https://www.hexion.com/en-us/chemistry/epoxy-resins-curing-agents/sds"
    },
    "pentaerythritol tetrakis(3-mercaptopropionate)": {
        "cas": "7575-23-7",
        "formula": "C17H28O8S4",
        "mw": 488.66,
        "hazard": "Irritant, Corrosive",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/381462"
    },
    "dimethyl sulfoxide": {
        "cas": "67-68-5",
        "formula": "C2H6OS",
        "mw": 78.13,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/d8418"
    },
    "dimethyl sulfoxide-d6": {
        "cas": "2206-27-1",
        "formula": "C2D6OS",
        "mw": 84.17,
        "hazard": "Irritant",
        "storage": "Room temperature, moisture-sensitive",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/151874"
    },
    "tetramethylguanidine": {
        "cas": "80-70-6",
        "formula": "C5H13N3",
        "mw": 115.18,
        "hazard": "Corrosive, Flammable",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/241768"
    },
    "sodium tetraphenylborate": {
        "cas": "143-66-8",
        "formula": "C24H20BNa",
        "mw": 342.22,
        "hazard": "Irritant",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sial/t25402"
    },
    "1,6-hexanediol": {
        "cas": "629-11-8",
        "formula": "C6H14O2",
        "mw": 118.17,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/h11807"
    },
    "1-dodecanethiol": {
        "cas": "112-55-0",
        "formula": "C12H26S",
        "mw": 202.40,
        "hazard": "Irritant, Flammable",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/471364"
    },
    "jeffamine": {
        "cas": "9046-10-0",
        "formula": "C6H15NO2",
        "mw": 230,
        "hazard": "Corrosive, Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/406651"
    },
    "sodium thioglycolate": {
        "cas": "367-51-1",
        "formula": "C2H3NaO2S",
        "mw": 114.10,
        "hazard": "Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/t0632"
    },
    "l-cysteine hydrochloride": {
        "cas": "52-89-1",
        "formula": "C3H8ClNO2S",
        "mw": 157.62,
        "hazard": "Irritant",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/30120"
    },
    "edc": {
        "cas": "25952-53-8",
        "formula": "C8H17N3·HCl",
        "mw": 191.70,
        "hazard": "Irritant, Sensitizer",
        "storage": "Refrigerated, -20C",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/03450"
    },
    "n-hydroxysuccinimide": {
        "cas": "6066-82-6",
        "formula": "C4H5NO3",
        "mw": 115.09,
        "hazard": "Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/130672"
    },
    "tartrazine": {
        "cas": "1934-21-0",
        "formula": "C16H9N4Na3O9S2",
        "mw": 534.36,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/t0388"
    },
    "rhodamine b": {
        "cas": "81-88-9",
        "formula": "C28H31ClN2O3",
        "mw": 479.01,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/r6626"
    },
    "rose bengal": {
        "cas": "632-69-9",
        "formula": "C20H2Cl4I4Na2O5",
        "mw": 1017.64,
        "hazard": "Irritant",
        "storage": "Room temperature, protect from light",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/330000"
    },
    "lithium bromide": {
        "cas": "7550-35-8",
        "formula": "LiBr",
        "mw": 86.85,
        "hazard": "Irritant",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/213225"
    },
    "lithium chloride": {
        "cas": "7447-41-8",
        "formula": "LiCl",
        "mw": 42.39,
        "hazard": "Irritant",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/l7026"
    },
    "iron(ii) sulfate heptahydrate": {
        "cas": "7782-63-0",
        "formula": "FeSO4·7H2O",
        "mw": 278.01,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/f7002"
    },
    "bht": {
        "cas": "128-37-0",
        "formula": "C15H24O",
        "mw": 220.35,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/b1378"
    },
    "zinc acetate": {
        "cas": "557-34-6",
        "formula": "Zn(CH3COO)2",
        "mw": 183.48,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/383317"
    },
    "l-ascorbic acid": {
        "cas": "50-81-7",
        "formula": "C6H8O6",
        "mw": 176.12,
        "hazard": "Non-hazardous",
        "storage": "Refrigerated, protect from light",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/a4544"
    },
    "citric acid": {
        "cas": "77-92-9",
        "formula": "C6H8O7",
        "mw": 192.12,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.fishersci.com/store/msds?partNumber=A1039530"
    },
    "sodium bicarbonate": {
        "cas": "144-55-8",
        "formula": "NaHCO3",
        "mw": 84.01,
        "hazard": "Non-hazardous",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/s5761"
    },
    "riboflavin": {
        "cas": "83-88-5",
        "formula": "C17H20N4O6",
        "mw": 376.36,
        "hazard": "Non-hazardous",
        "storage": "Room temperature, protect from light",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/r9504"
    },
    "sunset yellow": {
        "cas": "2783-94-0",
        "formula": "C16H10N2Na2O7S2",
        "mw": 452.37,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/465224"
    },
    "sudan": {
        "cas": "842-07-9",
        "formula": "C16H12N2O",
        "mw": 248.28,
        "hazard": "Carcinogen, Mutagen",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/103624"
    },
    "calcium chloride": {
        "cas": "10035-04-8",
        "formula": "CaCl2·2H2O",
        "mw": 147.01,
        "hazard": "Irritant",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/c7902"
    },
    "sodium hydroxide": {
        "cas": "1310-73-2",
        "formula": "NaOH",
        "mw": 40.00,
        "hazard": "Corrosive",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/567530"
    },
    "hydrochloric acid": {
        "cas": "7647-01-0",
        "formula": "HCl",
        "mw": 36.46,
        "hazard": "Corrosive",
        "storage": "Corrosive cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/258148"
    },
    "sodium chloride": {
        "cas": "7647-14-5",
        "formula": "NaCl",
        "mw": 58.44,
        "hazard": "Non-hazardous",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/s7653"
    },
    "edta disodium": {
        "cas": "6381-92-6",
        "formula": "C10H14N2Na2O8·2H2O",
        "mw": 372.24,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.fishersci.com/store/msds?partNumber=AC409971000"
    },
    "alpha-tocopherol": {
        "cas": "59-02-9",
        "formula": "C29H50O2",
        "mw": 430.71,
        "hazard": "Non-hazardous",
        "storage": "Refrigerated, protect from light",
        "sds": "https://www.fishersci.com/store/msds?partNumber=AC428120250"
    },
    "trimethylolpropane triacrylate": {
        "cas": "15625-89-5",
        "formula": "C15H20O6",
        "mw": 296.32,
        "hazard": "Irritant, Sensitizer",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/246808"
    },
    "sodium persulfate": {
        "cas": "7775-27-1",
        "formula": "Na2S2O8",
        "mw": 238.10,
        "hazard": "Oxidizer, Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/216232"
    },
    "methacrylic anhydride": {
        "cas": "760-93-0",
        "formula": "C8H10O3",
        "mw": 154.16,
        "hazard": "Corrosive, Flammable",
        "storage": "Flammable cabinet, refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/276685"
    },
    "thionyl chloride": {
        "cas": "7719-09-7",
        "formula": "SOCl2",
        "mw": 118.97,
        "hazard": "Corrosive, Toxic",
        "storage": "Fume hood, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/mm/808154"
    },
    "dithiothreitol": {
        "cas": "3483-12-3",
        "formula": "C4H10O2S2",
        "mw": 154.25,
        "hazard": "Irritant",
        "storage": "Refrigerated, -20C",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/roche/10708984001"
    },
    "sodium borohydride": {
        "cas": "16940-66-2",
        "formula": "NaBH4",
        "mw": 37.83,
        "hazard": "Flammable, Corrosive, Water-reactive",
        "storage": "Flammable cabinet, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/452882"
    },
    "triethylamine": {
        "cas": "121-44-8",
        "formula": "C6H15N",
        "mw": 101.19,
        "hazard": "Flammable, Corrosive",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/90335"
    },
    "furfurylamine": {
        "cas": "617-89-0",
        "formula": "C5H7NO",
        "mw": 97.12,
        "hazard": "Flammable, Irritant",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/f20009"
    },
    "dicyandiamide": {
        "cas": "461-58-5",
        "formula": "C2H4N4",
        "mw": 84.08,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/d76609"
    },

    # Initiators
    "ammonium persulfate": {
        "cas": "7727-54-0",
        "formula": "(NH4)2S2O8",
        "mw": 228.20,
        "hazard": "Oxidizer, Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/215589"
    },
    "ketoglutaric acid": {
        "cas": "328-50-7",
        "formula": "C5H6O5",
        "mw": 146.10,
        "hazard": "Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/k1128"
    },
    "irgacure 2959": {
        "cas": "106797-53-9",
        "formula": "C12H16O4",
        "mw": 224.25,
        "hazard": "Irritant",
        "storage": "Room temperature, protect from light",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/410896"
    },
    "lap": {
        "cas": "85073-19-4",
        "formula": "C16H17LiO3P",
        "mw": 294.21,
        "hazard": "Irritant",
        "storage": "Refrigerated, protect from light",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/900889"
    },
    "aibn": {
        "cas": "78-67-1",
        "formula": "C8H12N4",
        "mw": 164.21,
        "hazard": "Flammable, Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/441090"
    },
    "irgacure 819": {
        "cas": "162881-26-7",
        "formula": "C26H27O3P",
        "mw": 418.46,
        "hazard": "Irritant",
        "storage": "Room temperature, protect from light",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/511447"
    },
    "4,4'-azobis(4-cyanovaleric acid)": {
        "cas": "2638-94-0",
        "formula": "C12H16N4O4",
        "mw": 280.28,
        "hazard": "Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/11590"
    },
    "potassium persulfate": {
        "cas": "7727-21-1",
        "formula": "K2S2O8",
        "mw": 270.32,
        "hazard": "Oxidizer, Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/216224"
    },

    # Acrylates & Acrylamides
    "poly(ethylene glycol) diacrylate": {
        "cas": "26570-48-9",
        "formula": "C3H3O·(C2H4O)n·C3H4O2",
        "mw": 700,
        "hazard": "Irritant, Sensitizer",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/455008"
    },
    "n-isopropylacrylamide": {
        "cas": "2210-25-5",
        "formula": "C6H11NO",
        "mw": 113.16,
        "hazard": "Toxic, Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/415324"
    },
    "n-isopropylmethacrylamide": {
        "cas": "3887-02-3",
        "formula": "C7H13NO",
        "mw": 127.18,
        "hazard": "Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/423548"
    },
    "n,n'-methylenebis(acrylamide)": {
        "cas": "110-26-9",
        "formula": "C7H10N2O2",
        "mw": 154.17,
        "hazard": "Toxic, Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/m7279"
    },
    "n,n-dimethylacrylamide": {
        "cas": "2680-03-7",
        "formula": "C5H9NO",
        "mw": 99.13,
        "hazard": "Toxic, Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/274135"
    },
    "acrylic acid": {
        "cas": "79-10-7",
        "formula": "C3H4O2",
        "mw": 72.06,
        "hazard": "Corrosive, Flammable, Toxic",
        "storage": "Refrigerated, flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/147230"
    },
    "2-aminoethyl methacrylate hydrochloride": {
        "cas": "2420-94-2",
        "formula": "C6H12ClNO2",
        "mw": 165.62,
        "hazard": "Irritant",
        "storage": "Refrigerated, -20C",
        "sds": "https://www.fishersci.com/store/msds?partNumber=AC169481000"
    },
    "2-hydroxyethyl methacrylate": {
        "cas": "868-77-9",
        "formula": "C6H10O3",
        "mw": 130.14,
        "hazard": "Irritant, Sensitizer",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/128635"
    },
    "furfuryl methacrylate": {
        "cas": "3454-28-2",
        "formula": "C9H10O3",
        "mw": 166.17,
        "hazard": "Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/411760"
    },
    "2-hydroxyethyl acrylate": {
        "cas": "818-61-1",
        "formula": "C5H8O3",
        "mw": 116.12,
        "hazard": "Corrosive, Irritant",
        "storage": "Refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/292818"
    },
    "isobornyl acrylate": {
        "cas": "5888-33-5",
        "formula": "C13H20O2",
        "mw": 208.30,
        "hazard": "Irritant, Sensitizer",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/392103"
    },
    "cyanoacetic acid": {
        "cas": "372-09-8",
        "formula": "C3H3NO2",
        "mw": 85.06,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/c88505"
    },

    # Solvents
    "acetone": {
        "cas": "67-64-1",
        "formula": "C3H6O",
        "mw": 58.08,
        "hazard": "Flammable, Irritant",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigald/179124"
    },
    "ethanol": {
        "cas": "64-17-5",
        "formula": "C2H6O",
        "mw": 46.07,
        "hazard": "Flammable",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigald/459844"
    },
    "chloroform": {
        "cas": "67-66-3",
        "formula": "CHCl3",
        "mw": 119.38,
        "hazard": "Toxic, Irritant",
        "storage": "Fume hood",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/c2432"
    },
    "chloroform-d": {
        "cas": "865-49-6",
        "formula": "CDCl3",
        "mw": 120.38,
        "hazard": "Toxic",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/151823"
    },
    "methanol": {
        "cas": "67-56-1",
        "formula": "CH4O",
        "mw": 32.04,
        "hazard": "Flammable, Toxic",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigald/179337"
    },
    "isopropanol": {
        "cas": "67-63-0",
        "formula": "C3H8O",
        "mw": 60.10,
        "hazard": "Flammable, Irritant",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigald/278475"
    },
    "tetrahydrofuran": {
        "cas": "109-99-9",
        "formula": "C4H8O",
        "mw": 72.11,
        "hazard": "Flammable, Irritant",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigald/34865"
    },
    "toluene": {
        "cas": "108-88-3",
        "formula": "C7H8",
        "mw": 92.14,
        "hazard": "Flammable, Toxic",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigald/650579"
    },
    "n,n-dimethylformamide": {
        "cas": "68-12-2",
        "formula": "C3H7NO",
        "mw": 73.09,
        "hazard": "Toxic, Irritant",
        "storage": "Fume hood",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigald/270547"
    },
    "diethyl ether": {
        "cas": "60-29-7",
        "formula": "C4H10O",
        "mw": 74.12,
        "hazard": "Extremely Flammable",
        "storage": "Flammable cabinet, refrigerated",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigald/346136"
    },
    "acetonitrile": {
        "cas": "75-05-8",
        "formula": "C2H3N",
        "mw": 41.05,
        "hazard": "Flammable, Toxic",
        "storage": "Flammable cabinet",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigald/34851"
    },
    "deuterium oxide": {
        "cas": "7789-20-0",
        "formula": "D2O",
        "mw": 20.03,
        "hazard": "Non-hazardous",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/151882"
    },

    # Fillers & Particles
    "silica fumed": {
        "cas": "112945-52-5",
        "formula": "SiO2",
        "mw": 60.08,
        "hazard": "Irritant (respiratory)",
        "storage": "Room temperature, dry",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/s5505"
    },
    "laponite": {
        "cas": "53320-86-8",
        "formula": "Na0.7Si8Mg5.5Li0.3O20(OH)4",
        "mw": None,
        "hazard": "Non-hazardous",
        "storage": "Room temperature, dry",
        "sds": "https://www.byk.com/en/products/additives-by-name/laponite-rd"
    },
    "carbon nanotubes": {
        "cas": "308068-56-6",
        "formula": "C",
        "mw": 12.01,
        "hazard": "Irritant (respiratory)",
        "storage": "Room temperature, dry",
        "sds": "https://www.cheaptubes.com/sds"
    },
    "carbon nanofibers": {
        "cas": "308063-67-4",
        "formula": "C",
        "mw": 12.01,
        "hazard": "Irritant (respiratory)",
        "storage": "Room temperature, dry",
        "sds": "https://www.acsmaterial.com/carbon-nanofibers-sds.html"
    },

    # Surfactants
    "span 80": {
        "cas": "1338-43-8",
        "formula": "C24H44O6",
        "mw": 428.60,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.tcichemicals.com/US/en/sds/S0060_EN_US.pdf"
    },
    "lecithin": {
        "cas": "8002-43-5",
        "formula": "C42H80NO8P",
        "mw": 758.06,
        "hazard": "Non-hazardous",
        "storage": "Refrigerated",
        "sds": "https://www.fishersci.com/store/msds?partNumber=AA3648630"
    },
    "pluronic f-68": {
        "cas": "9003-11-6",
        "formula": "(C2H4O)x(C3H6O)y(C2H4O)z",
        "mw": 8400,
        "hazard": "Non-hazardous",
        "storage": "Room temperature",
        "sds": "https://www.mpbio.com/media/msds/mp92750016_en_us.pdf"
    },
    "tergitol": {
        "cas": "9016-45-9",
        "formula": "C9H19(OC2H4)nOH",
        "mw": None,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/sigma/np40s"
    },

    # Waxes
    "lauric acid": {
        "cas": "143-07-7",
        "formula": "C12H24O2",
        "mw": 200.32,
        "hazard": "Irritant",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/mm/8053330100"
    },
    "myristyl myristate": {
        "cas": "3234-85-3",
        "formula": "C28H56O2",
        "mw": 424.74,
        "hazard": "Non-hazardous",
        "storage": "Room temperature",
        "sds": "https://www.sigmaaldrich.com/US/en/sds/aldrich/w277908"
    },

    # Liposomes
    "dspe-peg": {
        "cas": "474922-26-4",
        "formula": "C47H90NO10P(C2H4O)n",
        "mw": 2790,
        "hazard": "Non-hazardous",
        "storage": "Refrigerated, -20C",
        "sds": "https://www.medchemexpress.com/DSPE-PEG2000.html"
    }
}

def find_chemical_data(name):
    """Find matching chemical data by name"""
    name_lower = name.lower()
    
    for key, data in CHEMICAL_DATA.items():
        if key in name_lower or name_lower in key:
            return data
    
    # Try partial matches
    for key, data in CHEMICAL_DATA.items():
        key_words = key.split()
        if any(word in name_lower for word in key_words if len(word) > 3):
            return data
    
    return None

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all chemicals
cursor.execute("SELECT id, name, cas_number, formula, molecular_weight, hazard_class, storage_conditions, sds_url FROM chemicals")
chemicals = cursor.fetchall()

updated_count = 0
for chem in chemicals:
    chem_id, name, cas, formula, mw, hazard, storage, sds = chem
    
    # Find matching data
    data = find_chemical_data(name)
    
    if data:
        # Update if data is missing
        updates = []
        params = []
        
        if not cas and data.get('cas'):
            updates.append("cas_number = ?")
            params.append(data['cas'])
        
        if not formula and data.get('formula'):
            updates.append("formula = ?")
            params.append(data['formula'])
        
        if not mw and data.get('mw'):
            updates.append("molecular_weight = ?")
            params.append(data['mw'])
        
        if not hazard and data.get('hazard'):
            updates.append("hazard_class = ?")
            params.append(data['hazard'])
        
        if not storage and data.get('storage'):
            updates.append("storage_conditions = ?")
            params.append(data['storage'])
        
        if not sds and data.get('sds'):
            updates.append("sds_url = ?")
            params.append(data['sds'])
        
        if updates:
            params.append(chem_id)
            sql = f"UPDATE chemicals SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(sql, params)
            updated_count += 1
            print(f"Updated: {name[:50]}")

conn.commit()
print(f"\nUpdated {updated_count} chemicals with SDS and safety data")

# Verify
cursor.execute("SELECT COUNT(*) FROM chemicals WHERE sds_url IS NOT NULL AND sds_url != ''")
with_sds = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM chemicals WHERE cas_number IS NOT NULL AND cas_number != ''")
with_cas = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM chemicals")
total = cursor.fetchone()[0]

print(f"\nSummary:")
print(f"  Total chemicals: {total}")
print(f"  With CAS numbers: {with_cas}")
print(f"  With SDS links: {with_sds}")

conn.close()
