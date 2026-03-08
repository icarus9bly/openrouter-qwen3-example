# Quick Start Guide - Local Development

Get the OpenRouter playground running locally in minutes.

## Prerequisites

- Python 3.8+
- Infisical account with project setup
- OpenRouter API key

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Infisical (One-Time Setup)

Open Python and run:

```bash
python
```

Then in the Python interpreter:

```python
import keyring

# Set your Infisical credentials (get from Infisical UI → Settings → Machine Identity)
keyring.set_password("infisical", "client_id", "your_client_id")
keyring.set_password("infisical", "client_secret", "your_client_secret")
keyring.set_password("infisical", "project_id", "your_project_id")

# Verify (should print your client_id)
print(keyring.get_password("infisical", "client_id"))

# Exit Python
exit()
```

### 3. Create OpenRouter API Key

1. Go to https://openrouter.ai/keys
2. Create a new API key
3. Copy it

### 4. Add API Key to Infisical

1. Log in to https://app.infisical.com
2. Select your project → **dev** environment
3. Click **Create Secret**
4. Set:
   - **Key:** `OPENROUTER_API_KEY`
   - **Value:** Your API key from step 3
   - **Path:** `/` (root)
5. Save

### 5. Run the Script

```bash
python openrouter_test.py
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: No module named 'keyring'` | Run `pip install -r requirements.txt` |
| `Unable to authenticate with Infisical` | Verify credentials: `keyring.get_password("infisical", "client_id")` should not be empty |
| `Secret not found error` | Check that API key is added in Infisical under dev environment at path `/` |
| `Invalid API key` | Verify OpenRouter API key is active at https://openrouter.ai/keys |
| KeyError accessing `secrets.secrets[0]` | No secrets found - check Infisical project/environment setup |

## Next Steps

### Modify the Request

Edit `openrouter_test.py` to:

```python
# Change the prompt
"content": "Tell me a joke about programming"

# Change the model
"model": "openai/gpt-4-turbo"

# Add parameters
"temperature": 0.5,
"max_tokens": 1000,
```

### Use Different Prompt

Replace the message:

```python
"messages": [
  {
    "role": "system",
    "content": "You are a helpful Python expert."
  },
  {
    "role": "user", 
    "content": "Explain decorators in Python"
  }
]
```

### Test Different Models

OpenRouter supports many models. Try:

```python
"model": "openai/gpt-4-turbo"          # GPT-4
"model": "anthropic/claude-3-opus"     # Claude 3
"model": "google/gemini-pro"           # Gemini
```

View all: https://openrouter.ai/models

### Switch to Production Environment

In `openrouter_test.py`, change:

```python
environment_slug="prod",  # Instead of "dev"
```

## Key Files

| File | Purpose |
|------|---------|
| `openrouter_test.py` | Main script |
| `requirements.txt` | Python dependencies |
| `README.md` | Full documentation |
| `INFISICAL_SETUP.md` | Detailed Infisical guide |
| `QUICKSTART.md` | This file |

## Common Commands

```bash
# Install/update dependencies
pip install -r requirements.txt

# Run the script
python openrouter_test.py

# Check installed packages
pip list
```

## Getting Help

1. **Infisical issues?** → See [INFISICAL_SETUP.md](INFISICAL_SETUP.md)
2. **API errors?** → Check [OpenRouter status](https://status.openrouter.ai)
3. **Python issues?** → Verify Python version: `python --version`
4. **Credentials issues?** → Check keyring: `python -c "import keyring; print(keyring.get_password('infisical', 'client_id'))"`

## Security Reminder

- Credentials stored in system keyring (protected by OS)
- API key stored in Infisical (encrypted)
- Never commit credentials to git
- Never hardcode secrets in code
- Never share your Infisical credentials

---

**Stuck?** Review the [full README](README.md) or [Infisical setup guide](INFISICAL_SETUP.md)
