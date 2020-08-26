import os
import json
import sys


def check_prerequisites():
    if sys.version_info[0] < 3 or sys.version_info[1] < 6:
        raise Exception("Must be using Python 3.6 or later")


def build_layout(project_dir):
    layout_entries = []
    for root, _, files in os.walk(project_dir):
        for filename in files:
            filepath = os.path.join(root, filename)

            if not filepath.endswith(".json") and not filepath.endswith(".py"):
                rel_dir = os.path.relpath(root)
                rel_file = str(os.path.join(rel_dir, filename))
                if rel_file[0] == '.':
                    rel_file = rel_file[2:]

                print(" -- Processing " + rel_file)
                entry = {}
                entry["path"] = rel_file.replace('\\', '/')
                entry["size"] = os.path.getsize(filepath)
                entry["date"] = "132402817714110148"
                layout_entries.append(entry)

    layout_entries.sort(key=lambda e: e["path"])

    return layout_entries


if __name__ == "__main__":
    check_prerequisites()

    cwd = os.getcwd()

    layout_content = build_layout(cwd)

    layout_json = {
        "content": layout_content
    }

    with open("layout.json", "w") as outfile:
        json.dump(layout_json, outfile, indent=4)
