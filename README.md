# Automation Hub

Automation Hub centralizes logging and automation services for the Brain 2.0 initiative. It currently exposes a Node.js/Express service for capturing structured activity logs and storing them in `data/logs.json`.

## Documentation
- [Architecting Brain 2.0 Blueprint](docs/brain-2-architecture.md): Senior-level architectural roadmap covering memory, orchestration, intelligence, and operational integrity layers.

## Development
Install dependencies and run the API locally:

```bash
npm install
npm start
```

The service starts on port `3000` by default. Use `/health` to verify availability and `/log` to append entries.
