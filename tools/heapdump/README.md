# Documentation

This is a tool that allows us to either count the number of javascript objects or allows you to

# Usage

1. Enable dumping by including `A32NX_ObjectDumper.js` anywhere into your HTML:

```
<script type="text/javascript" src="/JS/fbw-a32nx/A32NX_ObjectDumper.js"></script>
```

Tip: Add it to `VCockpit.html` to be included in all instruments.

## Counting

Launch MSFS and inspect the JS logs of the instruments by a tool of your choice.

## Dumping

1. Start local webserver

```
python src\tools\heapdump\app.py
```

2. Launch MSFS and load Plane.

3. Navigate to http://127.0.0.1:5000, wait 4 seconds, and you should receive an unformatted JSON
with the entire object hierarchy.
