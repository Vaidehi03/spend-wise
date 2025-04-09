.PHONY: setup install run init-db clean test lint upgrade-deps help create-env backup-db migrate sample-data docker-build docker-run docker-up docker-down frontend-setup frontend-install frontend-dev frontend-build frontend-start

PYTHON = python3
VENV = venv
APP = main:app
HOST = 0.0.0.0
PORT = 8000
DB_FILE = app.db
BACKUP_DIR = backups
DOCKER_IMAGE = spendwise-api
FRONTEND_DIR = frontend
FRONTEND_PORT = 3000

setup:
	$(PYTHON) -m venv $(VENV)
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
	pip3 install fastapi uvicorn sqlalchemy python-jose passlib python-multipart python-dotenv
	pip3 install email-validator
	pip3 install pandas openpyxl
	pip3 install bcrypt
	pip3 install pydantic-settings
	pip3 install --upgrade pip
	. $(VENV)/bin/activate
	@echo "Setup complete!"

install:
	# pip install -r requirements.txt
	pip3 install fastapi uvicorn sqlalchemy python-jose passlib python-multipart python-dotenv
	pip3 install email-validator
	pip3 install pandas openpyxl
	pip3 install bcrypt
	pip3 install pydantic-settings
	pip3 install --upgrade pip
	@echo "Dependencies installed."

run:
	@echo "Starting SpendWise application with auto-reload..."
	uvicorn $(APP) --host $(HOST) --port $(PORT) --reload

run-prod:
	@echo "Starting SpendWise application in production mode..."
	uvicorn $(APP) --host $(HOST) --port $(PORT) --workers 4

init-db:
	$(PYTHON) init_db.py
	@echo "Database initialization complete."

sample-data:
	@echo "Loading sample transaction data for testing..."
	$(PYTHON) scripts/load_sample_data.py
	@echo "Sample data loaded."

clean:
	@echo "Cleaning up..."
	rm -rf __pycache__
	rm -rf app/__pycache__
	rm -rf app/**/__pycache__
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	@echo "Cleanup complete."

test:
	@echo "Running tests..."
	pytest
	@echo "Tests complete."

docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE) .
	@echo "Docker image built."

docker-run:
	@echo "Running Docker container..."
	docker run -p $(PORT):$(PORT) --name $(DOCKER_IMAGE) $(DOCKER_IMAGE)
	@echo "Docker container started."

docker-up:
	@echo "Starting services with docker-compose..."
	docker-compose up -d
	@echo "Services started. Access the API at http://localhost:$(PORT)"

docker-down:
	@echo "Stopping services with docker-compose..."
	docker-compose down
	@echo "Services stopped."

frontend-setup:
	@echo "Setting up frontend dependencies..."
	cd $(FRONTEND_DIR) && pnpm install
	@echo "Frontend setup complete!"

frontend-install:
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && pnpm install
	@echo "Frontend dependencies installed."

frontend-dev:
	@echo "Starting frontend development server..."
	cd $(FRONTEND_DIR) && pnpm dev

frontend-build:
	@echo "Building frontend for production..."
	cd $(FRONTEND_DIR) && pnpm build
	@echo "Frontend build complete."

frontend-start:
	@echo "Starting frontend production server..."
	cd $(FRONTEND_DIR) && pnpm start

clean-node:
	rm -rf frontend/node_modules
