# Use official Python image
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (required for maturin/pyo3 builds)
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy project files
COPY . /app

# Optional: Create and activate virtual environment
# RUN python -m venv venv
# ENV PATH="/app/venv/bin:$PATH"

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Set the entry point command (change as needed)
# If using FastAPI with uvicorn:
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# Or if using Flask:
# CMD ["python", "app.py"]
# Or gunicorn for production:
CMD ["gunicorn", "app:app", "-b", "0.0.0.0:8000"]
