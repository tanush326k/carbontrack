# Use an official lightweight Python image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy the entire project
COPY . /app

# Install runtime dependencies
RUN pip install --no-cache-dir fastapi uvicorn sqlalchemy pydantic

# Add a non-root user for security
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# Expose the port FastAPI runs on (defaulting to 8000)
ENV PORT=8000
EXPOSE $PORT

# Command to run the app using the dynamic PORT environment variable from Cloud Run
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
