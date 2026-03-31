# Protoclone

A protocol editor inspired by [protocols.io](https://www.protocols.io) for creating and managing lab protocols. Built with Next.js and Tailwind CSS.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Creating a protocol

1. Click **+ New Protocol** on the home page
2. Edit the title and description at the top of the editor
3. Click **+ Add Step** to add steps to your protocol

### Adding inline elements to steps

Each step has an **Insert** toolbar with five element types:

| Element       | What it does                                | Example          |
|---------------|---------------------------------------------|------------------|
| **Duration**  | Time value + unit (sec, min, hr, days)      | `30 min`         |
| **Equipment** | Searchable list of lab equipment            | `Centrifuge`     |
| **Amount**    | Numeric value + unit (µL, mM, g, etc.)      | `500 µL`         |
| **Temperature** | Temperature value + unit (°C, °F, K)      | `37°C`           |
| **Reagent**   | Searchable list of common lab reagents      | `LB broth`       |

1. Place your cursor in the step text where you want the element
2. Click an insert button (e.g. **Duration**)
3. Fill in the value and unit, then click **OK**
4. The element appears as a colored chip inline with your text

Click a chip to edit it, or click **×** to remove it.

### Managing steps

- **Reorder**: hover over a step and use the **↑↓** arrows
- **Delete**: hover over a step and click **×**

### Searching protocols

Use the search bar on the home page to filter protocols by title.

### Data storage

All protocols are saved to your browser's localStorage automatically as you edit. No account or server needed.

## Build

```bash
npm run build
npm start
```
