import os
import re
import time
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.auth.transport.requests import Request
import io

# --- CONFIGURAZIONE BACKUP VERO (SPOSTATA IN CIMA PER EVITARE ERRORI) ---
DISCO_ESTERNO = "E:\\Foto_Backup\\"
TOKEN_FILE = "token.json"
CREDENTIALS_FILE = "credentials.json"

# --- NUOVE LIBRERIE AI ---
import json

# --- CONFIGURAZIONE CATALOGO ---
CATALOGO_FILE = os.path.join(DISCO_ESTERNO, "catalogo.json")

# Carica o crea il catalogo
def carica_catalogo():
    if os.path.exists(CATALOGO_FILE):
        with open(CATALOGO_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def salva_catalogo(catalogo):
    with open(CATALOGO_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalogo, f, indent=2, ensure_ascii=False)


# Contatori globali per il "Contatore Fantasma"
STATS = {'cartelle_drive': 0, 'foto_drive': 0, 'cartelle_salvate': 0, 'foto_salvate': 0}

def get_drive_service():
    creds = None
    SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
    
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
            
    return build('drive', 'v3', credentials=creds)

def pulisci_nome(nome):
    """Sostituisce spazi FINALI con _ per mantenere unicità assoluta"""
    nome = nome.lstrip()  # Rimuove spazi iniziali
    if nome.endswith(' '):
        nome = nome.rstrip() + '_'  # Sostituisce spazio finale con _
    nome = re.sub(r' {2,}', '_', nome)  # Spazi multipli interni -> _
    return nome

def conta_elementi_drive(service, folder_id):
    """Conta cartelle e foto totali su Drive (per il contatore)"""
    q_folder = f"'{folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder'"
    result_folder = service.files().list(q=q_folder, pageSize=1000, fields="files(id)").execute()
    folders = result_folder.get('files', [])
    STATS['cartelle_drive'] += len(folders)
    
    q_photo = f"'{folder_id}' in parents and mimeType contains 'image/'"
    result_photo = service.files().list(q=q_photo, pageSize=1000, fields="files(id)").execute()
    photos = result_photo.get('files', [])
    STATS['foto_drive'] += len(photos)
    
    for folder in folders:
        conta_elementi_drive(service, folder['id'])

def crea_struttura(service, folder_id, percorso_locale):
    """Crea tutte le cartelle PRIMA, usando nomi puliti"""
    percorso_locale = os.path.normpath(percorso_locale)
    
    if not os.path.exists(percorso_locale):
        try:
            os.makedirs(percorso_locale)
            STATS['cartelle_salvate'] += 1
            print(f" Creata: {percorso_locale}")
        except Exception as e:
            print(f" Errore creazione {percorso_locale}: {e}")
            return

    page_token = None
    while True:
        results = service.files().list(
            pageSize=1000,
            q=f"'{folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder'",
            fields="nextPageToken, files(id, name)",
            pageToken=page_token
        ).execute()
        
        folders = results.get('files', [])
        for folder in folders:
            nome_originale = folder['name']
            nome_pulito = pulisci_nome(nome_originale)
            
            if nome_originale != nome_pulito:
                print(f"  PULITO: '{nome_originale}' -> '{nome_pulito}'")
            
            nuova_cartella = os.path.join(percorso_locale, nome_pulito)
            crea_struttura(service, folder['id'], nuova_cartella)
            
        page_token = results.get('nextPageToken', None)
        if not page_token:
            break

def scarica_tutto(service, folder_id, percorso_locale):
    """Scarica i file nelle cartelle già create"""
    percorso_locale = os.path.normpath(percorso_locale)
    
    page_token = None
    while True:
        results = service.files().list(
            pageSize=1000,
            q=f"'{folder_id}' in parents and mimeType contains 'image/'",
            fields="nextPageToken, files(id, name, size)",
            pageToken=page_token
        ).execute()
        
        items = results.get('files', [])
        for item in items:
            try:
                final_path = os.path.join(percorso_locale, item['name'])
                if os.path.exists(final_path):
                    STATS['foto_salvate'] += 1
                    print(f"⏭️ Saltato: {item['name']}")
                    continue

                print(f" Downloading: {item['name']}...")
                request = service.files().get_media(fileId=item['id'])
                fh = io.BytesIO()
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
                
                temp_path = os.path.join(percorso_locale, item['name'] + ".tmp")
                
                with open(temp_path, 'wb') as f:
                    f.write(fh.getvalue())
                    f.flush()
                    os.fsync(f.fileno())
                
                drive_file = service.files().get(fileId=item['id'], fields='size').execute()
                if int(drive_file.get('size', 0)) == os.path.getsize(temp_path):
                    os.rename(temp_path, final_path)
                    STATS['foto_salvate'] += 1
                    
                    print(f"✅ Salvata: {item['name']}")
                    
                else:
                    print(f" ERRORE DIMENSIONE: {item['name']}")
                    os.remove(temp_path)
                    
            except Exception as e:
                print(f"️ SKIP {item['name']}: {e}")
            
        page_token = results.get('nextPageToken', None)
        if not page_token:
            break
            
    page_token = None
    while True:
        results = service.files().list(
            pageSize=1000,
            q=f"'{folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder'",
            fields="nextPageToken, files(id, name)",
            pageToken=page_token
        ).execute()
        
        folders = results.get('files', [])
        for folder in folders:
            nome_pulito = pulisci_nome(folder['name'])
            nuova_cartella = os.path.join(percorso_locale, nome_pulito)
            scarica_tutto(service, folder['id'], nuova_cartella)
            
        page_token = results.get('nextPageToken', None)
        if not page_token:
            break

def main():
    print("🐾 Backup Definitivo - Avvio...")
    if not os.path.exists(DISCO_ESTERNO):
        os.makedirs(DISCO_ESTERNO)
        
    service = get_drive_service()
    print("✅ Connesso a Google Drive!")
    
    print("🔢 Fase 0: Conteggio elementi su Drive...")
    conta_elementi_drive(service, 'root')
    print(f" Trovati su Drive: {STATS['cartelle_drive']} cartelle, {STATS['foto_drive']} foto")
    
    print("🔨 Fase 1: Creazione struttura (nomi puliti)...")
    crea_struttura(service, 'root', DISCO_ESTERNO)
    print("✅ Struttura completata!")
    
    print("📥 Fase 2: Download foto...")
    scarica_tutto(service, 'root', DISCO_ESTERNO)
    
    print("\n" + "="*50)
    print("📊 VERIFICA FINALE:")
    print(f"   Drive:      {STATS['cartelle_drive']} cartelle | {STATS['foto_drive']} foto")
    print(f"   Salvate:    {STATS['cartelle_salvate']} cartelle | {STATS['foto_salvate']} foto")
    
    if STATS['cartelle_drive'] == STATS['cartelle_salvate'] and STATS['foto_drive'] == STATS['foto_salvate']:
        print("✅ BACKUP PERFETTO! Tutto corrisponde!")
    else:
        mancanti_c = STATS['cartelle_drive'] - STATS['cartelle_salvate']
        mancanti_f = STATS['foto_drive'] - STATS['foto_salvate']
        print(f"⚠️ ATTENZIONE! Mancano: {mancanti_c} cartelle e {mancanti_f} foto!")
    print("="*50)
    
    print("\n TEST FINITO!")

if __name__ == '__main__':
    main()