# Contributing to Kalpa AI

First off, thank you for considering contributing to Kalpa AI! It's people like you that make Kalpa AI such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [How to Contribute](#how-to-contribute)
- [Style Guidelines](#style-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Focus on what is best** for the community
- **Show empathy** towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Basic knowledge of TypeScript and React

### Setting Up Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Kalpa-ai.git
   cd Kalpa-ai
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/raushan22882917/Kalpa-ai.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

6. **Start development server**
   ```bash
   npm start
   ```

7. **Verify setup**
   ```bash
   npm test
   npm run type-check
   ```

## Development Process

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring

### Workflow

1. **Create a branch** from `develop`
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)
- **Error messages** or logs

**Bug Report Template:**

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node Version: [e.g., 18.17.0]

**Additional context**
Any other context about the problem.
```

### Suggesting Features

Feature requests are welcome! Please provide:

- **Clear title** and description
- **Use case** - Why is this feature needed?
- **Proposed solution** - How should it work?
- **Alternatives considered**
- **Additional context** or mockups

**Feature Request Template:**

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Mockups, examples, or other context.
```

### Contributing Code

#### Good First Issues

Look for issues labeled `good first issue` or `help wanted`. These are great starting points!

#### Areas to Contribute

- **Bug fixes** - Fix reported issues
- **Features** - Implement new functionality
- **Documentation** - Improve docs
- **Tests** - Add or improve tests
- **Performance** - Optimize code
- **Accessibility** - Improve a11y
- **UI/UX** - Enhance user experience

## Style Guidelines

### TypeScript Style

```typescript
// ✅ Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

// ❌ Bad
export const getUserProfile = async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  return await response.json();
};
```

### React Component Style

```typescript
// ✅ Good - Functional component with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {label}
    </button>
  );
};

// ❌ Bad - Class component without types
export class Button extends React.Component {
  render() {
    return <button onClick={this.props.onClick}>{this.props.label}</button>;
  }
}
```

### Service Layer Style

```typescript
// ✅ Good - Service with error handling
export class FileSystemService {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  /**
   * Creates a new file in the file system
   * @param path - File path
   * @param content - File content
   * @throws {Error} If file already exists
   */
  async createFile(path: string, content: string): Promise<void> {
    if (!this.isValidPath(path)) {
      throw new Error(`Invalid file path: ${path}`);
    }

    if (await this.fileExists(path)) {
      throw new Error(`File already exists: ${path}`);
    }

    this.storage.setItem(path, content);
  }

  private isValidPath(path: string): boolean {
    return path.length > 0 && !path.includes('..');
  }
}

// ❌ Bad - No error handling or validation
export const createFile = (path, content) => {
  localStorage.setItem(path, content);
};
```

### CSS Style

```css
/* ✅ Good - BEM naming, organized */
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.file-explorer__header {
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
}

.file-explorer__item {
  padding: 4px 8px;
  cursor: pointer;
}

.file-explorer__item--selected {
  background-color: var(--selection-bg);
}

/* ❌ Bad - Unclear naming, no organization */
.fe {
  display: flex;
}

.item {
  padding: 4px;
}
```

### Code Organization

```
src/
├── components/          # React components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.css
│   │   └── Button.test.tsx
│   └── FileExplorer/
│       ├── FileExplorer.tsx
│       ├── FileExplorer.css
│       └── FileExplorer.test.tsx
├── services/           # Business logic
│   ├── fileSystemService.ts
│   └── fileSystemService.test.ts
├── types/              # TypeScript types
│   └── editor.ts
└── utils/              # Utility functions
    └── pathUtils.ts
```

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { fileSystemService } from './fileSystemService';

describe('FileSystemService', () => {
  it('should create a file', async () => {
    await fileSystemService.createFile('/test.txt', 'content');
    const content = await fileSystemService.readFile('/test.txt');
    expect(content).toBe('content');
  });

  it('should throw error for invalid path', async () => {
    await expect(
      fileSystemService.createFile('../test.txt', 'content')
    ).rejects.toThrow('Invalid file path');
  });
});
```

### Property-Based Tests

```typescript
import fc from 'fast-check';

describe('FileSystemService property tests', () => {
  it('should handle any valid file content', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string(),
        async (path, content) => {
          await fileSystemService.createFile(path, content);
          const read = await fileSystemService.readFile(path);
          expect(read).toBe(content);
        }
      )
    );
  });
});
```

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button label="Click me" onClick={onClick} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Coverage

- Aim for **80%+ coverage**
- Test **happy paths** and **error cases**
- Test **edge cases** and **boundary conditions**
- Use **property-based testing** for complex logic

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
# Feature
git commit -m "feat(editor): add syntax highlighting for Python"

# Bug fix
git commit -m "fix(terminal): resolve command history issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api): change file system API

BREAKING CHANGE: FileSystemService.createFile now returns Promise<File>"
```

## Pull Request Process

### Before Submitting

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Run all tests** and ensure they pass
4. **Check TypeScript** types
5. **Lint your code**
6. **Update CHANGELOG.md** if applicable

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Commits follow convention
- [ ] PR description is clear

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots
If applicable, add screenshots.

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No TypeScript/lint errors
```

### Review Process

1. **Automated checks** must pass (tests, linting, type-checking)
2. **At least one approval** from maintainers required
3. **Address feedback** from reviewers
4. **Squash commits** if requested
5. **Maintainer will merge** when approved

### After Merge

- Your PR will be included in the next release
- You'll be added to contributors list
- Thank you for your contribution! 🎉

## Questions?

- **GitHub Discussions**: Ask questions
- **Discord**: Join our community
- **Email**: dev@kalpa-ai.com

---

Thank you for contributing to Kalpa AI! 🚀
