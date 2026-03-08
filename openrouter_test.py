import requests
import json
import keyring
from infisical_sdk import InfisicalSDKClient

# Initialize the client
client = InfisicalSDKClient(host="https://app.infisical.com")

# Authenticate (example using Universal Auth)
client.auth.universal_auth.login(
    client_id=f"{keyring.get_password("infisical", "client_id")}", # keyring.set_password("infisical", "client_id", "xxxx")
    client_secret=f"{keyring.get_password("infisical", "client_secret")}" # keyring.set_password("infisical", "client_secret", "xxxx")
)

# Use the SDK to interact with Infisical
secrets = client.secrets.list_secrets(project_id=f"{keyring.get_password("infisical", "project_id")}", environment_slug="dev", secret_path="/")

# print(secrets.secrets[0].secretValue)

response = requests.post(
  url="https://openrouter.ai/api/v1/chat/completions",
  
  headers={
    "Authorization": f"Bearer {secrets.secrets[0].secretValue}",
    "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
    "X-OpenRouter-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
  },
  data=json.dumps({
    "model": "qwen/qwen3-vl-235b-a22b-thinking", # Optional
    "messages": [
      {
        "role": "user",
        "content": "What is the meaning of life?"
      }
    ]
  })
)

print(response.text)