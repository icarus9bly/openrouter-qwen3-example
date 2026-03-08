# Infisical Configuration Guide

## Overview

Infisical is a secrets management platform used in this project to securely store and retrieve the OpenRouter API key. This guide covers setup, configuration, and best practices.

The application supports three credential loading methods:

1. **Direct .env file** (simplest, for development)
2. **.env file + Infisical fallback** (recommended, flexible)
3. **Keyring + Infisical** (most secure for production)

## Architecture

### Data Flow

The credential loading follows this priority order:

```
1. Check .env file for OPENROUTER_API_KEY
   ├─→ Found? Use it and done!
   └─→ Not found? Continue to step 2

2. Check .env file for Infisical credentials (INFISICAL_CLIENT_ID, etc.)
   ├─→ Found? Use them to authenticate with Infisical
   └─→ Not found? Continue to step 3

3. Check system keyring for Infisical credentials
   ├─→ Found? Use them to authenticate with Infisical
   └─→ Not found? Raise error with helpful instructions
```

Graph view:
```
Script startup
    ├── Load .env file (python-dotenv)
    ├── Check OPENROUTER_API_KEY
    │   ├─→ Found in .env? Done!
    │   └─→ Not found? Continue...
    ├── Check INFISICAL_* credentials in .env
    │   ├─→ Found? Use them
    │   └─→ Not found? Check keyring
    ├── Try keyring for Infisical credentials
    │   ├─→ Found? Use them
    │   └─→ Not found? Raise error
    └── Use Infisical credentials to:
        ├── Authenticate with Infisical API
        └── Retrieve OPENROUTER_API_KEY from Infisical
```

## Setup Options

### Option 1: Simple .env Setup (Recommended for Development)

For development, you can simply add your OpenRouter API key to a `.env` file:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

3. Run the app - it will read from `.env` automatically:
   ```bash
   python app.py
   ```

That's it! No Infisical setup needed for development.

### Option 2: .env + Infisical Fallback (Recommended for Production)

Set up Infisical for production while keeping .env as fallback:

1. **Local Development**: Use `.env` with `OPENROUTER_API_KEY` directly
2. **Production**: Use Infisical credentials in `.env` or keyring

Edit `.env`:
```
# Leave this empty for production (will use Infisical)
# OPENROUTER_API_KEY=

# Add Infisical credentials instead
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
```

### Option 3: Keyring + Infisical (Most Secure)

For maximum security, don't put credentials in `.env` at all. Store them only in system keyring.

## Setup Steps for Infisical

**Note:** Only follow these steps if you're using Infisical (Option 2 or 3). For simple development with Option 1, using `.env.example` is sufficient.

### Step 1: Create Infisical Account and Project

1. Sign up at [https://app.infisical.com](https://app.infisical.com)
2. Create a new project called "openrouter-playground"
3. Note your **Project ID**

### Step 2: Generate Universal Auth Credentials

Universal Auth is Infisical's machine-to-machine authentication method:

1. In your Infisical project, go to **Settings → Access Control → Machine Identity**
2. Click **Create Machine Identity**
3. Name it: "CLI Auth" or "Python Script"
4. Click **Create**
5. Click **Add Credentials**
6. Choose **Universal Auth**
7. Copy the generated:
   - **Client ID**
   - **Client Secret** (only visible once!)
8. Save these temporarily

### Step 3: Store Credentials in Keyring

Open a Python interpreter and run:

```python
import keyring

# Replace with your actual values
keyring.set_password("infisical", "client_id", "your-client-id-here")
keyring.set_password("infisical", "client_secret", "your-client-secret-here")
keyring.set_password("infisical", "project_id", "your-project-id-here")

# Verify storage
print(keyring.get_password("infisical", "client_id"))  # Should print your client_id
```

### Step 4: Create Secrets in Infisical

1. In your Infisical project, select the **dev** environment
2. Click **Create Secret**
3. **Key:** `OPENROUTER_API_KEY`
4. **Value:** Your OpenRouter API key (get from https://openrouter.ai/keys)
5. **Path:** `/` (root)
6. Click **Save**

Repeat for other environments (staging, prod) as needed.

## How the Script Uses Infisical

### Authentication

```python
from infisical_sdk import InfisicalSDKClient

# Initialize Infisical client pointing to the main instance
client = InfisicalSDKClient(host="https://app.infisical.com")

# Authenticate using Universal Auth with credentials from keyring
client.auth.universal_auth.login(
    client_id=keyring.get_password("infisical", "client_id"),
    client_secret=keyring.get_password("infisical", "client_secret")
)
```

### Retrieving Secrets

```python
# Fetch secrets from a specific environment and path
secrets = client.secrets.list_secrets(
    project_id=keyring.get_password("infisical", "project_id"),
    environment_slug="dev",      # Environment name
    secret_path="/"              # Path where secrets are stored
)

# Access the first secret (which should be OPENROUTER_API_KEY)
api_key = secrets.secrets[0].secretValue
```

### Object Structure

```python
# The returned secrets object contains:
secrets.secrets[0]
  ├── id: str           # Secret ID in Infisical
  ├── key: str          # Secret name (e.g., "OPENROUTER_API_KEY")
  ├── secretValue: str  # The actual secret value
  ├── type: str         # "shared" or "personal"
  ├── tags: list        # Tags applied to the secret
  └── metadata: dict    # Additional metadata
```

## Environment Management

### Using Multiple Environments

The script currently retrieves secrets from the "dev" environment:

```python
environment_slug="dev"
```

### Setup Multiple Environments

1. In Infisical, create environments:
   - **dev** - For local development
   - **staging** - For pre-production testing
   - **prod** - For production

2. For each environment, add the same secrets:
   - `OPENROUTER_API_KEY` (with environment-specific key)
   - Any other configuration variables

3. Modify the script to use different environments:

```python
# For staging
secrets = client.secrets.list_secrets(
    project_id=...,
    environment_slug="staging",   # Switch to staging
    secret_path="/"
)

# For prod
secrets = client.secrets.list_secrets(
    project_id=...,
    environment_slug="prod",      # Switch to prod
    secret_path="/"
)
```

### Switching Environments Dynamically

```python
import os
from infisical_sdk import InfisicalSDKClient

# Get environment from OS variable or default to dev
env = os.getenv("APP_ENV", "dev")

client = InfisicalSDKClient(host="https://app.infisical.com")
client.auth.universal_auth.login(...)

secrets = client.secrets.list_secrets(
    project_id=...,
    environment_slug=env,
    secret_path="/"
)
```

## Secret Paths

Infisical organizes secrets hierarchically using paths:

```
/                           # Root level
├── OPENROUTER_API_KEY
└── OTHER_SECRET

/services/openrouter        # Nested paths
├── API_KEY
└── URL

/models/qwen               # Service-specific paths
├── CONFIG
└── SETTINGS
```

To retrieve secrets from nested paths:

```python
# Get secrets from nested path
secrets = client.secrets.list_secrets(
    project_id=...,
    environment_slug="dev",
    secret_path="/services/openrouter"
)

# List all paths
secrets_root = client.secrets.list_secrets(
    project_id=...,
    environment_slug="dev",
    secret_path="/"
)
```

## Common Operations

### Rotate API Keys

1. In Infisical, update the `OPENROUTER_API_KEY` value with the new key
2. The script automatically picks up the new value on next run
3. No code changes needed

### Add New Secrets

1. In Infisical UI, create a new secret
2. In script, retrieve it:

```python
secrets = client.secrets.list_secrets(...)
new_secret = next((s for s in secrets.secrets if s.key == "NEW_SECRET_NAME"), None)
if new_secret:
    print(new_secret.secretValue)
```

### Move Secrets Between Environments

1. Copy secret key and value
2. Create the secret in the target environment
3. Delete from source environment (optional)

### Revoke Machine Identity Access

1. In Infisical Settings → Machine Identity
2. Find your identity
3. Click **Revoke**
4. The credentials stored in keyring are now invalid

## Troubleshooting

### Error: "Unable to authenticate"

**Causes:**
- Wrong client_id or client_secret in keyring
- Machine identity revoked in Infisical
- Network connectivity issue

**Solution:**
```python
# Verify credentials
import keyring
print(keyring.get_password("infisical", "client_id"))
print(keyring.get_password("infisical", "client_secret"))

# If empty, re-run setup
keyring.set_password("infisical", "client_id", "...")
```

### Error: "Project not found"

**Cause:** Wrong project_id in keyring

**Solution:**
```python
# Find correct project_id in Infisical UI
# Settings → General → Project ID
keyring.set_password("infisical", "project_id", "your-correct-id")
```

### Error: "Secret not found"

**Causes:**
- Wrong environment_slug
- Wrong secret_path
- Secret doesn't exist

**Solution:**
```python
# Debug: List all secrets at root
secrets = client.secrets.list_secrets(
    project_id=...,
    environment_slug="dev",
    secret_path="/"
)
for secret in secrets.secrets:
    print(f"Key: {secret.key}, Type: {secret.type}")
```

### Error: "Rate limit exceeded"

**Cause:** Too many rapid requests to Infisical

**Solution:** Add delay between requests:
```python
import time
time.sleep(1)  # Wait 1 second between API calls
```

## Security Best Practices

### 1. Credential Rotation

- Regularly rotate Machine Identity credentials in Infisical
- Update keyring with new credentials
- Set a reminder every 90 days

### 2. Audit Logging

In Infisical Settings, review:
- **Audit Logs** - See who accessed which secrets
- **Event Logs** - Track machine identity actions

### 3. Least Privilege

- Create separate Machine Identities per application/environment
- Don't share credentials between services
- Revoke credentials when service is deprecated

### 4. Secure Keyring Backend

Windows uses Credential Manager - ensure it's:
- Protected by your Windows password
- Not accessible to other users
- Backed up with your system

macOS uses Keychain:
- Protected by your user password
- Secured in iCloud Keychain (optional)

Linux options:
- `pass` - GPG-encrypted password manager
- `secretservice` - System dbus service
- `kwallet` - KDE credential manager

### 5. Environment Parity

Ensure all environments have same secrets:
```python
# Compare environments
def compare_secrets(env1, env2):
    s1 = client.secrets.list_secrets(..., environment_slug=env1, ...)
    s2 = client.secrets.list_secrets(..., environment_slug=env2, ...)
    
    keys1 = {s.key for s in s1.secrets}
    keys2 = {s.key for s in s2.secrets}
    
    print(f"Only in {env1}: {keys1 - keys2}")
    print(f"Only in {env2}: {keys2 - keys1}")
```

## References

- **Infisical Docs:** https://docs.infisical.com
- **Universal Auth Guide:** https://docs.infisical.com/documentation/platform/identities/universal-auth
- **SDK Reference:** https://github.com/Infisical/python-sdk
- **Keyring Documentation:** https://keyring.readthedocs.io

