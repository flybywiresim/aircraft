import os
import json

project_directories = ["effects", "html_ui", "SimObjects", "ModelBehaviorDefs"]

content_entries = list()
total_package_size = 0

for project_directory in project_directories:
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

layout_file = open("layout.json", "w")
json.dump(layout_entries, layout_file, indent=4)

manifest_file = open("manifest.json", "r")

manifest_entries = json.load(manifest_file)
manifest_entries["total_package_size"] = str(total_package_size).zfill(20)

manifest_file = open("manifest.json", "w")
json.dump(manifest_entries, manifest_file, indent=4)
