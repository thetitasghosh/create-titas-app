# create-titas-app 🚀

A powerful CLI tool to create modern web applications with your preferred tech stack. Get started with Next.js projects in seconds using pre-configured templates for portfolio, e-commerce, dashboard, and web applications.

## Features ✨

- **🎯 Multiple Templates** - Portfolio, E-commerce, Dashboard, Web App
- **⚡ Fast Setup** - Get a project running in under 2 minutes
- **🔧 Customizable** - TypeScript, Tailwind CSS, and more options
- **📦 Smart Package Management** - Auto-detects npm/yarn
- **🌟 Git Integration** - Automatic repository initialization
- **🎨 Modern Stack** - Built on Next.js with latest best practices
- **🖥️ Cross-Platform** - Works on Windows, macOS, and Linux

## Quick Start 🏃‍♂️

```bash
# Create a new app with interactive prompts
npx create-titas-app@latest my-awesome-app

# Or use specific template flags
npx create-titas-app@latest my-portfolio --portfolio
npx create-titas-app@latest my-store --ecom --typescript --tailwind
```

## Installation

### Global Installation (Recommended)

```bash
npm install -g create-titas-app
```

### One-time Usage

```bash
npx create-titas-app@latest project-name
```

## Usage

### Basic Usage

```bash
create-titas-app <project-name> [options]
```

### Interactive Mode

Simply run without any flags to get an interactive setup:

```bash
npx create-titas-app@latest my-project
```

You'll be prompted to choose:
- Template type
- Additional features
- Configuration options

### Command Line Flags

#### Template Options
- `--portfolio` - Create a portfolio/personal website
- `--ecom` - Create an e-commerce application
- `--dashboard` - Create an analytics dashboard
- `--webapp` - Create a full-stack web application

#### Feature Options
- `--typescript` - Add TypeScript support
- `--tailwind` - Include Tailwind CSS
- `--no-git` - Skip Git repository initialization
- `--no-install` - Skip automatic dependency installation

### Examples

```bash
# Portfolio with TypeScript and Tailwind
create-titas-app john-portfolio --portfolio --typescript --tailwind

# E-commerce site with minimal setup
create-titas-app online-store --ecom

# Dashboard without Git
create-titas-app analytics-dash --dashboard --no-git

# Web app with custom configuration
create-titas-app my-saas --webapp --typescript --no-install
```

## Templates 📋

### 📄 Portfolio Template
Perfect for personal websites, portfolios, and professional showcases.

**Includes:**
- Modern responsive design
- Contact forms
- Project showcase sections
- Blog capabilities
- SEO optimization

### 🛒 E-commerce Template
Ready-to-use online store with shopping cart and payment integration.

**Includes:**
- Product catalog
- Shopping cart functionality
- Payment gateway integration
- User authentication
- Admin dashboard

### 📊 Dashboard Template
Analytics and data visualization dashboard for business applications.

**Includes:**
- Chart and graph components
- Data tables
- User management
- Real-time updates
- Responsive layout

### 🌐 Web App Template
Full-stack application foundation for complex web applications.

**Includes:**
- Authentication system
- Database integration
- API routes
- State management
- Testing setup

## Project Structure

After creating a project, you'll get this structure:

```
my-project/
├── src/
│   ├── pages/          # Next.js pages
│   ├── components/     # React components
│   ├── styles/         # CSS/SCSS files
│   └── utils/          # Utility functions
├── public/             # Static assets
├── .gitignore         # Git ignore rules
├── package.json       # Dependencies and scripts
├── next.config.js     # Next.js configuration
└── README.md          # Project documentation
```

## Commands

After creating your project:

```bash
cd my-project

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Configuration Options

### Package Manager Detection
The CLI automatically detects and uses your preferred package manager:
- **npm** (default)
- **yarn** (if available)

### Git Integration
- Automatically initializes Git repository
- Creates comprehensive `.gitignore`
- Makes initial commit
- Sets up `main` branch as default

### TypeScript Support
When using `--typescript` flag:
- Adds TypeScript dependencies
- Configures `tsconfig.json`
- Converts template files to TypeScript
- Sets up type definitions

### Tailwind CSS Integration
When using `--tailwind` flag:
- Installs Tailwind CSS and dependencies
- Configures `tailwind.config.js`
- Sets up PostCSS configuration
- Includes base styles

## Advanced Usage

### Skip Installations
```bash
create-titas-app my-project --portfolio --no-install
cd my-project
npm install  # Install manually
```

### Custom Git Configuration
```bash
create-titas-app my-project --webapp --no-git
cd my-project
git init
git remote add origin https://github.com/username/repo.git
```

### Environment Setup
```bash
# Check environment information
create-titas-app info
```

## Troubleshooting 🔧

### Common Issues

#### 1. `spawn npm ENOENT` error
**Solution:** Ensure Node.js and npm are properly installed and in your PATH.

```bash
# Check installations
node --version
npm --version

# Reinstall Node.js if needed
# Download from: https://nodejs.org/
```

#### 2. Permission errors on macOS/Linux
**Solution:** Use npx or fix npm permissions.

```bash
# Using npx (recommended)
npx create-titas-app@latest my-project

# Or fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

#### 3. Template not found
**Solution:** Ensure you're using a valid template flag.

```bash
# Valid templates
--portfolio
--ecom
--dashboard
--webapp
```

#### 4. Git initialization fails
**Solution:** Check Git configuration.

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Windows-Specific Issues

#### PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Path Issues
Ensure Node.js is in your PATH:
```powershell
$env:PATH += ";C:\Program Files\nodejs"
```

## Requirements

- **Node.js** 16.0 or higher
- **npm** 7.0 or higher (or yarn 1.22+)
- **Git** (optional, for repository initialization)

## Contributing 🤝

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/thetitasghosh/create-titas-app.git
cd create-titas-app

# Install dependencies
npm install

# Link for local testing
npm link

# Test locally
create-titas-app test-project --portfolio
```

### Adding New Templates

1. Create template folder in `templates/`
2. Add template files with `.template` suffix for variable substitution
3. Update template choices in `src/commands/create.js`
4. Test thoroughly across different platforms

## Changelog 📝

### v1.0.0
- Initial release
- Four base templates (Portfolio, E-commerce, Dashboard, Web App)
- TypeScript and Tailwind CSS support
- Git integration
- Cross-platform compatibility

## License 📄

MIT License - see [LICENSE](LICENSE) file for details.

## Support 💬

- **Issues**: [GitHub Issues](https://github.com/thetitasghosh/create-titas-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/thetitasghosh/create-titas-app/discussions)
- **Email**: support@titasapps.com

## Acknowledgments 🙏

- Inspired by `create-react-app` and `create-next-app`
- Built with ❤️ using Node.js and Commander.js
- Thanks to all contributors and users

---

**Happy coding!** 🚀

Made with ❤️ by [Your Name](https://github.com/thetitasghosh)