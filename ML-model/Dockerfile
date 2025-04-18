# Use official Python slim image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (only what's required for your project)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (required for building packages like spaCy)
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy requirements first for better cache layer usage
COPY requirements.txt .

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip \
 && pip install -r requirements.txt

# Copy project files into the image
COPY . .

# Expose the port (adjust based on your application requirements)
EXPOSE 8000

# Default command to run the app (adjust app:app to your actual app's entry point)
CMD ["gunicorn", "app:app", "-b", "0.0.0.0:8000"]
