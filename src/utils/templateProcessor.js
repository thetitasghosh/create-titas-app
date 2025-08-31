const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

/**
 * Copy template files to project directory
 * @param {string} templateType - Template type (portfolio, ecom, etc.)
 * @param {string} targetPath - Target project path
 * @returns {Promise<boolean>} - Success status
 */
async function copyTemplate(templateType, targetPath) {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../templates",
      templateType
    );

    // Check if template exists
    if (!(await fs.pathExists(templatePath))) {
      throw new Error(
        `Template "${templateType}" not found at ${templatePath}`
      );
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
    throw error;
  }
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
 * @param {string} projectPath - Project directory path
 * @param {Object} variables - Variables to replace
 */
async function processPackageJson(projectPath, variables) {
  const packageJsonPath = path.join(projectPath, "package.json");

  try {
    let packageJson = {};

    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
    }

    // Update package.json with project details
    packageJson.name = variables.projectName || packageJson.name || "titas-app";
    packageJson.version = packageJson.version || "0.1.0";
    packageJson.private =
      packageJson.private !== undefined ? packageJson.private : true;

    // Ensure basic scripts exist
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts = {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
      ...packageJson.scripts,
    };

    // Add TypeScript dependencies if requested
    if (variables.typescript) {
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        typescript: "^5.0.0",
        "@types/node": "^20.0.0",
        "@types/react": "^18.0.0",
        "@types/react-dom": "^18.0.0",
      };
    }

    // Add Tailwind CSS if requested
    if (variables.tailwind) {
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        tailwindcss: "^3.3.0",
        postcss: "^8.4.0",
        autoprefixer: "^10.4.0",
      };
    }

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    console.log(chalk.green("✓ Updated package.json"));
  } catch (error) {
    console.error(
      chalk.yellow(`Warning: Could not process package.json: ${error.message}`)
    );
  }
}

/**
 * Process template files recursively
 * @param {string} dirPath - Directory to process
 * @param {Object} variables - Variables to replace
 */
async function processTemplateFiles(dirPath, variables) {
  try {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        // Skip certain directories
        if (["node_modules", ".git", ".next", "build"].includes(item)) {
          continue;
        }
        // Recursively process subdirectories
        await processTemplateFiles(itemPath, variables);
      } else {
        // Process individual files
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
 * Process individual template file
 * @param {string} filePath - File to process
 * @param {Object} variables - Variables to replace
 */
async function processFile(filePath, variables) {
  const ext = path.extname(filePath);
  const isTemplateFile = filePath.endsWith(".template");

  // File extensions to process
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

  // Process template files or files with allowed extensions
  if (isTemplateFile || processableExtensions.includes(ext)) {
    try {
      let content = await fs.readFile(filePath, "utf8");
      let hasChanges = false;

      // Replace variables like {{projectName}}, {{templateType}}, etc.
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        const originalContent = content;
        content = content.replace(regex, variables[key] || "");
        if (originalContent !== content) {
          hasChanges = true;
        }
      });

      // Write back if changes were made
      if (hasChanges) {
        await fs.writeFile(filePath, content, "utf8");
      }

      // Remove .template suffix if it's a template file
      if (isTemplateFile) {
        const newFilePath = filePath.replace(".template", "");
        await fs.move(filePath, newFilePath);
      }
    } catch (error) {
      // Skip binary files or files that can't be read as text
      if (error.code !== "EISDIR") {
        console.warn(
          chalk.yellow(
            `Warning: Could not process file ${path.basename(filePath)}: ${
              error.message
            }`
          )
        );
      }
    }
  }
}

/**
 * Create basic template structure if templates don't exist
 * @param {string} templatesDir - Templates directory path
 * @param {string} templateType - Template type to create
 */
async function createBasicTemplate(templatesDir, templateType) {
  const templatePath = path.join(templatesDir, templateType);

  try {
    await fs.ensureDir(templatePath);

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

    await fs.writeJson(path.join(templatePath, "package.json"), packageJson, {
      spaces: 2,
    });

    // Create basic README
    const readme = `# {{projectName}}

This is a [Next.js](https://nextjs.org/) project created with create-titas-app.

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
`;

    await fs.writeFile(path.join(templatePath, "README.md"), readme);

    // Create basic Next.js structure
    const pagesDir = path.join(templatePath, "pages");
    await fs.ensureDir(pagesDir);

    const indexPage = `import Head from 'next/head'

export default function Home() {
  return (
    <div>
      <Head>
        <title>{{projectName}}</title>
        <meta name="description" content="Generated by create-titas-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Welcome to {{projectName}}</h1>
        <p>Get started by editing <code>pages/index.js</code></p>
      </main>
    </div>
  )
}
`;

    await fs.writeFile(path.join(pagesDir, "index.js"), indexPage);

    console.log(chalk.green(`✅ Created basic ${templateType} template`));
    return true;
  } catch (error) {
    console.error(
      chalk.red(`❌ Failed to create basic template: ${error.message}`)
    );
    return false;
  }
}

module.exports = {
  copyTemplate,
  processTemplate,
  createBasicTemplate,
};
