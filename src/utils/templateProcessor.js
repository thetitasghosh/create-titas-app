// Fix for src/utils/templateUtils.js or wherever you're resolving template paths

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

/**
 * Get the correct template path for both development and production
 * @param {string} templateType - Template type (portfolio, ecom, etc.)
 * @returns {string} - Absolute path to template directory
 */
function getTemplatePath(templateType) {
  // Multiple possible locations to check
  const possiblePaths = [
    // Production npm package structure
    path.resolve(__dirname, "../../templates", templateType),
    // Alternative production structure
    path.resolve(__dirname, "../../../templates", templateType),
    // Development structure
    path.resolve(__dirname, "../../templates", templateType),
    // If running from node_modules
    path.resolve(__dirname, "../templates", templateType),
  ];

  // Return the first path that exists
  for (const templatePath of possiblePaths) {
    if (fs.existsSync(templatePath)) {
      console.log(chalk.gray(`Found template at: ${templatePath}`));
      return templatePath;
    }
  }

  // If no template found, return null and we'll create a basic one
  console.warn(
    chalk.yellow(`Template "${templateType}" not found in any location`)
  );
  return null;
}

/**
 * Copy template files to project directory
 * @param {string} templateType - Template type (portfolio, ecom, etc.)
 * @param {string} targetPath - Target project path
 * @returns {Promise<boolean>} - Success status
 */
async function copyTemplate(templateType, targetPath) {
  try {
    let templatePath = getTemplatePath(templateType);

    // If template doesn't exist, create a basic one
    if (!templatePath) {
      console.log(chalk.yellow(`Creating basic ${templateType} template...`));
      await createBasicTemplate(targetPath, templateType);
      return true;
    }

    console.log(chalk.blue(`Copying ${templateType} template...`));

    // Copy all files from template to target
    await fs.copy(templatePath, targetPath, {
      overwrite: true,
      filter: (src, dest) => {
        // Skip certain files during copy
        const filename = path.basename(src);
        const skipFiles = [
          "node_modules",
          ".git",
          ".next",
          "package-lock.json",
          "yarn.lock",
          ".env",
          "dist",
          "build",
        ];

        return !skipFiles.some(
          (skip) =>
            filename === skip ||
            src.includes(`/${skip}/`) ||
            src.includes(`\\${skip}\\`)
        );
      },
    });

    console.log(chalk.green(`✅ Copied ${templateType} template successfully`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to copy template: ${error.message}`));

    // Fallback: create basic template
    console.log(chalk.yellow(`Creating fallback basic template...`));
    await createBasicTemplate(targetPath, templateType);
    return true;
  }
}

/**
 * Create a basic template when none exists
 * @param {string} targetPath - Target directory
 * @param {string} templateType - Template type
 */
async function createBasicTemplate(targetPath, templateType) {
  try {
    // Ensure target directory exists
    await fs.ensureDir(targetPath);

    // Create basic package.json
    const packageJson = {
      name: "{{projectName}}",
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        next: "^14.0.0",
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
      devDependencies: {
        eslint: "^8.0.0",
        "eslint-config-next": "^14.0.0",
      },
    };

    // Add template-specific dependencies
    switch (templateType) {
      case "dashboard":
        packageJson.dependencies.recharts = "^2.8.0";
        packageJson.dependencies["lucide-react"] = "^0.292.0";
        break;
      case "ecom":
        packageJson.dependencies.stripe = "^14.0.0";
        break;
      case "portfolio":
        packageJson.dependencies.motion = "^10.0.0";
        break;
    }

    await fs.writeJson(path.join(targetPath, "package.json"), packageJson, {
      spaces: 2,
    });

    // Create README.md
    const readme = `# {{projectName}}

This is a [Next.js](https://nextjs.org/) project created with create-titas-app using the ${templateType} template.

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Template: ${templateType.charAt(0).toUpperCase() + templateType.slice(1)}

This template includes basic structure for a ${templateType} application.

You can start editing the page by modifying \`pages/index.js\`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
`;

    await fs.writeFile(path.join(targetPath, "README.md"), readme);

    // Create pages directory and index.js
    const pagesDir = path.join(targetPath, "pages");
    await fs.ensureDir(pagesDir);

    const indexContent = `import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>{{projectName}}</title>
        <meta name="description" content="Generated by create-titas-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">{{projectName}}!</a>
        </h1>

        <p className={styles.description}>
          ${getTemplateDescription(templateType)}
        </p>

        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Documentation &rarr;</h2>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a href="https://nextjs.org/learn" className={styles.card}>
            <h2>Learn &rarr;</h2>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <img src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}`;

    await fs.writeFile(path.join(pagesDir, "index.js"), indexContent);

    // Create styles directory
    const stylesDir = path.join(targetPath, "styles");
    await fs.ensureDir(stylesDir);

    // Create globals.css
    const globalsCss = `html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
  body {
    color: white;
    background: black;
  }
}`;

    await fs.writeFile(path.join(stylesDir, "globals.css"), globalsCss);

    // Create Home.module.css
    const homeCss = `.container {
  padding: 0 2rem;
}

.main {
  min-height: 100vh;
  padding: 4rem 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.footer {
  display: flex;
  flex: 1;
  padding: 2rem 0;
  border-top: 1px solid #eaeaea;
  justify-content: center;
  align-items: center;
}

.footer a {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
}

.title {
  margin: 0;
  line-height: 1.15;
  font-size: 4rem;
  text-align: center;
}

.title a {
  color: #0070f3;
  text-decoration: none;
}

.title a:hover,
.title a:focus,
.title a:active {
  text-decoration: underline;
}

.description {
  margin: 4rem 0;
  line-height: 1.5;
  font-size: 1.5rem;
  text-align: center;
}

.grid {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 800px;
}

.card {
  margin: 1rem;
  padding: 1.5rem;
  text-align: left;
  color: inherit;
  text-decoration: none;
  border: 1px solid #eaeaea;
  border-radius: 10px;
  transition: color 0.15s ease, border-color 0.15s ease;
  max-width: 300px;
}

.card:hover,
.card:focus,
.card:active {
  color: #0070f3;
  border-color: #0070f3;
}

.card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.card p {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.5;
}

.logo {
  height: 1em;
  margin-left: 0.5rem;
}

@media (max-width: 600px) {
  .grid {
    width: 100%;
    flex-direction: column;
  }
}`;

    await fs.writeFile(path.join(stylesDir, "Home.module.css"), homeCss);

    // Create _app.js
    const appContent = `import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}`;

    await fs.writeFile(path.join(pagesDir, "_app.js"), appContent);

    console.log(chalk.green(`✅ Created basic ${templateType} template`));
  } catch (error) {
    console.error(
      chalk.red(`❌ Failed to create basic template: ${error.message}`)
    );
    throw error;
  }
}

/**
 * Get template-specific description
 */
function getTemplateDescription(templateType) {
  const descriptions = {
    portfolio:
      "A beautiful portfolio template to showcase your work and projects.",
    ecom: "An e-commerce template with shopping cart functionality and payment integration.",
    dashboard:
      "A dashboard template with charts, analytics, and data visualization.",
    webapp: "A full-stack web application template with modern features.",
  };

  return (
    descriptions[templateType] ||
    "A Next.js application template created with create-titas-app."
  );
}

/**
 * Process template files by replacing variables
 * @param {string} projectPath - Project directory path
 * @param {Object} variables - Variables to replace in templates
 * @returns {Promise<boolean>} - Success status
 */
async function processTemplate(projectPath, variables) {
  try {
    console.log(chalk.blue("Processing template files..."));

    // Process package.json first
    await processPackageJson(projectPath, variables);

    // Process other template files
    await processTemplateFiles(projectPath, variables);

    console.log(chalk.green("✅ Template processed successfully"));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to process template: ${error.message}`));
    throw error;
  }
}

/**
 * Process package.json file
 */
async function processPackageJson(projectPath, variables) {
  const packageJsonPath = path.join(projectPath, "package.json");

  try {
    if (await fs.pathExists(packageJsonPath)) {
      let content = await fs.readFile(packageJsonPath, "utf8");

      // Replace template variables
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        content = content.replace(regex, variables[key] || "");
      });

      await fs.writeFile(packageJsonPath, content, "utf8");
      console.log(chalk.green("✓ Updated package.json"));
    }
  } catch (error) {
    console.error(
      chalk.yellow(`Warning: Could not process package.json: ${error.message}`)
    );
  }
}

/**
 * Process all template files recursively
 */
async function processTemplateFiles(dirPath, variables) {
  try {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        if (["node_modules", ".git", ".next", "build", "dist"].includes(item)) {
          continue;
        }
        await processTemplateFiles(itemPath, variables);
      } else {
        await processFile(itemPath, variables);
      }
    }
  } catch (error) {
    console.error(
      chalk.yellow(`Warning processing directory ${dirPath}: ${error.message}`)
    );
  }
}

/**
 * Process individual file
 */
async function processFile(filePath, variables) {
  const ext = path.extname(filePath);
  const isTemplateFile = filePath.endsWith(".template");

  const processableExtensions = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".md",
    ".html",
    ".css",
    ".txt",
    ".yml",
    ".yaml",
  ];

  if (isTemplateFile || processableExtensions.includes(ext)) {
    try {
      let content = await fs.readFile(filePath, "utf8");
      let hasChanges = false;

      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        const originalContent = content;
        content = content.replace(regex, variables[key] || "");
        if (originalContent !== content) {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        await fs.writeFile(filePath, content, "utf8");
      }

      if (isTemplateFile) {
        const newFilePath = filePath.replace(".template", "");
        await fs.move(filePath, newFilePath);
      }
    } catch (error) {
      // Skip files that can't be processed
    }
  }
}

module.exports = {
  copyTemplate,
  processTemplate,
};
