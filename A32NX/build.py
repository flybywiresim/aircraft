import os
import json
import sys

if sys.version_info[0] < 3 or sys.version_info[1] < 6:
    raise Exception("Must be using Python 3.6 or later")

cwd = os.getcwd()
json_content = {
    "content": []
}

for root, _, files in os.walk(cwd):
    for filename in files:
        filepath = os.path.join(root, filename)

        if not filepath.endswith(".json") and not filepath.endswith(".py"):
            rel_dir = os.path.relpath(root)
            rel_file = str(os.path.join(rel_dir, filename))
            if rel_file.split('\\')[0] == '.git':
                continue
            if rel_file[0] == '.':
                rel_file = rel_file[2:]

            print(" -- Processing " + rel_file)
            entry = {}
            entry["path"] = rel_file.replace('\\', '/')
            entry["size"] = os.path.getsize(filepath)
            entry["date"] = "132402817714110148"
            json_content["content"].append(entry)

with open("layout.json", "w") as outfile:
    json.dump(json_content, outfile, indent=4)
