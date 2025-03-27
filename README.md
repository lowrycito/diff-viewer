# Handbook Redline - Git Diff Viewer

A simple web application that allows users to select commits from a GitHub repository and view diffs in a redline (side-by-side) view. This tool is designed to be easy for attorneys and non-technical users to review changes to documents in a repository.

## Features

- Select any public GitHub repository to view (defaults to withastro/astro)
- Browse through commit history with search and filtering capabilities
- Collapsible sidebar for maximizing diff view space
- View diffs in both side-by-side and unified formats (toggleable)
- Responsive design that works on desktop and mobile devices
- Fast loading and rendering of diffs with progress indicators
- Multiple fallback mechanisms for diff rendering
- Keyboard shortcuts for efficient navigation
- Smart caching to reduce API calls and improve performance
- GitHub API rate limit handling with clear error messages

## Technologies Used

- [Astro.js](https://astro.build/) - Fast, modern web framework
- [diff2html](https://github.com/rtfpessoa/diff2html) - Generates HTML diff views from git diffs
- [Octokit](https://github.com/octokit/rest.js) - GitHub API client for JavaScript
- Custom SimpleDiff renderer as fallback when diff2html is unavailable
- Modern CSS with responsive design for all screen sizes

## Keyboard Shortcuts

- `↑`/`↓` - Navigate through commits
- `/` or `Ctrl+F` - Focus search box
- `Esc` - Clear search
- `S` - Toggle sidebar collapse/expand
- `?` - Show keyboard shortcuts
- `D` - Toggle debug information

## Layout

The application has a responsive layout with:

- A collapsible sidebar on the left showing commit history
- Main content area on the right displaying the diff view
- Ability to toggle between side-by-side and unified diff views
- Debug information accessible via the Debug button in the header
- Fully responsive design that adapts to mobile devices

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:

```bash
cd handbook-viewer
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. The application defaults to showing commits from the lowrycito/handbook repository
2. You can enter a different GitHub repository owner and name if desired
3. Select a commit from the left sidebar to view its changes
4. Browse the diff content in the main panel

## Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:3000`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## License

MIT

## Credits

Created with [Astro](https://astro.build/) and [diff2html](https://diff2html.xyz/)