import os
import subprocess
import shutil
from pathlib import Path
from celery import shared_task
from django.conf import settings
from apps.catalog.models import Episode

@shared_task
def process_video_to_hls(episode_id, input_video_path):
    """
    Converts an uploaded MP4/MKV video into multi-quality HLS streams using FFmpeg:
    - 360p (640x360)
    - 720p (1280x720)
    - 1080p (1920x1080)
    - Master playlist master.m3u8
    """
    episode = Episode.objects(id=episode_id).first()
    if not episode:
        return {'status': 'error', 'message': f'Episode {episode_id} not found'}

    episode.processing_status = 'processing'
    episode.save()

    hls_dir = Path(settings.MEDIA_ROOT) / 'hls' / str(episode_id)
    hls_dir.mkdir(parents=True, exist_ok=True)

    input_path = Path(input_video_path)
    if not input_path.exists():
        episode.processing_status = 'failed'
        episode.save()
        return {'status': 'error', 'message': 'Input file does not exist'}

    master_playlist_path = hls_dir / 'master.m3u8'

    # Check if ffmpeg is in PATH
    ffmpeg_cmd = shutil.which('ffmpeg') or 'ffmpeg'

    # Command generating multi-variant HLS
    # 360p, 720p, 1080p variant streams with H.264 + AAC
    cmd = [
        ffmpeg_cmd,
        '-y',
        '-i', str(input_path),
        # 360p
        '-vf', 'scale=w=640:h=360:force_original_aspect_ratio=decrease',
        '-c:a', 'aac', '-ar', '48000', '-c:v', 'h264',
        '-profile:v', 'main', '-crf', '20', '-sc_threshold', '0',
        '-g', '48', '-keyint_min', '48', '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-b:v', '800k', '-maxrate', '856k', '-bufsize', '1200k',
        '-b:a', '96k',
        '-hls_segment_filename', str(hls_dir / '360p_%03d.ts'),
        str(hls_dir / '360p.m3u8'),
        # 720p
        '-vf', 'scale=w=1280:h=720:force_original_aspect_ratio=decrease',
        '-c:a', 'aac', '-ar', '48000', '-c:v', 'h264',
        '-profile:v', 'main', '-crf', '20', '-sc_threshold', '0',
        '-g', '48', '-keyint_min', '48', '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-b:v', '2800k', '-maxrate', '2996k', '-bufsize', '4200k',
        '-b:a', '128k',
        '-hls_segment_filename', str(hls_dir / '720p_%03d.ts'),
        str(hls_dir / '720p.m3u8'),
        # 1080p
        '-vf', 'scale=w=1920:h=1080:force_original_aspect_ratio=decrease',
        '-c:a', 'aac', '-ar', '48000', '-c:v', 'h264',
        '-profile:v', 'main', '-crf', '20', '-sc_threshold', '0',
        '-g', '48', '-keyint_min', '48', '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-b:v', '5000k', '-maxrate', '5350k', '-bufsize', '7500k',
        '-b:a', '192k',
        '-hls_segment_filename', str(hls_dir / '1080p_%03d.ts'),
        str(hls_dir / '1080p.m3u8')
    ]

    try:
        # Run conversion
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Create Master Playlist
        master_content = (
            "#EXTM3U\n"
            "#EXT-X-VERSION:3\n"
            "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n"
            "360p.m3u8\n"
            "#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n"
            "720p.m3u8\n"
            "#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\n"
            "1080p.m3u8\n"
        )
        with open(master_playlist_path, 'w') as f:
            f.write(master_content)

        relative_url = f"/media/hls/{episode_id}/master.m3u8"
        episode.hls_url = relative_url
        episode.processing_status = 'ready'
        episode.save()

        return {'status': 'success', 'hls_url': relative_url}

    except Exception as exc:
        print(f"FFmpeg processing error for episode {episode_id}: {exc}")
        episode.processing_status = 'failed'
        episode.save()
        return {'status': 'failed', 'error': str(exc)}

