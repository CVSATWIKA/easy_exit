"""
Upload local student photos to Cloudinary.
Run from your project root:  python upload_to_cloudinary.py
Requires: pip install cloudinary
"""

import cloudinary
import cloudinary.uploader
import os

# ── Cloudinary credentials ────────────────────────────────────
cloudinary.config(
    cloud_name = "dgykdgjg3",
    api_key    = "941263613967782",
    api_secret = "fAc51zy60btHTtLglq6G32ijIQk",
)

# ── Folder containing your photos ────────────────────────────
PHOTOS_DIR = os.path.join("media", "student_photos")

def upload_all():
    if not os.path.isdir(PHOTOS_DIR):
        print(f"❌ Folder not found: {PHOTOS_DIR}")
        print("   Make sure you run this script from your Django project root.")
        return

    files = [f for f in os.listdir(PHOTOS_DIR) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]

    if not files:
        print("❌ No image files found in", PHOTOS_DIR)
        return

    print(f"📸 Found {len(files)} photos. Starting upload...\n")
    success, failed = 0, []

    for filename in files:
        filepath = os.path.join(PHOTOS_DIR, filename)
        # public_id includes extension to match exactly what Django stored in DB
        # e.g.  student_photos/1731.jpeg
        public_id = f"student_photos/{filename}"

        try:
            result = cloudinary.uploader.upload(
                filepath,
                public_id       = public_id,
                overwrite       = True,
                resource_type   = "image",
                use_filename    = False,
                unique_filename = False,
            )
            print(f"  ✅ {filename}  →  {result['secure_url']}")
            success += 1
        except Exception as e:
            print(f"  ❌ {filename}  →  {e}")
            failed.append(filename)

    print(f"\n── Done ──────────────────────────────────")
    print(f"  Uploaded : {success}")
    print(f"  Failed   : {len(failed)}")
    if failed:
        print("  Failed files:", failed)

if __name__ == "__main__":
    upload_all()