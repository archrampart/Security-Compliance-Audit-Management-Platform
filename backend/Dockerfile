FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Make init script executable
RUN chmod +x docker-init.sh

# Expose port
EXPOSE 9090

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9090"]

