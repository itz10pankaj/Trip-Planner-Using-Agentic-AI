import requests
from langchain.tools import tool

@tool
def convert_currency(amount: float, from_currency: str, to_currency: str) -> str:
    """
    Convert currency from one type to another.
    Example:
    amount: 100
    from_currency: USD
    to_currency: INR
    """

    try:
        url = f"https://open.er-api.com/v6/latest/{from_currency.upper()}"
        response = requests.get(url)
        data = response.json()

        if data["result"] != "success":
            return "Error fetching exchange rates."

        rates = data["rates"]

        if to_currency.upper() not in rates:
            return f"Currency {to_currency.upper()} not supported."

        converted_amount = amount * rates[to_currency.upper()]

        return f"{amount} {from_currency.upper()} is equal to {converted_amount:.2f} {to_currency.upper()}"

    except Exception as e:
        return f"Currency tool error: {str(e)}"
