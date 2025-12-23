# Deployment Guide for Vibe Trade UI

This guide explains how to deploy the Vibe Trade UI to GCP Cloud Run with Firebase Authentication.

## Prerequisites

1. GCP Project with Firebase/Identity Platform enabled
2. Firebase Authentication configured with your desired providers (Google, Email/Password, etc.)
3. Terraform configured (see `vibe-trade-terraform/`)
4. Docker installed locally
5. `gcloud` CLI installed and authenticated

## Firebase Configuration

The UI uses Firebase Authentication. You need to configure Firebase and get your configuration values:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → General
4. Scroll down to "Your apps" section
5. Copy the Firebase configuration values

## Environment Variables

### Build-Time Variables (Required)

These variables are baked into the JavaScript bundle during `next build` and must be passed as Docker build args:

```bash
export NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
export NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### Runtime Variables (Set in Terraform)

These are set in `terraform.tfvars`:

- `snaptrade_client_id` - SnapTrade client ID
- `snaptrade_consumer_key` - SnapTrade consumer key
- `firebase_service_account_key` (optional) - Firebase Admin SDK service account JSON

**Note:** Firebase Admin SDK uses Application Default Credentials on GCP Cloud Run, so `FIREBASE_SERVICE_ACCOUNT_KEY` is optional when running on Cloud Run.

## Deployment Steps

### 1. Set Up Infrastructure (First Time Only)

```bash
cd vibe-trade-terraform

# Edit terraform.tfvars with your values
# Then apply:
terraform init
terraform plan
terraform apply
```

### 2. Set Firebase Environment Variables

```bash
cd vibes/quant

# Set Firebase config as environment variables
export NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
export NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 3. Build and Deploy

```bash
# Build Docker image and push to Artifact Registry
make docker-build-push

# Or deploy everything (build, push, update Cloud Run)
make deploy
```

### 4. Verify Deployment

After deployment, get the service URL:

```bash
gcloud run services describe vibe-trade-ui \
  --region us-central1 \
  --format 'value(status.url)'
```

## Makefile Commands

- `make install` - Install npm dependencies
- `make dev` - Run development server locally
- `make build` - Build Next.js application
- `make docker-build` - Build Docker image (requires Firebase env vars)
- `make docker-push` - Push Docker image to Artifact Registry
- `make docker-build-push` - Build and push image
- `make deploy` - Full deployment (build, push, update Cloud Run)
- `make force-revision` - Force Cloud Run to use latest image

## Important Notes

1. **Build-Time vs Runtime Variables:**
   - `NEXT_PUBLIC_*` variables are build-time only - they're compiled into the JavaScript bundle
   - These must be passed as Docker build args (handled by Makefile)
   - Runtime environment variables won't work for `NEXT_PUBLIC_*` variables

2. **Firebase Admin SDK:**
   - On Cloud Run, Firebase Admin SDK automatically uses Application Default Credentials
   - No need to set `FIREBASE_SERVICE_ACCOUNT_KEY` unless you need explicit service account credentials
   - The Cloud Run service account needs Firebase Admin permissions

3. **Service Account Permissions:**
   - The UI Cloud Run service account (`vibe-trade-ui-runner`) needs:
     - Firebase Admin SDK permissions (if using Firebase Admin features)
     - Any other GCP permissions your app needs

4. **API Authentication Compatibility:**
   - **Note:** The API service (`vibe-trade-api`) currently still uses NextAuth for JWT validation
   - If your UI sends Firebase ID tokens to the API, you'll need to update the API to validate Firebase tokens
   - See `vibe-trade-api/src/auth.py` - it needs to be updated to use Firebase Admin SDK for token verification
   - Until the API is migrated, you may need to keep `NEXTAUTH_SECRET` in the API's Terraform config

## Troubleshooting

### Build fails with "Firebase configuration variables are required"
- Make sure you've exported all `NEXT_PUBLIC_FIREBASE_*` environment variables before running `make docker-build`

### Firebase Auth not working after deployment
- Verify Firebase configuration values are correct
- Check that Firebase Authentication is enabled in Firebase Console
- Ensure your Firebase project matches the `NEXT_PUBLIC_FIREBASE_PROJECT_ID` value

### Service account permissions issues
- Verify the Cloud Run service account has necessary permissions
- Check Cloud Run logs: `gcloud run services logs read vibe-trade-ui --region us-central1`

