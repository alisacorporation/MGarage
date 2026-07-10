/**
 * MGarage — cardata.js
 * Static offline reference data for cascading dropdowns: brand -> model -> generation.
 * Not exhaustive — covers the most common brands/models on the CIS market.
 * Anything missing can always be entered manually via the "Другое" option.
 */

const CAR_DB = {
  'BMW': {
    '1 Series': ['E81/E87', 'F20/F21', 'F40'],
    '2 Series': ['F22/F23', 'F44', 'G42'],
    '3 Series': ['E30', 'E36', 'E46', 'E90/E91/E92/E93', 'F30/F31/F34', 'G20/G21'],
    '5 Series': ['E34', 'E39', 'E60/E61', 'F10/F11', 'G30/G31'],
    '7 Series': ['E38', 'E65/E66', 'F01/F02', 'G11/G12'],
    'X3': ['E83', 'F25', 'G01'],
    'X5': ['E53', 'E70', 'F15', 'G05'],
    'X6': ['E71', 'F16', 'G06'],
    'M3': ['E30', 'E36', 'E46', 'E90/E92/E93', 'F80', 'G80'],
    'M5': ['E34', 'E39', 'E60', 'F10', 'F90'],
  },
  'Mercedes-Benz': {
    'A-Class': ['W168', 'W169', 'W176', 'W177'],
    'C-Class': ['W202', 'W203', 'W204', 'W205', 'W206'],
    'E-Class': ['W124', 'W210', 'W211', 'W212', 'W213'],
    'S-Class': ['W140', 'W220', 'W221', 'W222', 'W223'],
    'GLE': ['W166', 'V167'],
    'GLC': ['X253', 'X254'],
    'G-Class': ['W463'],
    'CLA': ['C117', 'C118'],
  },
  'Audi': {
    'A3': ['8L', '8P', '8V', '8Y'],
    'A4': ['B5', 'B6', 'B7', 'B8', 'B9'],
    'A6': ['C4', 'C5', 'C6', 'C7', 'C8'],
    'Q3': ['8U', 'F3'],
    'Q5': ['8R', 'FY'],
    'Q7': ['4L', '4M'],
    'A8': ['D2', 'D3', 'D4', 'D5'],
  },
  'Volkswagen': {
    'Golf': ['Mk4', 'Mk5', 'Mk6', 'Mk7', 'Mk8'],
    'Passat': ['B5', 'B6', 'B7', 'B8'],
    'Polo': ['Mk4', 'Mk5', 'Mk6'],
    'Tiguan': ['I (5N)', 'II (AD1)'],
    'Jetta': ['Mk5', 'Mk6', 'Mk7'],
    'Touareg': ['I', 'II', 'III'],
  },
  'Skoda': {
    'Octavia': ['A5', 'A7', 'A8'],
    'Rapid': ['I'],
    'Superb': ['I', 'II', 'III'],
    'Kodiaq': ['I'],
    'Fabia': ['II', 'III', 'IV'],
  },
  'Toyota': {
    'Camry': ['XV40', 'XV50', 'XV70', 'XV80'],
    'Corolla': ['E120', 'E140/150', 'E160/170', 'E210'],
    'RAV4': ['XA30', 'XA40', 'XA50'],
    'Land Cruiser': ['J100', 'J200', 'J300'],
    'Land Cruiser Prado': ['J120', 'J150'],
    'Highlander': ['XU40', 'XU50', 'XU70'],
    'Hilux': ['AN10/20', 'AN120/130'],
  },
  'Lexus': {
    'RX': ['XU30', 'XU40', 'XU60'],
    'ES': ['XV60', 'XV70'],
    'LX': ['J200', 'J300'],
    'NX': ['I', 'II'],
    'GX': ['J150'],
  },
  'Honda': {
    'Civic': ['8th', '9th', '10th', '11th'],
    'Accord': ['CU', 'CR'],
    'CR-V': ['RE', 'RM', 'RW'],
    'Pilot': ['YF3', 'YF4'],
  },
  'Nissan': {
    'X-Trail': ['T30', 'T31', 'T32'],
    'Qashqai': ['J10', 'J11', 'J12'],
    'Almera': ['N16', 'G15'],
    'Murano': ['Z50', 'Z51', 'Z52'],
    'Patrol': ['Y61', 'Y62'],
    'Teana': ['J31', 'J32', 'L33'],
  },
  'Mazda': {
    'Mazda3': ['BK', 'BL', 'BM/BN', 'BP'],
    'Mazda6': ['GG', 'GH', 'GJ'],
    'CX-5': ['KE', 'KF'],
    'CX-9': ['TB', 'TC'],
  },
  'Mitsubishi': {
    'Outlander': ['CU', 'CW', 'GF/GG', 'ZM'],
    'Lancer': ['IX', 'X'],
    'ASX': ['I'],
    'Pajero': ['III', 'IV'],
  },
  'Subaru': {
    'Forester': ['SG', 'SH', 'SJ', 'SK'],
    'Outback': ['BP', 'BR', 'BS'],
    'Impreza': ['GD', 'GE/GH', 'GJ/GP'],
    'XV': ['GP/GJ', 'GT'],
  },
  'Hyundai': {
    'Solaris': ['I (RB)', 'II (HCr)'],
    'Elantra': ['HD', 'MD', 'AD', 'CN7'],
    'Tucson': ['JM', 'LM', 'TL', 'NX4'],
    'Santa Fe': ['CM', 'DM', 'TM'],
    'Creta': ['GS', 'SU2'],
  },
  'Kia': {
    'Rio': ['III (UB)', 'IV (YB)'],
    'Ceed': ['I (ED)', 'II (JD)', 'III (CD)'],
    'Sportage': ['III (SL)', 'IV (QL)', 'V (NQ5)'],
    'Sorento': ['II (XM)', 'III (UM)', 'IV (MQ4)'],
    'K5/Optima': ['TF', 'JF', 'DL3'],
  },
  'Ford': {
    'Focus': ['I', 'II', 'III', 'IV'],
    'Mondeo': ['III', 'IV', 'V'],
    'Kuga': ['I', 'II', 'III'],
    'Explorer': ['U502', 'U625'],
    'Transit': ['V363', 'V184'],
  },
  'Opel': {
    'Astra': ['G', 'H', 'J', 'K'],
    'Corsa': ['C', 'D', 'E', 'F'],
    'Insignia': ['A', 'B'],
    'Mokka': ['I', 'II'],
  },
  'Renault': {
    'Logan': ['I', 'II'],
    'Duster': ['I', 'II'],
    'Sandero': ['I', 'II'],
    'Megane': ['II', 'III', 'IV'],
    'Kaptur/Captur': ['I', 'II'],
  },
  'Peugeot': {
    '308': ['I (T7)', 'II (T9)'],
    '408': ['I', 'II'],
    '3008': ['I', 'II'],
    '407': ['I'],
  },
  'Citroen': {
    'C4': ['I', 'II', 'III'],
    'C5': ['I', 'II', 'III'],
    'Berlingo': ['I', 'II', 'III'],
  },
  'Volvo': {
    'XC60': ['I', 'II'],
    'XC90': ['I', 'II'],
    'S60': ['I', 'II', 'III'],
    'V40': ['I', 'II'],
  },
  'Land Rover': {
    'Range Rover': ['III (L322)', 'IV (L405)', 'V (L460)'],
    'Range Rover Sport': ['I (L320)', 'II (L494)', 'III (L461)'],
    'Discovery': ['3', '4', '5'],
    'Defender': ['классический', 'L663'],
  },
  'Jaguar': {
    'XF': ['X250', 'X260'],
    'XE': ['X760'],
    'F-Pace': ['X761'],
  },
  'Porsche': {
    'Cayenne': ['955/957', '92A', 'PO536'],
    'Macan': ['95B'],
    '911': ['996', '997', '991', '992'],
    'Panamera': ['970', '971'],
  },
  'Mini': {
    'Cooper': ['R50/R53', 'R56', 'F55/F56'],
    'Countryman': ['R60', 'F60'],
  },
  'Chevrolet': {
    'Niva': ['I'],
    'Lacetti': ['I'],
    'Cruze': ['I', 'II'],
    'Aveo': ['I', 'II'],
    'Captiva': ['I', 'II'],
  },
  'Cadillac': {
    'Escalade': ['GMT800', 'GMT900', 'K2XX', 'T1XX'],
    'CTS': ['I', 'II', 'III'],
    'XT5': ['I'],
  },
  'Jeep': {
    'Grand Cherokee': ['WJ', 'WK', 'WK2', 'WL'],
    'Wrangler': ['TJ', 'JK', 'JL'],
    'Cherokee': ['KJ', 'KK', 'KL'],
  },
  'Chrysler': {
    '300C': ['I (LX)', 'II (LD)'],
    'Pacifica': ['RU'],
  },
  'Dodge': {
    'Charger': ['LX', 'LD'],
    'Journey': ['JC'],
  },
  'Lada (ВАЗ)': {
    'Granta': ['I', 'II'],
    'Vesta': ['I'],
    'Niva/Niva Travel': ['классика', 'Legend', 'Travel'],
    'Largus': ['I'],
    'Kalina': ['I', 'II'],
    'Priora': ['I'],
    '2107/Классика': ['классика'],
    'XRAY': ['I'],
  },
  'UAZ': {
    'Patriot': ['I рестайлинг', 'II рестайлинг'],
    'Hunter': ['I'],
    'Буханка (2206/3909)': ['классика'],
  },
  'GAZ': {
    'Volga Siber': ['I'],
    'Соболь': ['классика', 'NN'],
    'Газель Next': ['I'],
  },
  'Chery': {
    'Tiggo 7 Pro': ['I'],
    'Tiggo 8 Pro': ['I'],
    'Tiggo 4': ['I', 'II'],
  },
  'Geely': {
    'Coolray': ['I'],
    'Atlas': ['I', 'Pro'],
    'Tugella': ['I'],
    'Monjaro': ['I'],
  },
  'Haval': {
    'Jolion': ['I'],
    'F7': ['I'],
    'Dargo': ['I'],
  },
  'Changan': {
    'CS35 Plus': ['I'],
    'CS55 Plus': ['I'],
    'Uni-K': ['I'],
  },
  'BYD': {
    'Song Plus': ['I'],
    'Han': ['I'],
    'Tang': ['I', 'II'],
  },
  'Exeed': {
    'TXL': ['I'],
    'VX': ['I'],
    'LX': ['I'],
  },
  'Omoda': {
    'C5': ['I'],
  },
  'Great Wall': {
    'Poer': ['I'],
    'Tank 300': ['I'],
    'Tank 500': ['I'],
  },
  'Infiniti': {
    'FX/QX70': ['S50', 'S51'],
    'G/Q50': ['V36', 'V37'],
    'QX56/QX80': ['JA60', 'Z62'],
  },
  'Acura': {
    'MDX': ['YD2', 'YD3', 'YD4'],
    'RDX': ['TB3', 'TB4'],
  },
  'Genesis': {
    'G70': ['IK'],
    'G80': ['DH', 'RG3'],
    'GV70': ['JK1'],
  },
  'Tesla': {
    'Model 3': ['I'],
    'Model Y': ['I'],
    'Model S': ['I', 'рестайлинг'],
  },
  'Suzuki': {
    'Grand Vitara': ['I', 'II', 'III'],
    'SX4': ['I', 'II'],
    'Vitara': ['IV'],
  },
  'Fiat': {
    'Albea': ['I'],
    'Ducato': ['III', 'IV'],
    '500': ['I'],
  },
  'Alfa Romeo': {
    'Giulia': ['I (952)'],
    'Stelvio': ['I (949)'],
    '156': ['I'],
  },
  'Seat': {
    'Leon': ['I', 'II', 'III', 'IV'],
    'Ibiza': ['III', 'IV', 'V'],
  },
  'SsangYong': {
    'Rexton': ['I', 'II', 'III'],
    'Kyron': ['I'],
    'Actyon': ['I', 'II'],
  },
};

const BODY_TYPES = [
  'Седан', 'Хэтчбек', 'Универсал', 'Лифтбек', 'Купе', 'Кабриолет', 'Родстер',
  'Кроссовер', 'Внедорожник', 'Минивэн', 'Пикап', 'Фургон', 'Другое',
];

const OTHER_OPTION = '__other__';

window.CAR_DB = CAR_DB;
window.BODY_TYPES = BODY_TYPES;
window.OTHER_OPTION = OTHER_OPTION;
