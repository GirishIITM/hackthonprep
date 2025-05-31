# syntax=docker/dockerfile:1.9

FROM python:3.13-slim-bookworm

# Install curl and ca-certificates for uv install
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy dependency file(s) and source code
COPY requirements.txt ./
COPY . .

# Create virtual environment and install dependencies
RUN uv venv .venv && \
    . .venv/bin/activate && \
    uv pip install -r requirements.txt

# Expose Flask default port
EXPOSE 5000

# Run the app (activate venv first)
CMD ["/bin/bash", "-c", ". .venv/bin/activate && gunicorn -b 0.0.0.0:5000 app:app"]