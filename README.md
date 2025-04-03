# SpendWise - Expense Tracking and Analytics

SpendWise is a powerful expense tracking application that allows users to upload bank transaction data and get detailed analytics on their spending habits. The application automatically categorizes transactions, generates insightful reports, and helps users manage their personal finances more effectively.

## Features

- **Transaction Import**: Upload bank transaction data from CSV, Excel, JSON, and PDF files
- **Auto-categorization**: Smart categorization of transactions based on merchant names and descriptions
- **Detailed Analytics**: View spending by category, month, and merchant
- **Reports and Dashboards**: Access easy-to-understand reports and visualizations
- **Custom Categories**: Create your own categories and subcategories
- **Secure Authentication**: User authentication with JWT tokens

## Directory Structure

```
app/
├── api/                 # API endpoints
│   ├── dependencies/    # API dependencies (auth, etc.)
│   └── endpoints/       # API route handlers
├── core/                # Core application code (config, security)
├── db/                  # Database connection and session management
├── models/              # SQLAlchemy database models
├── schemas/             # Pydantic schemas for request/response validation
├── services/            # Business logic services
├── utils/               # Utility functions
├── static/              # Static files (CSS, JS, uploaded files)
└── templates/           # Template files (if using server-side rendering)
tests/
├── unit/                # Unit tests
└── integration/         # Integration tests
scripts/                 # Utility scripts
config/                  # Configuration files
docs/                    # Documentation
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/spend-wise.git
cd spend-wise
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root with the following content:
```
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./app.db
```

5. Initialize the database:
```bash
alembic upgrade head
```

6. Run the application:
```bash
uvicorn main:app --reload
```

The application will be available at `http://localhost:8000`.

## API Documentation

Once the application is running, you can access the API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

### Creating a new endpoint

1. Create a new file in `app/api/endpoints/`
2. Define your router and endpoints
3. Include the router in `main.py`

### Database migrations

Using Alembic for migrations:

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head
```

## Testing

Run tests with pytest:

```bash
pytest
```

For coverage report:

```bash
pytest --cov=app tests/
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
# spend-wise v0
