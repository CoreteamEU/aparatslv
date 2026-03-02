import os
import json

PHOTOS_DIR = "photos"
OUTPUT_JSON = "photos.json"

# Supported image extensions
VALID_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

def main():
    if not os.path.exists(PHOTOS_DIR):
        print(f"Directory '{PHOTOS_DIR}' does not exist. Creating it so you can add albums...")
        os.makedirs(PHOTOS_DIR)
        
    albums = []
    
    # Recursively walk over the photos folder
    for root, dirs, files in os.walk(PHOTOS_DIR):
        # Find all images in this folder
        image_files = [f for f in files if os.path.splitext(f.lower())[1] in VALID_EXTENSIONS]
        image_files.sort()
        
        if image_files:
            # Create a unique ID based on the relative path
            rel_path = os.path.relpath(root, PHOTOS_DIR)
            album_id = rel_path.replace(os.sep, '/')
            
            # Use the folder name as the title, cleaning up leading underscores
            folder_name = os.path.basename(root)
            album_title = folder_name.lstrip('_').replace('_', ' ').title()
            
            # Ensure web-friendly paths with forward slashes
            cover_image = os.path.join(root, image_files[0]).replace(os.sep, '/')
            image_paths = [os.path.join(root, img).replace(os.sep, '/') for img in image_files]

            album = {
                "id": album_id,
                "title": album_title,
                "cover": cover_image,
                "images": image_paths
            }
            
            albums.append(album)
            
    # Sort albums alphabetically by their path ID to keep subfolders grouped
    albums.sort(key=lambda x: x['id'])
                
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(albums, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully generated {OUTPUT_JSON} with {len(albums)} albums.")

if __name__ == "__main__":
    main()
