#!/usr/bin/env bash

# GCP Cloud Run deployment automation script
# Set exit on error
set -e

# Configuration
REGION="us-central1"
REPO_NAME="eco-trace-repo"
SERVICE_NAME="eco-trace"
IMAGE_NAME="eco-trace-app"

# Prompt for Project ID if not set
if [ -z "$GCP_PROJECT" ]; then
    echo "=========================================================="
    echo "Enter your Google Cloud Project ID:"
    read -r GCP_PROJECT
    echo "=========================================================="
fi

if [ -z "$GCP_PROJECT" ]; then
    echo "Error: GCP Project ID is required."
    exit 1
fi

echo "Using GCP Project: $GCP_PROJECT"
gcloud config set project "$GCP_PROJECT"

echo "1. Enabling required GCP APIs..."
gcloud services enable \
    artifactregistry.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com

echo "2. Ensuring Artifact Registry Docker repository exists..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
    echo "Creating repository $REPO_NAME in region $REGION..."
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker repository for EcoTrace application"
else
    echo "Repository $REPO_NAME already exists in region $REGION."
fi

# Define full image path
IMAGE_PATH="${REGION}-docker.pkg.dev/${GCP_PROJECT}/${REPO_NAME}/${IMAGE_NAME}:latest"

echo "3. Submitting build to GCP Cloud Build..."
gcloud builds submit --tag "$IMAGE_PATH" .

echo "4. Deploying to GCP Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_PATH" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --max-instances 2 \
    --memory 512Mi \
    --cpu 1

echo "=========================================================="
echo "SUCCESS! EcoTrace Carbon Tracker deployed successfully."
echo "=========================================================="
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)'
