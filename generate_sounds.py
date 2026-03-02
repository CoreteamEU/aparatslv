import os
import json
import subprocess

MP3_DIR = "mp3"
OUTPUT_JSON = "sounds.json"

def get_audio_info(filepath):
    try:
        # afinfo is a macOS built-in command to get audio file info
        result = subprocess.run(['afinfo', filepath], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        
        duration = 0
        for line in lines:
            if "estimated duration:" in line:
                # e.g. "estimated duration: 123.456 sec"
                parts = line.split(':')
                if len(parts) > 1:
                    duration_str = parts[1].strip().split(' ')[0]
                    duration = float(duration_str)
                    break
        
        minutes = int(duration // 60)
        seconds = int(duration % 60)
        return f"{minutes}:{seconds:02d}"
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return "0:00"

def main():
    if not os.path.exists(MP3_DIR):
        print(f"Directory '{MP3_DIR}' does not exist. Creating it so you can add files...")
        os.makedirs(MP3_DIR)
        
    playlists = []
    
    # Iterate over subdirectories in the mp3 folder
    for foldername in sorted(os.listdir(MP3_DIR)):
        folder_path = os.path.join(MP3_DIR, foldername)
        if os.path.isdir(folder_path):
            playlist = {
                "title": foldername.replace('_', ' ').title(),
                "description": f"Collection from {foldername}",
                "tracks": []
            }
            
            # Find all mp3s in this folder
            mp3_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.mp3')]
            mp3_files.sort()
            
            for mp3 in mp3_files:
                mp3_path = os.path.join(folder_path, mp3)
                length = get_audio_info(mp3_path)
                
                track_title = os.path.splitext(mp3)[0].replace('_', ' ').replace('-', ' ').title()
                
                playlist["tracks"].append({
                    "title": track_title,
                    "file": mp3_path,
                    "length": length
                })
                
            if playlist["tracks"]:
                playlists.append(playlist)
                
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(playlists, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully generated {OUTPUT_JSON} with {len(playlists)} playlists.")

if __name__ == "__main__":
    main()
