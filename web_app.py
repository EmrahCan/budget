#!/usr/bin/env python3
"""
SRT Subtitle Translator v1.3 - Web Edition
Flask-based web interface for subtitle translation
"""

from flask import Flask, render_template, request, jsonify, send_file, flash, redirect, url_for
from werkzeug.utils import secure_filename
import os
import threading
import time
import uuid
from datetime import datetime
import json

# Import our existing modules
from srt_translator import SRTTranslator
from subtitle_downloader import SubtitleDownloader

app = Flask(__name__)
app.secret_key = 'srt_translator_v1.3_secret_key'

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'srt'}

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Global instances
translator = SRTTranslator()
downloader = SubtitleDownloader()

# Active jobs tracking
active_jobs = {}

class TranslationJob:
    def __init__(self, job_id, job_type, **kwargs):
        self.job_id = job_id
        self.job_type = job_type  # 'search' or 'file'
        self.status = 'starting'
        self.progress = 0
        self.message = 'Initializing...'
        self.result_file = None
        self.error = None
        self.created_at = datetime.now()
        self.kwargs = kwargs

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/search_subtitles', methods=['POST'])
def api_search_subtitles():
    """API endpoint for movie subtitle search"""
    try:
        data = request.get_json()
        movie_name = data.get('movie_name', '').strip()
        source_lang = data.get('source_lang', 'en')
        target_lang = data.get('target_lang', 'tr')
        speed = data.get('speed', 'normal')
        
        if not movie_name:
            return jsonify({'error': 'Movie name is required'}), 400
        
        # Create job
        job_id = str(uuid.uuid4())
        job = TranslationJob(
            job_id=job_id,
            job_type='search',
            movie_name=movie_name,
            source_lang=source_lang,
            target_lang=target_lang,
            speed=speed
        )
        active_jobs[job_id] = job
        
        # Start translation in background
        thread = threading.Thread(target=process_movie_search, args=(job,))
        thread.daemon = True
        thread.start()
        
        return jsonify({'job_id': job_id, 'status': 'started'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/translate_file', methods=['POST'])
def api_translate_file():
    """API endpoint for file translation"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only SRT files are allowed'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # Get form data
        source_lang = request.form.get('source_lang', 'en')
        target_lang = request.form.get('target_lang', 'tr')
        speed = request.form.get('speed', 'normal')
        
        # Create job
        job_id = str(uuid.uuid4())
        job = TranslationJob(
            job_id=job_id,
            job_type='file',
            file_path=file_path,
            filename=filename,
            source_lang=source_lang,
            target_lang=target_lang,
            speed=speed
        )
        active_jobs[job_id] = job
        
        # Start translation in background
        thread = threading.Thread(target=process_file_translation, args=(job,))
        thread.daemon = True
        thread.start()
        
        return jsonify({'job_id': job_id, 'status': 'started'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/job_status/<job_id>')
def api_job_status(job_id):
    """Get job status"""
    if job_id not in active_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = active_jobs[job_id]
    
    response = {
        'job_id': job_id,
        'status': job.status,
        'progress': job.progress,
        'message': job.message,
        'job_type': job.job_type
    }
    
    if job.status == 'completed' and job.result_file:
        response['download_url'] = f'/api/download/{job_id}'
        response['filename'] = os.path.basename(job.result_file)
    
    if job.error:
        response['error'] = job.error
    
    return jsonify(response)

@app.route('/api/download/<job_id>')
def api_download(job_id):
    """Download translated file"""
    if job_id not in active_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = active_jobs[job_id]
    
    if job.status != 'completed' or not job.result_file:
        return jsonify({'error': 'File not ready'}), 400
    
    if not os.path.exists(job.result_file):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(job.result_file, as_attachment=True)

@app.route('/api/active_jobs')
def api_active_jobs():
    """Get all active jobs"""
    jobs_info = []
    for job_id, job in active_jobs.items():
        jobs_info.append({
            'job_id': job_id,
            'job_type': job.job_type,
            'status': job.status,
            'progress': job.progress,
            'message': job.message,
            'created_at': job.created_at.isoformat()
        })
    
    return jsonify({'jobs': jobs_info})

def process_movie_search(job):
    """Process movie subtitle search and translation"""
    try:
        job.status = 'searching'
        job.message = 'Searching for subtitles...'
        job.progress = 10
        
        # Search for subtitles
        results = downloader.search_subtitles(job.kwargs['movie_name'], job.kwargs['source_lang'])
        
        if not results:
            job.status = 'error'
            job.error = 'No subtitles found for this movie'
            return
        
        job.progress = 30
        job.message = f'Found {len(results)} subtitles. Selecting best match...'
        
        # Select best result (first one for now)
        selected_subtitle = results[0]
        
        job.progress = 40
        job.message = 'Downloading subtitle...'
        
        # Download subtitle
        temp_file = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{job.job_id}.srt")
        
        if downloader.download_subtitle(selected_subtitle['download_url'], temp_file):
            job.progress = 60
            job.message = 'Translating subtitle...'
            
            # Translate
            output_file = os.path.join(app.config['OUTPUT_FOLDER'], 
                                     f"{job.kwargs['movie_name'].replace(' ', '_')}_translated_{job.job_id}.srt")
            
            success = translate_srt_file(temp_file, output_file, 
                                       job.kwargs['source_lang'], 
                                       job.kwargs['target_lang'],
                                       job.kwargs['speed'], job)
            
            # Clean up temp file
            if os.path.exists(temp_file):
                os.remove(temp_file)
            
            if success:
                job.status = 'completed'
                job.progress = 100
                job.message = 'Translation completed successfully!'
                job.result_file = output_file
            else:
                job.status = 'error'
                job.error = 'Translation failed'
        else:
            job.status = 'error'
            job.error = 'Failed to download subtitle'
            
    except Exception as e:
        job.status = 'error'
        job.error = str(e)

def process_file_translation(job):
    """Process file translation"""
    try:
        job.status = 'translating'
        job.message = 'Starting translation...'
        job.progress = 10
        
        # Generate output filename
        base_name = os.path.splitext(job.kwargs['filename'])[0]
        output_file = os.path.join(app.config['OUTPUT_FOLDER'], 
                                 f"{base_name}_translated_{job.job_id}.srt")
        
        success = translate_srt_file(job.kwargs['file_path'], output_file,
                                   job.kwargs['source_lang'],
                                   job.kwargs['target_lang'],
                                   job.kwargs['speed'], job)
        
        if success:
            job.status = 'completed'
            job.progress = 100
            job.message = 'Translation completed successfully!'
            job.result_file = output_file
        else:
            job.status = 'error'
            job.error = 'Translation failed'
            
    except Exception as e:
        job.status = 'error'
        job.error = str(e)

def translate_srt_file(input_file, output_file, source_lang, target_lang, speed, job):
    """Translate SRT file with progress updates"""
    try:
        # Parse SRT file
        subtitles = translator.parse_srt(input_file)
        total_subtitles = len(subtitles)
        
        if total_subtitles == 0:
            job.error = "No subtitles found in file"
            return False
        
        job.message = f'Translating {total_subtitles} subtitle lines...'
        
        # Speed settings
        speed_settings = {
            "slow": {"batch_size": 3, "delay": 0.2},
            "normal": {"batch_size": 5, "delay": 0.1}, 
            "fast": {"batch_size": 8, "delay": 0.05},
            "turbo": {"batch_size": 12, "delay": 0.02}
        }
        
        settings = speed_settings.get(speed, speed_settings["normal"])
        batch_size = settings["batch_size"]
        delay = settings["delay"]
        
        # Update translator language
        from deep_translator import GoogleTranslator
        translator.translator = GoogleTranslator(source=source_lang, target=target_lang)
        
        translated_subtitles = []
        
        # Batch translation
        for batch_start in range(0, total_subtitles, batch_size):
            batch_end = min(batch_start + batch_size, total_subtitles)
            batch_subtitles = subtitles[batch_start:batch_end]
            
            # Update progress (60-90% range for translation)
            progress = 60 + (batch_end / total_subtitles) * 30
            job.progress = int(progress)
            job.message = f'Translating batch {batch_start+1}-{batch_end}/{total_subtitles}'
            
            # Batch texts
            batch_texts = [sub['text'] for sub in batch_subtitles]
            
            # Translate batch
            translated_texts = translator.translate_batch(batch_texts, source_lang, target_lang)
            
            # Add results
            for subtitle, translated_text in zip(batch_subtitles, translated_texts):
                translated_subtitles.append({
                    'id': subtitle['id'],
                    'timestamp': subtitle['timestamp'],
                    'text': translated_text
                })
            
            time.sleep(delay)
        
        # Write output file
        job.progress = 95
        job.message = 'Saving translated file...'
        
        translator.write_srt(translated_subtitles, output_file)
        
        return True
        
    except Exception as e:
        job.error = str(e)
        return False

if __name__ == '__main__':
    print("🌐 SRT Subtitle Translator v1.3 - Web Edition")
    print("🚀 Starting web server...")
    print("📱 Open your browser and go to: http://localhost:5001")
    print("⏹️  Press Ctrl+C to stop the server")
    
    app.run(debug=True, host='0.0.0.0', port=5001)