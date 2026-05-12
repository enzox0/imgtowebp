# Contributing to imgtowebp

Thank you for your interest in contributing to imgtowebp! We welcome contributions from the community.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (Node.js version, browser, OS)
- Code samples or screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please create an issue with:
- A clear description of the feature
- Use cases and benefits
- Any implementation ideas you might have

### Pull Requests

1. **Fork the repository** and create your branch from `main`:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Make your changes**:
   - Write clear, readable code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

4. **Test your changes**:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

5. **Commit your changes**:
   - Use clear, descriptive commit messages
   - Follow conventional commit format if possible:
     - `feat:` for new features
     - `fix:` for bug fixes
     - `docs:` for documentation changes
     - `test:` for test additions/changes
     - `refactor:` for code refactoring

6. **Push to your fork** and submit a pull request to the `main` branch

7. **Wait for review**:
   - Address any feedback from maintainers
   - Keep your branch up to date with main

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or your preferred package manager

### Project Structure

```
imgtowebp/
├── src/
│   ├── browser/     # Browser implementation
│   ├── node/        # Node.js implementation
│   └── index.ts     # Main entry point
├── dist/            # Built files (generated)
└── tests/           # Test files
```

### Building

```bash
npm run build        # Build the project
npm run dev          # Build in watch mode
```

### Testing

```bash
npm test             # Run tests
npm run typecheck    # Type check with TypeScript
```

## Code Style

- Use TypeScript for all code
- Follow the existing code formatting
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and concise

## Testing Guidelines

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- Aim for good test coverage
- Test both browser and Node.js implementations when applicable

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments for new public APIs
- Include code examples for new features
- Keep documentation clear and concise

## Questions?

If you have questions about contributing, feel free to:
- Open an issue with the `question` label
- Start a discussion in the GitHub Discussions tab

## License

By contributing to imgtowebp, you agree that your contributions will be licensed under the MIT License.
