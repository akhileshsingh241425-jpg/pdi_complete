"""
Production Server for PDI Complete System
Uses Waitress WSGI server for production deployment
"""

import os
from waitress import serve
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Tunables (env override-able)
    threads             = int(os.environ.get('WAITRESS_THREADS', '32'))
    connection_limit    = int(os.environ.get('WAITRESS_CONN_LIMIT', '1000'))
    channel_timeout     = int(os.environ.get('WAITRESS_CHANNEL_TIMEOUT', '120'))
    cleanup_interval    = int(os.environ.get('WAITRESS_CLEANUP_INTERVAL', '30'))
    backlog             = int(os.environ.get('WAITRESS_BACKLOG', '256'))

    print("=" * 60)
    print("🚀 PDI Complete System - Production Server")
    print("=" * 60)
    print("Server starting on http://0.0.0.0:5003")
    print(f"  threads          = {threads}")
    print(f"  connection_limit = {connection_limit}")
    print(f"  channel_timeout  = {channel_timeout}s")
    print(f"  cleanup_interval = {cleanup_interval}s")
    print(f"  backlog          = {backlog}")
    print("Press CTRL+C to stop the server")
    print("=" * 60)

    # Waitress production server with high concurrency
    serve(
        app,
        host='0.0.0.0',
        port=5003,
        threads=threads,
        connection_limit=connection_limit,
        channel_timeout=channel_timeout,
        cleanup_interval=cleanup_interval,
        backlog=backlog,
        ident='PDI-Complete'
    )
