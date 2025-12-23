.PHONY: install locally run dev build start lint lint-fix format format-check check ci clean \
	docker-build docker-push docker-build-push deploy deploy-image force-revision

install:
	@echo "📦 Installing dependencies..."
	npm install

# Setup for local development: install deps, fix linting, and format code
locally: install lint-fix format
	@echo "✅ Local setup complete!"

# Run the development server
dev:
	@echo "🚀 Starting Next.js development server..."
	npm run dev

# Build the application
build:
	@echo "🏗️  Building Next.js application..."
	npm run build

# Start production server locally
start: build
	@echo "🚀 Starting Next.js production server..."
	npm start

lint:
	@echo "🔍 Running linter..."
	npm run lint

lint-fix:
	@echo "🔧 Fixing linting issues..."
	npm run lint

format:
	@echo "✨ Formatting code..."
	@echo "   (Next.js template uses ESLint for formatting)"

format-check:
	@echo "🔍 Checking code format..."
	npm run lint

check: lint format-check
	@echo "✅ All checks passed!"

ci: lint format-check
	@echo "✅ CI checks passed!"

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf .next
	rm -rf node_modules/.cache
	rm -rf out
	@echo "✅ Clean complete"

# Docker commands - use environment variable or default
# Set ARTIFACT_REGISTRY_URL env var or it will use the default
ARTIFACT_REGISTRY_URL ?= us-central1-docker.pkg.dev/vibe-trade-475704/vibe-trade-ui
IMAGE_TAG := $(ARTIFACT_REGISTRY_URL)/vibe-trade-ui:latest

# Firebase configuration - these are build-time variables (NEXT_PUBLIC_*)
# They get baked into the JavaScript bundle during next build
# For local dev: Load from .env file if it exists, otherwise use environment variables
# For deployment (docker-build): Load from terraform.tfvars
ifneq (,$(wildcard .env))
    include .env
    export
endif

FIREBASE_API_KEY ?= $(NEXT_PUBLIC_FIREBASE_API_KEY)
FIREBASE_AUTH_DOMAIN ?= $(NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
FIREBASE_PROJECT_ID ?= $(NEXT_PUBLIC_FIREBASE_PROJECT_ID)
FIREBASE_STORAGE_BUCKET ?= $(NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
FIREBASE_MESSAGING_SENDER_ID ?= $(NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)
FIREBASE_APP_ID ?= $(NEXT_PUBLIC_FIREBASE_APP_ID)
LANGSMITH_API_KEY ?= $(NEXT_PUBLIC_LANGSMITH_API_KEY)

docker-build:
	@echo "🏗️  Building Docker image..."
	@echo "   Image: $(IMAGE_TAG)"
	@echo "   Platform: linux/amd64 (required for Cloud Run)"
	@echo "   Loading Firebase config from terraform.tfvars..."
	@TERRAFORM_TFVARS="../../vibe-trade-terraform/terraform.tfvars" && \
	if [ -f "$$TERRAFORM_TFVARS" ]; then \
		FIREBASE_API_KEY=$$(grep -E '^\s*firebase_api_key\s*=' $$TERRAFORM_TFVARS | sed -E 's/^[[:space:]]*firebase_api_key[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/' | head -1); \
		FIREBASE_AUTH_DOMAIN=$$(grep -E '^\s*firebase_auth_domain\s*=' $$TERRAFORM_TFVARS | sed -E 's/^[[:space:]]*firebase_auth_domain[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/' | head -1); \
		FIREBASE_PROJECT_ID=$$(grep -E '^\s*firebase_project_id\s*=' $$TERRAFORM_TFVARS | sed -E 's/^[[:space:]]*firebase_project_id[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/' | head -1); \
		FIREBASE_STORAGE_BUCKET=$$(grep -E '^\s*firebase_storage_bucket\s*=' $$TERRAFORM_TFVARS | sed -E 's/^[[:space:]]*firebase_storage_bucket[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/' | head -1); \
		FIREBASE_MESSAGING_SENDER_ID=$$(grep -E '^\s*firebase_messaging_sender_id\s*=' $$TERRAFORM_TFVARS | sed -E 's/^[[:space:]]*firebase_messaging_sender_id[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/' | head -1); \
		FIREBASE_APP_ID=$$(grep -E '^\s*firebase_app_id\s*=' $$TERRAFORM_TFVARS | sed -E 's/^[[:space:]]*firebase_app_id[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/' | head -1); \
		LANGGRAPH_API_URL=$$(grep -E '^\s*langgraph_api_url\s*=' $$TERRAFORM_TFVARS | sed -E 's/^[[:space:]]*langgraph_api_url[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/' | head -1); \
		LANGSMITH_API_KEY=$$(grep -E '^\s*langsmith_api_key\s*=' $$TERRAFORM_TFVARS | sed -E 's/^[[:space:]]*langsmith_api_key[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/' | head -1); \
		if [ -z "$$FIREBASE_API_KEY" ] || [ -z "$$FIREBASE_AUTH_DOMAIN" ] || [ -z "$$FIREBASE_PROJECT_ID" ]; then \
			echo "❌ Error: Required Firebase configuration variables are missing in terraform.tfvars"; \
			echo "   Required:"; \
			echo "     firebase_api_key"; \
			echo "     firebase_auth_domain"; \
			echo "     firebase_project_id"; \
			exit 1; \
		fi; \
		if [ -z "$$LANGSMITH_API_KEY" ]; then \
			echo "❌ Error: langsmith_api_key is missing in terraform.tfvars"; \
			echo "   Required for LangGraph agent authentication"; \
			exit 1; \
		fi; \
		docker build --platform linux/amd64 \
			--build-arg NEXT_PUBLIC_FIREBASE_API_KEY="$$FIREBASE_API_KEY" \
			--build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$$FIREBASE_AUTH_DOMAIN" \
			--build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$$FIREBASE_PROJECT_ID" \
			--build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$$FIREBASE_STORAGE_BUCKET" \
			--build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$$FIREBASE_MESSAGING_SENDER_ID" \
			--build-arg NEXT_PUBLIC_FIREBASE_APP_ID="$$FIREBASE_APP_ID" \
			--build-arg NEXT_PUBLIC_LANGGRAPH_API_URL="$$LANGGRAPH_API_URL" \
			--build-arg NEXT_PUBLIC_LANGSMITH_API_KEY="$$LANGSMITH_API_KEY" \
			-t $(IMAGE_TAG) .; \
	else \
		echo "❌ Error: terraform.tfvars not found at $$TERRAFORM_TFVARS"; \
		echo "   For deployment, Firebase config must be in terraform.tfvars"; \
		exit 1; \
	fi
	@echo "✅ Build complete"

docker-push:
	@echo "📤 Pushing Docker image..."
	@echo "   Image: $(IMAGE_TAG)"
	@echo "   Authenticating with GCP..."
	@gcloud auth configure-docker us-central1-docker.pkg.dev 2>/dev/null || true
	docker push $(IMAGE_TAG)
	@echo "✅ Push complete"

docker-build-push: docker-build docker-push

# Deployment workflow
# Step 1: Build and push Docker image
# Step 2: Force Cloud Run to use the new image
# For infrastructure changes, run 'terraform apply' in vibe-trade-terraform separately
deploy: docker-build-push force-revision
	@echo ""
	@echo "✅ Code deployment complete!"

# Force Cloud Run to create a new revision with the latest image
# Uses environment variables or defaults
force-revision:
	@echo "🔄 Forcing Cloud Run to use latest image..."
	@SERVICE_NAME=$${SERVICE_NAME:-vibe-trade-ui} && \
		REGION=$${REGION:-us-central1} && \
		PROJECT_ID=$${PROJECT_ID:-vibe-trade-475704} && \
		IMAGE_REPO=$${ARTIFACT_REGISTRY_URL:-us-central1-docker.pkg.dev/vibe-trade-475704/vibe-trade-ui} && \
		echo "   Service: $$SERVICE_NAME" && \
		echo "   Region: $$REGION" && \
		echo "   Image: $$IMAGE_REPO/vibe-trade-ui:latest" && \
		gcloud run services update $$SERVICE_NAME \
			--region=$$REGION \
			--project=$$PROJECT_ID \
			--image=$$IMAGE_REPO/vibe-trade-ui:latest \
			2>&1 | grep -E "(Deploying|revision|Service URL|Done)" || (echo "⚠️  Update may have failed or no changes needed" && exit 1)

deploy-image: docker-build-push
	@echo ""
	@echo "✅ Image deployed!"
	@echo "📋 Run 'make force-revision' to update Cloud Run, or 'terraform apply' in vibe-trade-terraform for infrastructure changes"

