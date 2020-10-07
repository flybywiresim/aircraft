import os
import sys
import json

root_dir = "."
root_ctrl_excl = ["build.py", "layout.json", "manifest.json"]
project_directories = [root_dir, "effects", "html_ui", "SimObjects", "ModelBehaviorDefs"]

manifest_entries = None
content_entries = list()
total_package_size = 0

for project_directory in project_directories:
    if (project_directory is root_dir):
        for file_name in os.listdir(project_directory):
            if not os.path.isdir(file_name) and file_name not in root_ctrl_excl:
                file_size = os.path.getsize(file_name)
                file_date = 116444736000000000 + int(os.path.getmtime(file_name) * 10000000.0)

                content_entry = {"path": file_name, "size": file_size, "date": file_date}
                content_entries.append(content_entry)

                print("Added file: " + file_name)
    else:
        for directory_path, directory_names, file_names in os.walk(project_directory):
            for file_name in file_names:
                file_path = os.path.join(directory_path, file_name)
                file_size = os.path.getsize(file_path)
                file_date = 116444736000000000 + int(os.path.getmtime(file_path) * 10000000.0)

                content_entry = {"path": file_path.replace(os.sep, "/"), "size": file_size, "date": file_date}
                content_entries.append(content_entry)

                total_package_size += file_size

                print("Added file: " + file_path)

layout_entries = {"content": content_entries}

if content_entries:
    with open("layout.json", "w") as layout_file:
        json.dump(layout_entries, layout_file, indent=4)
else:
    print("Error: layout.json not updated", file=sys.stderr)

with open("manifest.json", "r") as manifest_file:
    manifest_entries = json.load(manifest_file)
    manifest_entries["total_package_size"] = str(total_package_size).zfill(20)

if manifest_entries:
    with open("manifest.json", "w") as manifest_file:
        json.dump(manifest_entries, manifest_file, indent=4)
else:
    print("Error: manifest.json not updated", file=sys.stderr)
