# OpenRouter Qwen3 Integration Example

A production-ready Python example demonstrating OpenRouter API integration with the Qwen3 v1 model, featuring secure credential management through Infisical SDK and local keyring storage.

## Overview

This project showcases:
- **Secure secrets management** using Infisical SDK
- **Local credential storage** using Python's keyring library
- **OpenRouter API integration** for AI model completions
- **Qwen3 v1 model** for advanced reasoning and vision tasks

## Prerequisites

- Python 3.8 or higher
- An Infisical account and project setup
- An OpenRouter API key
- Windows/macOS/Linux environment

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Infisical Credentials

Infisical is used to securely store your OpenRouter API key and other sensitive configuration. You'll need to store your Infisical authentication credentials in your local keyring.

#### Get Your Infisical Credentials

1. Log in to [Infisical](https://app.infisical.com)
2. Navigate to your project → Settings → Service Tokens/Universal Auth
3. Create or retrieve your authentication credentials:
   - **Client ID**
   - **Client Secret**
   - **Project ID**

#### Store Credentials in Local Keyring

Run these commands in Python to securely store your credentials:

```python
import keyring

# Store Infisical credentials
keyring.set_password("infisical", "client_id", "your_client_id_here")
keyring.set_password("infisical", "client_secret", "your_client_secret_here")
keyring.set_password("infisical", "project_id", "your_project_id_here")

# Verify they're stored
print(keyring.get_password("infisical", "client_id"))
```

**Important:** Never commit credentials to version control. The keyring system stores them securely on your operating system's credential manager.

### 3. Configure Infisical Secrets

1. In your Infisical project, create or update a secret for your environment (e.g., "dev")
2. Add your OpenRouter API key as a secret named `OPENROUTER_API_KEY` at the root path (`/`)
3. The script retrieves this secret and uses it to authenticate with OpenRouter

#### Example Infisical Secret Structure

```
Project: openrouter-playground
Environment: dev
├── OPENROUTER_API_KEY: sk-or-v1-xxxxx... (your OpenRouter API key)
```

## Configuration Details

### How Infisical Works in This Project

```
┌─────────────────────────────────────┐
│   Local Keyring Storage             │
│  (OS Credential Manager)            │
│  - Infisical Client ID              │
│  - Infisical Client Secret          │
│  - Infisical Project ID             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Infisical SDK                     │
│  - Authenticates with credentials   │
│  - Retrieves secrets from server    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Retrieved Secrets                 │
│  - OpenRouter API Key               │
│  - Other sensitive data             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   OpenRouter API Request            │
│  - Uses API key for authentication  │
│  - Sends prompt to Qwen3 model      │
└─────────────────────────────────────┘
```

## Usage

### Running the Script

```bash
python openrouter_test.py
```

The script will:
1. Authenticate with Infisical using stored credentials
2. Retrieve the OpenRouter API key from Infisical
3. Send a test request to OpenRouter with the prompt "What is the meaning of life?"
4. Print the API response

### Example Output

```json
{
  "choices": [
    {
      "finish_reason": "stop",
      "message": {
        "content": "The meaning of life is subjective and can vary...",
        "role": "assistant"
      },
      "index": 0
    }
  ],
  "created": 1234567890,
  "id": "gen-...",
  "model": "qwen/qwen3-vl-235b-a22b-thinking",
  "usage": {
    "completion_tokens": 150,
    "prompt_tokens": 10,
    "total_tokens": 160
  }
}
```

## Customizing the Request

Edit `openrouter_test.py` to modify:

### Change the Model

```python
"model": "qwen/qwen3-vl-235b-a22b-thinking"  # Use any OpenRouter-supported model
```

### Change the Prompt

```python
"messages": [
  {
    "role": "user",
    "content": "Your custom question here?"
  }
]
```

### Add System Instructions

```python
"messages": [
  {
    "role": "system",
    "content": "You are a helpful assistant specializing in Python development."
  },
  {
    "role": "user",
    "content": "What is the meaning of life?"
  }
]
```

### Set Optional Parameters

```python
"temperature": 0.7,          # Lower = more deterministic, higher = more creative
"max_tokens": 2048,          # Maximum response length
"top_p": 0.95,               # Nucleus sampling
```

## Environment-Specific Configuration

### Using Different Environments

The script currently uses the "dev" environment:

```python
secrets = client.secrets.list_secrets(
    project_id=...,
    environment_slug="dev",  # Change to "prod", "staging", etc.
    secret_path="/"
)
```

To use different environments:
1. Set up secrets in Infisical for each environment (dev, staging, prod)
2. Change the `environment_slug` parameter in the script

## Troubleshooting

### Issue: "keyring key not found"

**Solution:** Store credentials using the setup commands above.

```python
keyring.set_password("infisical", "client_id", "your_value")
```

### Issue: "Unable to authenticate with Infisical"

**Solution:** Verify that:
- Credentials in keyring are correct
- Universal Auth is enabled in Infisical
- Client has permissions to access the project

### Issue: "OpenRouter API Error"

**Solution:** Check that:
- API key is correctly stored in Infisical
- API key is valid at [openrouter.ai](https://openrouter.ai)
- Model name is spelled correctly
- API request quota hasn't been exceeded

### Issue: "ModuleNotFoundError"

**Solution:** Install dependencies:

```bash
pip install -r requirements.txt
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use Infisical** instead of environment files for production
3. **Rotate API keys regularly** in Infisical
4. **Restrict keyring access** using OS-level permissions
5. **Use environment-specific credentials** (separate keys for dev/prod)
6. **Audit Infisical logs** to track secret access

## Project Structure

```
openrouter_playground/
├── openrouter_test.py      # Main script
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## API Documentation

- **OpenRouter API Docs:** https://openrouter.ai/api
- **Infisical Documentation:** https://docs.infisical.com
- **Qwen3 Model Info:** https://openrouter.ai/models

## License

Specify your license here (MIT, Apache 2.0, etc.)

## Support

For issues or questions:
- Check OpenRouter API status: https://status.openrouter.ai
- Review Infisical setup: https://docs.infisical.com/getting-started
- Check model availability: https://openrouter.ai/models
