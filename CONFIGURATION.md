# Configuration Guide - Quick Start

Your app now supports three ways to provide credentials:

## Quick Setup (Pick One)

### 1️⃣ **Development - Direct .env (Easiest)**
```bash
# Create .env file
OPENROUTER_API_KEY=your-api-key-here
```
✅ Simplest for local development  
❌ Not recommended for production

### 2️⃣ **Development + Production - .env with Infisical Fallback (Recommended)**
```bash
# Development: .env file with direct API key
OPENROUTER_API_KEY=sk-or-v1-xxxxxxx

# Production: .env file with Infisical credentials
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
```
✅ Flexible for both dev and prod  
✅ Easy to switch between environments

### 3️⃣ **Most Secure - Keyring + Infisical (Production)**
```bash
# Don't put credentials in .env
# Instead, store in system keyring:

import keyring
keyring.set_password("infisical", "client_id", "...")
keyring.set_password("infisical", "client_secret", "...")
keyring.set_password("infisical", "project_id", "...")
```
✅ Credentials never in files  
✅ Most secure for production  
❌ Requires keyring setup

## How It Works

The app checks for credentials in this order:

1. **OPENROUTER_API_KEY** in `.env` → Use it ✓
2. **INFISICAL_*** in `.env` → Use them to fetch from Infisical ✓
3. **Infisical credentials** in system keyring → Use them to fetch from Infisical ✓
4. If none found → Error with helpful instructions

## Files Changed

- **requirements.txt**: Added `python-dotenv==1.0.0`
- **app.py**: 
  - Added `load_dotenv()` to load .env file
  - New `get_credential()` function for .env + keyring fallback
  - Updated `get_openrouter_key()` to try .env first, then Infisical
- **.env.example**: Created with configuration template
- **INFISICAL_SETUP.md**: Updated with new credential loading options

## Next Steps

1. Rename `.env.example` to `.env`
2. Choose your setup option (1, 2, or 3 from above)
3. Fill in your credentials
4. Install dependencies: `pip install -r requirements.txt`
5. Run: `python app.py`

## Error Troubleshooting

If you see credential errors, check:

✅ `.env` file exists in project root  
✅ Credentials are not empty or commented out  
✅ For Infisical: Client ID/Secret/Project ID are correct  
✅ For Keyring: Credentials are stored with correct service/username
