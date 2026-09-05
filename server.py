#!/usr/bin/env python3
"""
Central Dispatch Server — Gangman's Logbook (DHR Edition)
Provides static asset serving + Centralized REST API for reports:
  - GET    /api/reports  -> Returns all centralized reports
  - POST   /api/reports  -> Receives & saves a new report from track patrol
  - DELETE /api/reports  -> Clears centralized reports
"""

import http.server
import socketserver
import json
import os
import sys

PORT = 3000
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
REPORTS_FILE = os.path.join(DATA_DIR, 'reports.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(REPORTS_FILE):
    with open(REPORTS_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

class DHRRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS & Cache control headers for smooth local & mobile tunnel testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/reports'):
            self.handle_get_reports()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/reports'):
            self.handle_save_report()
        else:
            self.send_error(404, "Not Found")

    def do_DELETE(self):
        if self.path.startswith('/api/reports'):
            self.handle_clear_reports()
        else:
            self.send_error(404, "Not Found")

    def handle_get_reports(self):
        try:
            with open(REPORTS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            payload = json.dumps(data).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as e:
            self.send_error(500, f"Failed to read reports: {str(e)}")

    def handle_save_report(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            report = json.loads(body.decode('utf-8'))

            # Read existing
            with open(REPORTS_FILE, 'r', encoding='utf-8') as f:
                reports = json.load(f)

            # Update if existing ID, otherwise append
            existing_idx = next((i for i, r in enumerate(reports) if r.get('id') == report.get('id')), None)
            if existing_idx is not None:
                reports[existing_idx] = report
            else:
                reports.insert(0, report) # Newest first

            with open(REPORTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(reports, f, indent=2)

            response = json.dumps({'success': True, 'id': report.get('id'), 'total': len(reports)}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response)))
            self.end_headers()
            self.wfile.write(response)
            print(f"[Central Server] Saved report: {report.get('id')} ({report.get('hazardType')}, {report.get('section')})")
        except Exception as e:
            print(f"[Central Server] Error saving report: {e}")
            self.send_error(500, f"Failed to save report: {str(e)}")

    def handle_clear_reports(self):
        try:
            with open(REPORTS_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f)
            response = json.dumps({'success': True, 'message': 'All central reports cleared'}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response)))
            self.end_headers()
            self.wfile.write(response)
            print("[Central Server] Cleared all reports in reports.json")
        except Exception as e:
            self.send_error(500, f"Failed to clear reports: {str(e)}")

if __name__ == '__main__':
    # Allow port re-use immediately
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), DHRRequestHandler) as httpd:
        print(f"[Central Server] Running on http://localhost:{PORT}")
        print(f"[Central Server] Serving static files & Central Dispatch API /api/reports")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[Central Server] Stopping...")
            httpd.shutdown()
