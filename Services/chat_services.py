import re
def extract_budget_from_text(text: str):
    """Extract budget amount and currency from text response"""
    clean_text = text.replace('**', '')
    
    # Pattern 1: Amount followed by currency code (54,616 INR)
    pattern1 = r'([0-9,]+\.?[0-9]*)\s+([A-Z]{3})'
    match = re.search(pattern1, clean_text)
    if match:
        amount_str = match.group(1).replace(',', '')
        currency = match.group(2)
        try:
            amount = float(amount_str)
            return amount, currency
        except ValueError:
            pass
    
    # Pattern 2: Currency code followed by amount (INR 54,616)
    pattern2 = r'([A-Z]{3})\s+([0-9,]+\.?[0-9]*)'
    match = re.search(pattern2, clean_text)
    if match:
        currency = match.group(1)
        amount_str = match.group(2).replace(',', '')
        try:
            amount = float(amount_str)
            return amount, currency
        except ValueError:
            pass
    
    # Pattern 3: Currency symbol followed by amount (₹54,616)
    pattern3 = r'([₹$€¥£₽₩₪₦₱₡₲₴₸])\s*([0-9,]+\.?[0-9]*)'
    match = re.search(pattern3, clean_text)
    if match:
        currency_symbol = match.group(1)
        amount_str = match.group(2).replace(',', '')
        
        # Map currency symbols to codes
        currency_map = {
            '₹': 'INR',
            '$': 'USD',
            '€': 'EUR',
            '¥': 'JPY',
            '£': 'GBP',
            '₽': 'RUB',
            '₩': 'KRW',
            '₪': 'ILS',
            '₦': 'NGN',
            '₱': 'PHP',
            '₡': 'CRC',
            '₲': 'PYG',
            '₴': 'UAH',
            '₸': 'UAH',
        }
        
        currency = currency_map.get(currency_symbol, currency_symbol)
        
        try:
            amount = float(amount_str)
            return amount, currency
        except ValueError:
            pass
    
    return None, None