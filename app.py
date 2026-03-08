from flask import Flask, render_template, request, jsonify, Response
import requests
import json
import keyring
from infisical_sdk import InfisicalSDKClient

app = Flask(__name__)

# Initialize Infisical client
def get_openrouter_key():
    """Retrieve the OpenRouter API key from Infisical"""
    client = InfisicalSDKClient(host="https://app.infisical.com")
    
    client.auth.universal_auth.login(
        client_id=keyring.get_password("infisical", "client_id"),
        client_secret=keyring.get_password("infisical", "client_secret")
    )
    
    secrets = client.secrets.list_secrets(
        project_id=keyring.get_password("infisical", "project_id"),
        environment_slug="dev",
        secret_path="/"
    )
    
    return secrets.secrets[0].secretValue

@app.route('/')
def index():
    """Serve the chat interface"""
    return render_template('index.html')

@app.route('/api/chat-stream', methods=['POST'])
def chat_stream():
    """Handle chat messages with streaming response"""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get the API key
        api_key = get_openrouter_key()
        
        # Call OpenRouter API with streaming
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "http://localhost:5000",
                "X-OpenRouter-Title": "Chat Interface",
            },
            json={
                "model": "qwen/qwen3-vl-235b-a22b-thinking",
                "messages": [
                    {
                        "role": "user",
                        "content": user_message
                    }
                ],
                "stream": True
            },
            stream=True
        )
        
        response.raise_for_status()
        
        def generate():
            """Generator function to stream response chunks"""
            try:
                for line in response.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        if line.startswith('data: '):
                            data_str = line[6:]  # Remove 'data: ' prefix
                            if data_str == '[DONE]':
                                # Stream finished
                                yield f"data: {json.dumps({'done': True})}\n\n"
                                break
                            try:
                                chunk_data = json.loads(data_str)
                                if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                    delta = chunk_data['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content:
                                        yield f"data: {json.dumps({'content': content})}\n\n"
                            except json.JSONDecodeError:
                                pass
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return Response(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
                'Connection': 'keep-alive'
            }
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages and call OpenRouter API (non-streaming)"""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get the API key
        api_key = get_openrouter_key()
        
        # Call OpenRouter API
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "http://localhost:5000",
                "X-OpenRouter-Title": "Chat Interface",
            },
            json={
                "model": "qwen/qwen3-vl-235b-a22b-thinking",
                "messages": [
                    {
                        "role": "user",
                        "content": user_message
                    }
                ]
            }
        )
        
        response.raise_for_status()
        result = response.json()
        
        # Extract the assistant's response
        if 'choices' in result and len(result['choices']) > 0:
            assistant_message = result['choices'][0]['message']['content']
            return jsonify({
                'success': True,
                'response': assistant_message
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid response from API'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
