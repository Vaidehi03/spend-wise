import csv
import os
import sys
from parser_analyser import extract_phonepe_descriptions

def main():
    """
    Extract transaction descriptions from PhonePe statement and save to CSV.
    """
    # Check if the PDF path was provided as a command-line argument
    if len(sys.argv) < 2:
        print("Usage: python extract_phonepe_descriptions.py <path_to_phonepe_statement.pdf>")
        return

    pdf_path = sys.argv[1]
    
    # Validate that the file exists and is a PDF
    if not os.path.exists(pdf_path):
        print(f"Error: File '{pdf_path}' not found.")
        return
    
    if not pdf_path.lower().endswith('.pdf'):
        print(f"Error: '{pdf_path}' is not a PDF file.")
        return
    
    # Extract descriptions
    print(f"Extracting transaction descriptions from {pdf_path}...")
    descriptions = extract_phonepe_descriptions(pdf_path)
    
    if not descriptions:
        print("No transaction descriptions found.")
        return
    
    # Create output directory if it doesn't exist
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate output file path
    basename = os.path.splitext(os.path.basename(pdf_path))[0]
    output_path = os.path.join(output_dir, f"{basename}_descriptions.csv")
    
    # Save descriptions to CSV
    with open(output_path, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['transaction_description'])  # Header
        for description in descriptions:
            writer.writerow([description])
    
    print(f"Successfully extracted {len(descriptions)} transaction descriptions.")
    print(f"Results saved to {output_path}")

if __name__ == "__main__":
    main() 