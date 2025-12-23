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
# Set these as environment variables before running make docker-build
FIREBASE_API_KEY ?= $(NEXT_PUBLIC_FIREBASE_API_KEY)
FIREBASE_AUTH_DOMAIN ?= $(NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
FIREBASE_PROJECT_ID ?= $(NEXT_PUBLIC_FIREBASE_PROJECT_ID)
FIREBASE_STORAGE_BUCKET ?= $(NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
FIREBASE_MESSAGING_SENDER_ID ?= $(NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)
FIREBASE_APP_ID ?= $(NEXT_PUBLIC_FIREBASE_APP_ID)

docker-build:
	@echo "🏗️  Building Docker image..."
	@echo "   Image: $(IMAGE_TAG)"
	@echo "   Platform: linux/amd64 (required for Cloud Run)"
	@if [ -z "$(FIREBASE_API_KEY)" ] || [ -z "$(FIREBASE_AUTH_DOMAIN)" ] || [ -z "$(FIREBASE_PROJECT_ID)" ]; then \
		echo "❌ Error: Firebase configuration variables are required"; \
		echo "   Set these environment variables:"; \
		echo "     NEXT_PUBLIC_FIREBASE_API_KEY"; \
		echo "     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"; \
		echo "     NEXT_PUBLIC_FIREBASE_PROJECT_ID"; \
		echo "     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"; \
		echo "     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"; \
		echo "     NEXT_PUBLIC_FIREBASE_APP_ID"; \
		exit 1; \
	fi
	docker build --platform linux/amd64 \
		--build-arg NEXT_PUBLIC_FIREBASE_API_KEY="$(FIREBASE_API_KEY)" \
		--build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$(FIREBASE_AUTH_DOMAIN)" \
		--build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$(FIREBASE_PROJECT_ID)" \
		--build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$(FIREBASE_STORAGE_BUCKET)" \
		--build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$(FIREBASE_MESSAGING_SENDER_ID)" \
		--build-arg NEXT_PUBLIC_FIREBASE_APP_ID="$(FIREBASE_APP_ID)" \
		-t $(IMAGE_TAG) .
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

