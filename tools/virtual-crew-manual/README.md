# A380X virtual crew user manual

Builds the PDF of the virtual crew user manual for the end users. The manual itself is written once, in Markdown, in
[`fbw-a380x/docs/virtual-crew/README.md`](../../fbw-a380x/docs/virtual-crew/README.md), with its screenshots in
`fbw-a380x/docs/virtual-crew/images`.

## Building the PDF

The script needs Python 3 and a Chromium based browser (Google Chrome, Microsoft Edge or Chromium), which prints the
page to PDF in headless mode.

```sh
python3 -m venv .venv
.venv/bin/pip install -r tools/virtual-crew-manual/requirements.txt
.venv/bin/python tools/virtual-crew-manual/build_pdf.py
```

On Windows, use `.venv\Scripts\python`. The PDF is written to
`build/virtual-crew-manual/A380X-Virtual-Crew-User-Manual.pdf`. Use `--browser <path>` if the browser is not found
and `--output <file>` for another destination.

The PDF adds a cover, a table of contents, page numbers and captions (the descriptions of the images) to the
Markdown. The style sheet is `manual.css`, in the colours of the flyPad.

## Updating the manual

- Update the Markdown whenever a user visible behaviour of the virtual crew changes (flyPad pages, buttons, phases,
  flows, checklists, callouts), then build the PDF again.
- The screenshots show the flyPad pages `Crew` and `Settings > Virtual Crew`. Keep the file names when replacing them
  so that the Markdown does not need to change.
