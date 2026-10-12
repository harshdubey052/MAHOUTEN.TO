import os
import uuid
from pathlib import Path
from django.conf import settings

def is_cloudinary_active():
    """Returns True if Cloudinary credentials are fully loaded and enabled."""
    return getattr(settings, 'CLOUDINARY_ENABLED', False)


def upload_image(file_obj, folder='mahouten/images', public_id=None):
    """
    Uploads an image file to Cloudinary if available, otherwise saves to local MEDIA_ROOT.
    Returns a dict with 'url' and 'public_id'.
    """
    if is_cloudinary_active():
        try:
            import cloudinary.uploader
            upload_args = {
                'folder': folder,
                'resource_type': 'image',
                'overwrite': True,
            }
            if public_id:
                upload_args['public_id'] = public_id

            res = cloudinary.uploader.upload(file_obj, **upload_args)
            return {
                'url': res.get('secure_url', res.get('url')),
                'public_id': res.get('public_id'),
                'width': res.get('width'),
                'height': res.get('height'),
                'format': res.get('format'),
                'storage': 'cloudinary'
            }
        except Exception as e:
            print(f"[MediaService Warning] Cloudinary image upload failed ({e}); falling back to local disk.")

    # Local fallback
    subfolder = folder.replace('mahouten/', '')
    dest_dir = Path(settings.MEDIA_ROOT) / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)

    original_name = getattr(file_obj, 'name', 'image.jpg')
    ext = Path(original_name).suffix.lower() or '.jpg'
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = dest_dir / filename

    if hasattr(file_obj, 'chunks'):
        with open(dest_path, 'wb+') as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)
    elif hasattr(file_obj, 'read'):
        file_obj.seek(0)
        with open(dest_path, 'wb+') as dest:
            dest.write(file_obj.read())
    elif isinstance(file_obj, (str, Path)) and os.path.exists(file_obj):
        import shutil
        shutil.copy(file_obj, dest_path)

    relative_url = f"/media/{subfolder}/{filename}"
    return {
        'url': relative_url,
        'public_id': filename,
        'local_path': str(dest_path),
        'storage': 'local'
    }


def upload_video(file_obj, folder='mahouten/videos', public_id=None):
    """
    Uploads a video file (MP4, MKV, WebM) to Cloudinary if available,
    otherwise saves to local MEDIA_ROOT.
    """
    if is_cloudinary_active():
        try:
            import cloudinary.uploader
            upload_args = {
                'folder': folder,
                'resource_type': 'video',
                'overwrite': True,
            }
            if public_id:
                upload_args['public_id'] = public_id

            res = cloudinary.uploader.upload(file_obj, **upload_args)
            return {
                'url': res.get('secure_url', res.get('url')),
                'public_id': res.get('public_id'),
                'duration': res.get('duration'),
                'format': res.get('format'),
                'storage': 'cloudinary'
            }
        except Exception as e:
            print(f"[MediaService Warning] Cloudinary video upload failed ({e}); falling back to local disk.")

    # Local fallback
    subfolder = folder.replace('mahouten/', '')
    dest_dir = Path(settings.MEDIA_ROOT) / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)

    original_name = getattr(file_obj, 'name', 'video.mp4')
    ext = Path(original_name).suffix.lower() or '.mp4'
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = dest_dir / filename

    if hasattr(file_obj, 'chunks'):
        with open(dest_path, 'wb+') as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)
    elif hasattr(file_obj, 'read'):
        file_obj.seek(0)
        with open(dest_path, 'wb+') as dest:
            dest.write(file_obj.read())
    elif isinstance(file_obj, (str, Path)) and os.path.exists(file_obj):
        import shutil
        shutil.copy(file_obj, dest_path)

    relative_url = f"/media/{subfolder}/{filename}"
    return {
        'url': relative_url,
        'public_id': filename,
        'local_path': str(dest_path),
        'storage': 'local'
    }


def upload_raw(file_obj, folder='mahouten/subtitles', public_id=None):
    """
    Uploads raw text/binary files (such as .vtt / .srt subtitles).
    """
    if is_cloudinary_active():
        try:
            import cloudinary.uploader
            upload_args = {
                'folder': folder,
                'resource_type': 'raw',
                'overwrite': True,
            }
            if public_id:
                upload_args['public_id'] = public_id

            res = cloudinary.uploader.upload(file_obj, **upload_args)
            return {
                'url': res.get('secure_url', res.get('url')),
                'public_id': res.get('public_id'),
                'storage': 'cloudinary'
            }
        except Exception as e:
            print(f"[MediaService Warning] Cloudinary raw upload failed ({e}); falling back to local disk.")

    # Local fallback
    subfolder = folder.replace('mahouten/', '')
    dest_dir = Path(settings.MEDIA_ROOT) / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)

    original_name = getattr(file_obj, 'name', 'subtitle.vtt')
    ext = Path(original_name).suffix.lower() or '.vtt'
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = dest_dir / filename

    if hasattr(file_obj, 'chunks'):
        with open(dest_path, 'wb+') as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)
    elif hasattr(file_obj, 'read'):
        file_obj.seek(0)
        with open(dest_path, 'wb+') as dest:
            dest.write(file_obj.read())
    elif isinstance(file_obj, (str, Path)) and os.path.exists(file_obj):
        import shutil
        shutil.copy(file_obj, dest_path)

    relative_url = f"/media/{subfolder}/{filename}"
    return {
        'url': relative_url,
        'public_id': filename,
        'local_path': str(dest_path),
        'storage': 'local'
    }


def delete_media(public_id, resource_type='image'):
    """
    Deletes a media asset from Cloudinary by public_id if Cloudinary is active.
    """
    if not is_cloudinary_active() or not public_id:
        return False
    try:
        import cloudinary.uploader
        res = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return res.get('result') == 'ok'
    except Exception as e:
        print(f"[MediaService Warning] Failed to delete Cloudinary asset {public_id}: {e}")
        return False
