from flask import Flask, request

from resistbot.dm_handlers import handle_incoming_dm, handle_rp_response, handle_quick_response

app = Flask(__name__)

@app.route('/')
def hello_geek():
    return '<h1>Hello from Flask & Docker</h2>'

@app.route('/incoming-dm', methods=['POST'])
def receive_incoming_dm():
    handle_incoming_dm(request.json)
    return 'Accepted', 202

@app.route('/incoming-interaction', methods=['POST'])
def receive_incoming_interaction():
    handle_quick_response(request.json)
    return 'Accepted', 202

@app.route('/rp-response', methods=['POST'])
def receive_rp_response():
    handle_rp_response(request.json)
    return 'Accepted', 202

if __name__ == "__main__":
    app.run(debug=True)
