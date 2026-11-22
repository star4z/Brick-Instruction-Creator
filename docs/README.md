# Design Documentation

All architecture specifications and feature design proposals for **Brick Instruction Creator** are stored in this `docs/` directory as living documents and updated as features evolve.

## Documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Core system architecture, invariants, data model, algorithms, and deployment constraints.
- [`SUBDIVISION_DESIGN.md`](./SUBDIVISION_DESIGN.md) — Large & elongated model subdivision suggestions on import (2D PCA halves, modular floors, structural modules, numbered bags, spatial sectors, and 3D exploded import assistant).
- [`MINIFIG_POSE_DESIGN.md`](./MINIFIG_POSE_DESIGN.md) — Standing upright minifigure normalization, default arm positioning (with purse/satchel/clearance exceptions), and pre-placement posing.

## Conventions

- Every new feature design proposal or architectural spec should be committed under `docs/` (e.g., `docs/<FEATURE>_DESIGN.md`) and listed in this index.
- Keep existing design documents up to date when requirements, algorithms, or implementation phases change.
