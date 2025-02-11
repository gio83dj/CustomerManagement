import os
import json
import shutil
import logging
from flask import Flask, render_template, request, jsonify, flash, send_from_directory, redirect, send_file, session, url_for
from werkzeug.utils import secure_filename
import csv
from datetime import datetime
import io

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Già presente, usata anche per le sessioni

# Definisci le credenziali (in produzione, dovresti gestirle in modo più sicuro)
app.config['USERNAME'] = 'user'
app.config['PASSWORD'] = 'pass'

@app.before_request
def require_login():
    logging.debug(f"Richiesta per endpoint: {request.endpoint}")
    allowed_routes = ['login', 'logout', 'static']
    if request.endpoint not in allowed_routes and not session.get('logged_in'):
        logging.debug("Utente non autenticato, redirect alla pagina di login.")
        return redirect(url_for('login', next=request.url))



# Ensure data and uploads directories exist
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def get_client_dir(client_id):
    client_dir = os.path.join(DATA_DIR, client_id)
    if not os.path.exists(client_dir):
        os.makedirs(client_dir)
    return client_dir

def load_clients():
    clients_file = os.path.join(DATA_DIR, 'clients.json')
    if os.path.exists(clients_file):
        with open(clients_file, 'r') as f:
            return json.load(f)
    return []

def save_clients(clients):
    clients_file = os.path.join(DATA_DIR, 'clients.json')
    with open(clients_file, 'w') as f:
        json.dump(clients, f, indent=2)

def get_client_by_id(client_id):
    clients = load_clients()
    for client in clients:
        if client['id'] == client_id:
            return client
    return None

def update_client(client_id, updated_data):
    clients = load_clients()
    for i, client in enumerate(clients):
        if client['id'] == client_id:
            # Preserve existing files if no new ones are uploaded
            if 'files' not in updated_data:
                updated_data['files'] = client.get('files', [])
            clients[i] = updated_data
            save_clients(clients)
            return True
    return False

def delete_client(client_id):
    clients = load_clients()
    for i, client in enumerate(clients):
        if client['id'] == client_id:
            # Remove client directory with all files
            client_dir = get_client_dir(client_id)
            for file_data in client.get('files', []):
                file_path = os.path.join(client_dir, file_data['name'])
                if os.path.exists(file_path):
                    os.remove(file_path)
            if os.path.exists(client_dir):
                shutil.rmtree(client_dir)
                #os.rmdir(client_dir)
            # Remove client from list
            del clients[i]
            save_clients(clients)
            return True
    return False
''' 
def delete_client(client_id):
    client_dir = get_client_dir(client_id)
    if os.path.exists(client_dir):
        # Remove all files and subdirectories within client_dir
        shutil.rmtree(client_dir)
        return True
    return False
'''
def get_file_icon(filename):
    ext = filename.split('.')[-1].lower()
    icons = {
        'pdf': 'bi-file-pdf',
        'doc': 'bi-file-word',
        'docx': 'bi-file-word',
        'xls': 'bi-file-excel',
        'xlsx': 'bi-file-excel',
        'txt': 'bi-file-text',
        'jpg': 'bi-file-image',
        'jpeg': 'bi-file-image',
        'png': 'bi-file-image',
        'gif': 'bi-file-image'
    }
    return icons.get(ext, 'bi-file')




@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Estrai i dati dal form
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Verifica le credenziali
        if username == app.config.get('USERNAME') and password == app.config.get('PASSWORD'):
            session['logged_in'] = True
            flash('Login effettuato con successo!', 'success')
            next_url = request.args.get('next')
            return redirect(next_url or url_for('index'))
        else:
            flash('Credenziali non valide', 'danger')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('Logout effettuato con successo!', 'success')
    return redirect(url_for('login'))


@app.context_processor
def utility_processor():
    return dict(get_file_icon=get_file_icon)


@app.route('/')
def index():
    clients = load_clients()
    logging.debug(f"Loaded {len(clients)} clients")
    return render_template('index.html', clients=clients)

@app.route('/client/<client_id>')
def client_detail(client_id):
    client = get_client_by_id(client_id)
    if client:
        return render_template('client_detail.html', client=client)
    flash('Cliente non trovato', 'error')
    return redirect('/')

@app.route('/edit_client/<client_id>', methods=['GET', 'POST'])
def edit_client(client_id):
    client = get_client_by_id(client_id)
    if not client:
        flash('Cliente non trovato', 'error')
        return redirect('/')

    if request.method == 'POST':
        client_data = request.form.to_dict()
        client_data['id'] = client_id  # Preserve the original ID

        # Handle custom fields
        custom_fields = {}
        for key, value in client_data.items():
            if key.startswith('custom_field_name_'):
                field_num = key.split('_')[-1]
                field_name = value
                field_value = client_data.get(f'custom_field_value_{field_num}', '')
                if field_name and field_value:
                    custom_fields[field_name] = field_value

        # Remove custom field temporary data and add processed custom fields
        client_data = {k: v for k, v in client_data.items() 
                      if not (k.startswith('custom_field_name_') or 
                            k.startswith('custom_field_value_'))}
        client_data['custom_fields'] = custom_fields

        # Handle file upload
        if 'files' in request.files:
            files = request.files.getlist('files')
            if 'files' not in client_data:
                client_data['files'] = client.get('files', [])

            for file in files:
                if file.filename:
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(get_client_dir(client_id), filename)
                    file.save(file_path)
                    client_data['files'].append({'name': filename, 'type': 'file'})

        if update_client(client_id, client_data):
            flash('Cliente aggiornato con successo!', 'success')
            return jsonify({'success': True})
        else:
            flash('Errore durante l\'aggiornamento del cliente', 'error')
            return jsonify({'success': False})

    return render_template('client_form.html', client=client, edit_mode=True)

@app.route('/data/<client_id>/<filename>')
def client_file(client_id, filename):
    return send_from_directory(get_client_dir(client_id), filename)

@app.route('/add_client', methods=['GET', 'POST'])
def add_client():
    if request.method == 'POST':
        client_data = request.form.to_dict()

        # Generate unique ID for the client using timestamp
        client_data['id'] = datetime.now().strftime('%Y%m%d%H%M%S')

        # Handle custom fields
        custom_fields = {}
        for key, value in client_data.items():
            if key.startswith('custom_field_name_'):
                field_num = key.split('_')[-1]
                field_name = value
                field_value = client_data.get(f'custom_field_value_{field_num}', '')
                if field_name and field_value:
                    custom_fields[field_name] = field_value

        # Remove custom field temporary data and add processed custom fields
        client_data = {k: v for k, v in client_data.items() 
                      if not (k.startswith('custom_field_name_') or 
                            k.startswith('custom_field_value_'))}
        client_data['custom_fields'] = custom_fields

        # Handle file upload
        if 'files' in request.files:
            files = request.files.getlist('files')
            client_data['files'] = []
            for file in files:
                if file.filename:
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(get_client_dir(client_data['id']), filename)
                    file.save(file_path)
                    client_data['files'].append({'name': filename, 'type': 'file'})

        # Save client data
        clients = load_clients()
        clients.append(client_data)
        save_clients(clients)
        logging.debug(f"Added new client with ID: {client_data['id']}")

        flash('Cliente aggiunto con successo!', 'success')
        return jsonify({'success': True})

    return render_template('client_form.html', edit_mode=False)

@app.route('/search')
def search():
    query = request.args.get('q', '').lower()
    clients = load_clients()
    results = [c for c in clients if 
              query in c.get('nome', '').lower() or 
              query in c.get('cognome', '').lower() or
              query in c.get('telefono', '').lower() or
              query in c.get('matricola', '').lower()]

    # Log for debugging
    logging.debug(f"Search query: {query}")
    logging.debug(f"Found {len(results)} results")

    return jsonify(results)

@app.route('/delete_client/<client_id>', methods=['POST'])
def delete_client_route(client_id):
    if delete_client(client_id):
        flash('Cliente eliminato con successo!', 'success')
        return jsonify({'success': True})
    flash('Errore durante l\'eliminazione del cliente', 'error')
    return jsonify({'success': False})

@app.route('/delete_client_file/<client_id>/<filename>', methods=['POST'])
def delete_client_file(client_id, filename):
    client = get_client_by_id(client_id)
    if client:
        for i, file_data in enumerate(client.get('files', [])):
            if file_data['name'] == filename:
                # Remove file
                file_path = os.path.join(get_client_dir(client_id), filename)
                if os.path.exists(file_path):
                    os.remove(file_path)

                # Update client data
                del client['files'][i]
                if update_client(client_id, client):
                    return jsonify({'success': True})
                break
    return jsonify({'success': False}), 404


@app.route('/export_excel')
def export_excel():
    clients = load_clients()
    output = io.StringIO()
    writer = csv.writer(output)

    # Calculate max number of files
    max_files = max([len(client.get('files', [])) for client in clients], default=0)

    # Write header
    header = ['Nome', 'Cognome', 'Telefono', 'Indirizzo', 'Città', 'CAP', 
              'Marca', 'Modello', 'Matricola', 'Data Installazione']

    # Add file headers
    for i in range(max_files):
        header.extend([f'File {i+1} (Server)'])
        #header.extend([f'File {i+1} (Locale)', f'File {i+1} (Server)'])

    writer.writerow(header)

    # Write data
    for client in clients:
        row = [
            client.get('nome', ''),
            client.get('cognome', ''),
            client.get('telefono', ''),
            client.get('indirizzo', ''),
            client.get('citta', ''),
            client.get('cap', ''),
            client.get('marca', ''),
            client.get('modello', ''),
            client.get('matricola', ''),
            client.get('dataInstallazione', '')
        ]

        # Add file paths with hyperlinks
        files = client.get('files', [])
        for i in range(max_files):
            if i < len(files):
                local_path = f"data/{client['id']}/{files[i]['name']}"
                server_path = f"{"http://188.153.82.151:5000/"}data/{client['id']}/{files[i]['name']}"
                #server_path = f"{request.host_url}data/{client['id']}/{files[i]['name']}"
                # Create hyperlink formulas
                server_hyperlink = f'=COLLEG.IPERTESTUALE("{server_path}","{files[i]["name"]}")'
                #server_hyperlink = f'=COLLEG.IPERTESTUALE("{server_path}","Visualizza {files[i]["name"]}")'
                row.extend([server_hyperlink])
                #row.extend([local_path, server_hyperlink])
            else:
                row.extend(['', ''])

        writer.writerow(row)

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        mimetype='application/vnd.ms-excel',
        as_attachment=True,
        download_name=f'clienti_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xls'
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)