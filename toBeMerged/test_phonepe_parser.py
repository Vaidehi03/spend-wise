import os
from parser_analyser import ExpenseParser

def test_phonepe_parser(pdf_path):
    """
    Test the PhonePe parser with a specific PDF file
    
    Args:
        pdf_path (str): Path to the PhonePe PDF statement
    """
    parser = ExpenseParser()
    
    # Parse the PDF
    data = parser.parse_pdf(pdf_path)
    
    if data:
        print(f"\nSuccessfully parsed {len(data)} transactions from PhonePe statement")
        print("\nTransaction details:")
        
        for i, transaction in enumerate(data, 1):
            print(f"\nTransaction {i}:")
            print(f"Date: {transaction.get('date')}")
            print(f"Time: {transaction.get('time')}")
            print(f"Type: {transaction.get('type')}")
            print(f"Amount: ₹{abs(transaction.get('amount', 0)):.2f}")
            print(f"Description: {transaction.get('description')}")
            print(f"Category: {transaction.get('category')}")
            print(f"Transaction ID: {transaction.get('transaction_id')}")
            print(f"UTR No.: {transaction.get('utr_no')}")
            print(f"Account: {transaction.get('account')}")
        
        # Save to CSV
        os.makedirs("output", exist_ok=True)
        parser.save_to_csv(data, "output/phonepe_transactions.csv")
        print("\nData saved to output/phonepe_transactions.csv")
    else:
        print("Failed to parse PhonePe statement")

if __name__ == "__main__":
    # Replace with actual path to your PhonePe statement PDF
    test_phonepe_parser("PhonePe_Statement_Jan2025_Apr2025.pdf")