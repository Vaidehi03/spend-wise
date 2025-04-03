import os
import pandas as pd
import csv
import json
from typing import List, Dict, Any
from datetime import datetime
from fastapi import UploadFile

from app.core.config import settings
from app.models.transaction import Transaction

class TransactionParser:
    """Service to parse bank transactions from different file formats"""
    
    def __init__(self):
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    async def save_upload_file(self, upload_file: UploadFile) -> str:
        """Save the uploaded file and return the path"""
        file_extension = upload_file.filename.split('.')[-1]
        if file_extension.lower() not in settings.ALLOWED_EXTENSIONS:
            raise ValueError(f"File extension {file_extension} not allowed")
        
        # Create a unique filename
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{upload_file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        # Save the file
        with open(file_path, "wb") as f:
            content = await upload_file.read()
            f.write(content)
        
        return file_path
    
    def parse_file(self, file_path: str, bank_type: str = None) -> List[Dict[str, Any]]:
        """Parse the file based on its extension and bank type"""
        file_extension = file_path.split('.')[-1].lower()
        
        if file_extension == "csv":
            return self._parse_csv(file_path, bank_type)
        elif file_extension in ["xlsx", "xls"]:
            return self._parse_excel(file_path, bank_type)
        elif file_extension == "json":
            return self._parse_json(file_path)
        elif file_extension == "pdf":
            return self._parse_pdf(file_path, bank_type)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    def _parse_csv(self, file_path: str, bank_type: str = None) -> List[Dict[str, Any]]:
        """Parse CSV file based on bank type"""
        # Read the CSV file
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            # Detect the delimiter by reading the first line
            dialect = csv.Sniffer().sniff(f.read(1024))
            f.seek(0)
            reader = csv.DictReader(f, dialect=dialect)
            transactions = list(reader)
        
        # If bank type is specified, apply specific parsing logic
        if bank_type:
            return self._map_bank_format(transactions, bank_type)
        
        # Basic mapping for generic CSV format
        return self._map_generic_format(transactions)
    
    def _parse_excel(self, file_path: str, bank_type: str = None) -> List[Dict[str, Any]]:
        """Parse Excel file"""
        # Read the Excel file
        df = pd.read_excel(file_path)
        transactions = df.to_dict('records')
        
        # Apply bank-specific mapping if needed
        if bank_type:
            return self._map_bank_format(transactions, bank_type)
        
        return self._map_generic_format(transactions)
    
    def _parse_json(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse JSON file"""
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Handle different JSON structures
        if isinstance(data, list):
            return self._map_generic_format(data)
        elif isinstance(data, dict) and "transactions" in data:
            return self._map_generic_format(data["transactions"])
        else:
            raise ValueError("Unsupported JSON structure")
    
    def _parse_pdf(self, file_path: str, bank_type: str) -> List[Dict[str, Any]]:
        """Parse PDF file (requires additional libraries and would be bank-specific)"""
        # This is a placeholder - PDF parsing requires bank-specific logic
        # and additional libraries like pypdf2, pdfminer, or pdfplumber
        raise NotImplementedError("PDF parsing is not implemented yet")
    
    def _map_bank_format(self, transactions: List[Dict[str, Any]], bank_type: str) -> List[Dict[str, Any]]:
        """Map bank-specific formats to our standard format"""
        if bank_type.lower() == "chase":
            return self._map_chase_format(transactions)
        elif bank_type.lower() == "bank_of_america":
            return self._map_bofa_format(transactions)
        # Add more bank mappings as needed
        else:
            return self._map_generic_format(transactions)
    
    def _map_generic_format(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Map a generic transaction format to our standard format"""
        result = []
        
        for tx in transactions:
            # Try to intelligently map fields based on common names
            date_field = self._find_field(tx, ["date", "transaction_date", "Date", "TransactionDate"])
            amount_field = self._find_field(tx, ["amount", "Amount", "AMOUNT", "transaction_amount"])
            description_field = self._find_field(
                tx, ["description", "Description", "memo", "Memo", "DESCRIPTION", "note", "notes"]
            )
            merchant_field = self._find_field(
                tx, ["merchant", "payee", "Merchant", "Payee", "vendor", "Vendor"]
            )
            
            if not date_field or not amount_field:
                continue  # Skip if essential fields are missing
            
            # Create standardized transaction
            std_tx = {
                "transaction_date": self._parse_date(tx.get(date_field, "")),
                "amount": self._parse_amount(tx.get(amount_field, 0)),
                "description": tx.get(description_field, "") if description_field else "",
                "merchant": tx.get(merchant_field, "") if merchant_field else "",
                "is_expense": self._parse_amount(tx.get(amount_field, 0)) > 0,
                "original_data": tx  # Store the original data for reference
            }
            
            result.append(std_tx)
        
        return result
    
    def _map_chase_format(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Map Chase bank CSV format to standard format"""
        result = []
        for tx in transactions:
            std_tx = {
                "transaction_date": self._parse_date(tx.get("Transaction Date", tx.get("Date", ""))),
                "amount": self._parse_amount(tx.get("Amount", 0)),
                "description": tx.get("Description", ""),
                "merchant": "",  # Chase doesn't typically have a separate merchant field
                "is_expense": self._parse_amount(tx.get("Amount", 0)) > 0,
                "original_data": tx
            }
            result.append(std_tx)
        return result
    
    def _map_bofa_format(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Map Bank of America CSV format to standard format"""
        result = []
        for tx in transactions:
            # Typical BofA format
            date_field = self._find_field(tx, ["Date", "Posted Date"])
            description_field = self._find_field(tx, ["Payee", "Description"])
            amount_field = self._find_field(tx, ["Amount", "Withdrawal Amount", "Deposit Amount"])
            
            amount = 0
            if "Withdrawal Amount" in tx and tx["Withdrawal Amount"]:
                amount = -abs(self._parse_amount(tx["Withdrawal Amount"]))
            elif "Deposit Amount" in tx and tx["Deposit Amount"]:
                amount = abs(self._parse_amount(tx["Deposit Amount"]))
            else:
                amount = self._parse_amount(tx.get(amount_field, 0))
            
            std_tx = {
                "transaction_date": self._parse_date(tx.get(date_field, "")),
                "amount": amount,
                "description": tx.get(description_field, ""),
                "merchant": "",  # BofA doesn't typically have a separate merchant field
                "is_expense": amount > 0,
                "original_data": tx
            }
            result.append(std_tx)
        return result
    
    def _find_field(self, data: Dict[str, Any], possible_names: List[str]) -> str:
        """Find a field in the data based on possible name variations"""
        for name in possible_names:
            if name in data:
                return name
        return None
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse a date string into a datetime object"""
        if not date_str:
            return datetime.now()
        
        # Try different date formats
        date_formats = [
            "%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d", "%Y/%m/%d",
            "%m-%d-%Y", "%d-%m-%Y", "%m/%d/%y", "%d/%m/%y"
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        # If all formats fail, return current date
        return datetime.now()
    
    def _parse_amount(self, amount) -> float:
        """Parse an amount value to float"""
        if isinstance(amount, (int, float)):
            return float(amount)
        
        if isinstance(amount, str):
            # Remove currency symbols and commas
            clean_amount = amount.replace("$", "").replace(",", "").replace("£", "").replace("€", "").strip()
            
            # Handle negative amounts with parentheses
            if clean_amount.startswith("(") and clean_amount.endswith(")"):
                clean_amount = "-" + clean_amount[1:-1]
            
            try:
                return float(clean_amount)
            except ValueError:
                pass
        
        return 0.0 