import os
import re
import pandas as pd
import json
from datetime import datetime
import PyPDF2
from tabula import read_pdf
import logging

class ExpenseParser:
    def __init__(self, config_path='source_configs.json'):
        """
        Initialize the parser with configurations for different statement sources.
        
        Args:
            config_path (str): Path to configuration file for different statement sources
        """
        self.logger = self._setup_logger()
        self.logger.info("Initializing ExpenseParser")
        
        # Load source configurations from JSON file
        try:
            with open(config_path, 'r') as f:
                self.source_configs = json.load(f)
            self.logger.info(f"Loaded configurations for {len(self.source_configs)} sources")
        except FileNotFoundError:
            self.logger.error(f"Configuration file not found: {config_path}")
            self.source_configs = {}
            
        # Define standard fields for expense data
        self.standard_fields = ['date', 'description', 'amount', 'type', 'category', 'source']
    
    def _setup_logger(self):
        """Set up logging configuration"""
        logger = logging.getLogger('expense_parser')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
    
    def detect_source(self, pdf_path):
        """
        Detect the source of the statement based on content patterns.
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            str: Detected source name or None if not detected
        """
        self.logger.info(f"Detecting source for {pdf_path}")
        
        # Extract text from first page to identify source
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            if len(reader.pages) > 0:
                first_page_text = reader.pages[0].extract_text()
                
                # Check for patterns to identify source
                for source, config in self.source_configs.items():
                    if 'identifier_pattern' in config:
                        if re.search(config['identifier_pattern'], first_page_text, re.IGNORECASE):
                            self.logger.info(f"Detected source: {source}")
                            return source
        
        self.logger.warning(f"Could not detect source for {pdf_path}")
        return None
    
    def parse_pdf(self, pdf_path):
        """
        Parse a PDF file based on detected source.
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            dict: Parsed data with standardized fields
        """
        self.logger.info(f"Starting to parse {pdf_path}")
        
        # Detect source
        source = self.detect_source(pdf_path)
        if not source:
            self.logger.error("Cannot parse PDF with unknown source")
            return None
            
        # Get parser method based on source
        if source in self.source_configs:
            config = self.source_configs[source]
            
            # Determine parsing method based on config
            if config.get('parsing_method') == 'tabula':
                data = self._parse_tabular_pdf(pdf_path, config)
            elif config.get('parsing_method') == 'text':
                data = self._parse_text_pdf(pdf_path, config)
            elif config.get('parsing_method') == 'phonepe_text':
                data = self._parse_phonepe_statement(pdf_path, config)
            else:
                self.logger.error(f"Unknown parsing method for source: {source}")
                return None
                
            # Add source information to parsed data
            for record in data:
                record['source'] = source
                
            self.logger.info(f"Successfully parsed {len(data)} records from {pdf_path}")
            return data
        else:
            self.logger.error(f"No configuration found for source: {source}")
            return None
    
    def _parse_phonepe_statement(self, pdf_path, config):
        """
        Parse PhonePe statements using a custom approach based on the observed structure.
        
        Args:
            pdf_path (str): Path to the PDF file
            config (dict): Source-specific configuration
            
        Returns:
            list: List of dictionaries containing parsed data
        """
        self.logger.info(f"Parsing PhonePe statement: {pdf_path}")
        
        try:
            all_records = []
            
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                
                for page_num in range(len(reader.pages)):
                    text = reader.pages[page_num].extract_text()
                    
                    # Extract the transaction blocks using regex
                    # PhonePe format: Date\nTime\nTYPE\n₹Amount\nPaid to/Received from Description\nTransaction ID TXNID\nUTR No. UTRNO\nPaid by/Credited to\nACCOUNT
                    transaction_blocks = re.finditer(
                        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2},\s\d{4})\s*'
                        r'(\d{2}:\d{2}\s[AP]M)\s*'
                        r'(DEBIT|CREDIT)\s*'
                        r'₹([\d,]+)\s*'
                        r'((?:Paid to|Received from).*?)(?=(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2},\s\d{4}|Page|This is an)',
                        text, re.DOTALL
                    )
                    
                    for match in transaction_blocks:
                        date_str = match.group(1)
                        time_str = match.group(2)
                        txn_type = match.group(3)
                        amount_str = match.group(4)
                        description_block = match.group(5).strip()
                        
                        # Extract additional details from the description block
                        description_lines = description_block.split('\n')
                        description = description_lines[0].strip()
                        
                        # Extract transaction ID and UTR if available
                        txn_id = ""
                        utr_no = ""
                        account = ""
                        
                        for line in description_lines:
                            if "Transaction ID" in line:
                                txn_id = line.split("Transaction ID")[1].strip()
                            elif "UTR No." in line:
                                utr_no = line.split("UTR No.")[1].strip()
                            elif "Paid by" in line or "Credited to" in line:
                                account = description_lines[-1].strip()
                        
                        # Convert date string to standardized format
                        try:
                            date_obj = datetime.strptime(date_str, "%b %d, %Y")
                            standard_date = date_obj.strftime("%Y-%m-%d")
                        except ValueError:
                            self.logger.warning(f"Could not parse date: {date_str}")
                            standard_date = date_str
                        
                        # Clean amount
                        amount = float(amount_str.replace(',', ''))
                        if txn_type == "DEBIT":
                            amount = -amount
                        
                        # Create record
                        record = {
                            'date': standard_date,
                            'time': time_str,
                            'description': description,
                            'amount': amount,
                            'type': txn_type,
                            'transaction_id': txn_id,
                            'utr_no': utr_no,
                            'account': account,
                            'category': self._categorize_transaction(description, config.get('category_rules', []))
                        }
                        
                        all_records.append(record)
            
            return all_records
            
        except Exception as e:
            self.logger.error(f"Error parsing PhonePe statement: {str(e)}")
            return []
    
    def _categorize_transaction(self, description, category_rules):
        """
        Categorize a transaction based on its description and category rules.
        
        Args:
            description (str): Transaction description
            category_rules (list): List of category rule dictionaries
            
        Returns:
            str: Assigned category
        """
        description_lower = description.lower()
        
        for rule in category_rules:
            if re.search(rule['pattern'].lower(), description_lower):
                return rule['category']
        
        return 'uncategorized'
    
    def _parse_tabular_pdf(self, pdf_path, config):
        """
        Parse PDFs that have tabular structure using tabula-py.
        
        Args:
            pdf_path (str): Path to the PDF file
            config (dict): Source-specific configuration
            
        Returns:
            list: List of dictionaries containing parsed data
        """
        self.logger.info(f"Parsing tabular PDF: {pdf_path}")
        
        try:
            # Parse tables from PDF
            tables = read_pdf(
                pdf_path,
                pages='all',
                guess=config.get('guess_table', True),
                area=config.get('table_area'),
                columns=config.get('table_columns'),
                pandas_options={'header': config.get('header_row', 0)}
            )
            
            all_records = []
            
            for table in tables:
                # Handle column mapping
                column_map = config.get('column_mapping', {})
                
                # Normalize column names if needed
                if column_map:
                    table = table.rename(columns=column_map)
                
                # Convert to dictionaries
                records = table.to_dict('records')
                
                # Process each record with field transformations
                for record in records:
                    processed_record = self._process_record(record, config)
                    if processed_record:
                        all_records.append(processed_record)
            
            return all_records
            
        except Exception as e:
            self.logger.error(f"Error parsing tabular PDF: {str(e)}")
            return []
    
    def _parse_text_pdf(self, pdf_path, config):
        """
        Parse PDFs by extracting and processing text.
        
        Args:
            pdf_path (str): Path to the PDF file
            config (dict): Source-specific configuration
            
        Returns:
            list: List of dictionaries containing parsed data
        """
        self.logger.info(f"Parsing text-based PDF: {pdf_path}")
        
        try:
            all_records = []
            
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                
                # Process pages based on configuration
                start_page = config.get('start_page', 0)
                end_page = config.get('end_page', len(reader.pages))
                
                for page_num in range(start_page, min(end_page, len(reader.pages))):
                    text = reader.pages[page_num].extract_text()
                    
                    # Use regex pattern to extract transaction data
                    pattern = config.get('transaction_pattern')
                    if pattern:
                        matches = re.finditer(pattern, text, re.MULTILINE)
                        
                        for match in matches:
                            record = match.groupdict()
                            processed_record = self._process_record(record, config)
                            if processed_record:
                                all_records.append(processed_record)
            
            return all_records
            
        except Exception as e:
            self.logger.error(f"Error parsing text PDF: {str(e)}")
            return []
    
    def _process_record(self, record, config):
        """
        Process a single record with transformations based on configuration.
        
        Args:
            record (dict): Raw record data
            config (dict): Source-specific configuration
            
        Returns:
            dict: Processed record with standardized fields
        """
        try:
            processed = {}
            
            # Apply field transformations
            for field in self.standard_fields:
                if field in record:
                    value = record[field]
                    
                    # Apply field-specific transformations
                    field_config = config.get('field_transformations', {}).get(field)
                    if field_config:
                        # Date format transformation
                        if field == 'date' and 'format' in field_config:
                            try:
                                date_obj = datetime.strptime(value, field_config['format'])
                                value = date_obj.strftime('%Y-%m-%d')
                            except ValueError:
                                self.logger.warning(f"Could not parse date: {value}")
                        
                        # Amount transformation (clean and convert to float)
                        elif field == 'amount' and field_config.get('clean', False):
                            value = re.sub(r'[^\d.-]', '', str(value))
                            try:
                                value = float(value)
                                # Apply debit/credit adjustment if specified
                                if field_config.get('is_negative_for_debit', False):
                                    if record.get(field_config.get('debit_indicator_field', 'type')) == field_config.get('debit_indicator_value', 'DEBIT'):
                                        value = -abs(value)
                            except ValueError:
                                self.logger.warning(f"Could not convert amount to float: {value}")
                    
                    processed[field] = value
                
                # Handle derived fields based on rules
                elif field == 'category':
                    # Apply category rules from config if available
                    category_rules = config.get('category_rules', [])
                    description = record.get('description', '').lower()
                    
                    for rule in category_rules:
                        if re.search(rule['pattern'].lower(), description):
                            processed['category'] = rule['category']
                            break
                    else:
                        processed['category'] = 'uncategorized'
            
            return processed
            
        except Exception as e:
            self.logger.warning(f"Error processing record: {str(e)}")
            return None
    
    def save_to_csv(self, data, output_path):
        """
        Save parsed data to a CSV file.
        
        Args:
            data (list): List of dictionaries with parsed data
            output_path (str): Path to save the CSV file
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not data:
            self.logger.warning("No data to save to CSV")
            return False
            
        try:
            df = pd.DataFrame(data)
            df.to_csv(output_path, index=False)
            self.logger.info(f"Saved {len(data)} records to {output_path}")
            return True
        except Exception as e:
            self.logger.error(f"Error saving to CSV: {str(e)}")
            return False
    
    def get_as_dict(self, data, group_by=None):
        """
        Return parsed data as dictionary, optionally grouped by a field.
        
        Args:
            data (list): List of dictionaries with parsed data
            group_by (str, optional): Field to group records by
            
        Returns:
            dict: Processed data as dictionary
        """
        if not data:
            return {}
            
        if group_by and group_by in self.standard_fields:
            result = {}
            for record in data:
                key = record.get(group_by)
                if key:
                    if key not in result:
                        result[key] = []
                    result[key].append(record)
            return result
        else:
            return {'records': data}


# Example of usage
def parse_and_analyze_statements(pdf_dir, output_dir='output'):
    """
    Parse all PDFs in a directory and save/return results.
    
    Args:
        pdf_dir (str): Directory containing PDF statements
        output_dir (str): Directory to save output CSV files
        
    Returns:
        dict: All parsed data for analysis
    """
    parser = ExpenseParser()
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    all_data = []
    
    # Process each PDF file in the directory
    for filename in os.listdir(pdf_dir):
        if filename.lower().endswith('.pdf'):
            pdf_path = os.path.join(pdf_dir, filename)
            
            # Parse PDF
            data = parser.parse_pdf(pdf_path)
            
            if data:
                # Add to combined dataset
                all_data.extend(data)
                
                # Save individual file results
                basename = os.path.splitext(filename)[0]
                csv_path = os.path.join(output_dir, f"{basename}.csv")
                parser.save_to_csv(data, csv_path)
    
    # Save combined results
    if all_data:
        combined_path = os.path.join(output_dir, "all_transactions.csv")
        parser.save_to_csv(all_data, combined_path)
    
    # Return data dictionary grouped by source for analysis
    return parser.get_as_dict(all_data, group_by='source')


def extract_phonepe_descriptions(pdf_path):
    """
    Extract only transaction descriptions from a PhonePe statement PDF.
    
    Args:
        pdf_path (str): Path to the PhonePe PDF statement
        
    Returns:
        list: List of transaction descriptions
    """
    try:
        descriptions = []
        
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            
            for page_num in range(len(reader.pages)):
                text = reader.pages[page_num].extract_text()
                
                # Extract the transaction blocks using regex
                transaction_blocks = re.finditer(
                    r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2},\s\d{4})\s*'
                    r'(\d{2}:\d{2}\s[AP]M)\s*'
                    r'(DEBIT|CREDIT)\s*'
                    r'₹([\d,]+)\s*'
                    r'((?:Paid to|Received from).*?)(?=(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2},\s\d{4}|Page|This is an)',
                    text, re.DOTALL
                )
                
                for match in transaction_blocks:
                    description_block = match.group(5).strip()
                    description_lines = description_block.split('\n')
                    # First line contains the main description
                    description = description_lines[0].strip()
                    descriptions.append(description)
        
        return descriptions
            
    except Exception as e:
        print(f"Error extracting PhonePe descriptions: {str(e)}")
        return []


if __name__ == "__main__":
    # Example usage
    result = parse_and_analyze_statements("statements")
    print(f"Parsed {sum(len(data) for data in result.values())} transactions from {len(result)} sources")