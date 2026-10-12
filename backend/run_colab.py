"""
Run Mahouten.to Django Backend on Google Colab with ngrok Tunnel.
Usage inside Colab:
    python run_colab.py --authtoken YOUR_NGROK_TOKEN
"""
import os
import sys
import argparse
import subprocess

def main():
    parser = argparse.ArgumentParser(description="Run Mahouten Backend with ngrok")
    parser.add_argument("--authtoken", required=False, default=os.getenv("NGROK_AUTHTOKEN", ""), help="ngrok authtoken")
    parser.add_argument("--port", type=int, default=8000, help="Port to tunnel")
    args = parser.parse_args()

    token = args.authtoken.strip()
    if not token:
        token = input("Enter your ngrok authtoken (from https://dashboard.ngrok.com/): ").strip()

    try:
        from pyngrok import ngrok, conf
    except ImportError:
        print("[*] Installing pyngrok...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyngrok"])
        from pyngrok import ngrok, conf

    conf.get_default().auth_token = token
    ngrok.kill()
    tunnel = ngrok.connect(args.port)
    public_url = tunnel.public_url

    print("=" * 65)
    print("🚀 MAHOUTEN.TO BACKEND LIVE VIA NGROK:")
    print(f"   URL: {public_url}")
    print("=" * 65)
    print("👉 Set on your local PC frontend/.env:")
    print(f"   VITE_API_URL={public_url}")
    print("=" * 65)

    os.environ["ALLOWED_HOSTS"] = "*"
    os.environ.setdefault("DEBUG", "True")

    # Run Django
    cmd = [sys.executable, "manage.py", "runserver", f"0.0.0.0:{args.port}"]
    subprocess.call(cmd)

if __name__ == "__main__":
    main()
