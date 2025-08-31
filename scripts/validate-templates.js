const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

/**
 * Validate that all required templates exist
 */
async function validateTemplates() {
  console.log(chalk.blue("🔍 Validating templates..."));

  const templatesDir = path.resolve(__dirname, "../templates");
  const requiredTemplates = ["portfolio", "ecom", "dashboard", "webapp"];

  let isValid = true;

  try {
    // Check if templates directory exists
    if (!(await fs.pathExists(templatesDir))) {
      console.error(chalk.red("❌ Templates directory not found!"));
      console.log(chalk.yellow("Creating basic templates..."));
      await createBasicTemplates(templatesDir, requiredTemplates);
      return;
    }

    // Check each required template
    for (const template of requiredTemplates) {
      const templatePath = path.join(templatesDir, template);
      const exists = await fs.pathExists(templatePath);

      if (exists) {
        console.log(chalk.green(`✅ ${template} template found`));

        // Check if template has package.json
        const packageJsonPath = path.join(templatePath, "package.json");
        if (await fs.pathExists(packageJsonPath)) {
          console.log(chalk.gray(`  └─ package.json found`));
        } else {
          console.log(
            chalk.yellow(`  └─ package.json missing - will create basic one`)
          );
          await createBasicPackageJson(templatePath, template);
        }
      } else {
        console.log(chalk.red(`❌ ${template} template missing`));
        await createBasicTemplate(templatesDir, template);
        isValid = false;
      }
    }

    if (isValid) {
      console.log(chalk.green("\n✅ All templates validated successfully!"));
    } else {
      console.log(
        chalk.yellow(
          "\n⚠️ Some templates were missing but have been created with basic structure"
        )
      );
    }
  } catch (error) {
    console.error(chalk.red("❌ Template validation failed:", error.message));
    process.exit(1);
  }
}

/**
 * Create basic templates if they don't exist
 */
async function createBasicTemplates(templatesDir, templates) {
  await fs.ensureDir(templatesDir);

  for (const template of templates) {
    await createBasicTemplate(templatesDir, template);
  }
}

/**
 * Create a basic template structure
 */
async function createBasicTemplate(templatesDir, templateName) {
  const templatePath = path.join(templatesDir, templateName);

  console.log(chalk.blue(`Creating basic ${templateName} template...`));

  try {
    await fs.ensureDir(templatePath);

    // Create package.json
    await createBasicPackageJson(templatePath, templateName);

    // Create README.md
    const readme = `# {{projectName}}

This is a [Next.js](https://nextjs.org/) project created with create-titas-app using the ${templateName} template.

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Template: ${templateName.charAt(0).toUpperCase() + templateName.slice(1)}

This template includes basic structure for a ${templateName} application.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
`;

    await fs.writeFile(path.join(templatePath, "README.md"), readme);

    // Create basic pages structure
    const pagesDir = path.join(templatePath, "pages");
    await fs.ensureDir(pagesDir);

    const indexContent = getTemplateIndexContent(templateName);
    await fs.writeFile(path.join(pagesDir, "index.js"), indexContent);

    // Create basic styles
    const stylesDir = path.join(templatePath, "styles");
    await fs.ensureDir(stylesDir);

    const globalStyles = `html,
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

.container {
  min-height: 100vh;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.main {
  padding: 5rem 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.title {
  margin: 0;
  line-height: 1.15;
  font-size: 4rem;
  text-align: center;
}

.description {
  text-align: center;
  line-height: 1.5;
  font-size: 1.5rem;
}
`;

    await fs.writeFile(path.join(stylesDir, "globals.css"), globalStyles);

    console.log(chalk.green(`✅ Created basic ${templateName} template`));
  } catch (error) {
    console.error(
      chalk.red(`❌ Failed to create ${templateName} template:`, error.message)
    );
  }
}

/**
 * Create basic package.json for template
 */
async function createBasicPackageJson(templatePath, templateName) {
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
  if (templateName === "dashboard") {
    packageJson.dependencies.recharts = "^2.8.0";
    // packageJson.dependencies.lucide-react = "^0.292.0";
  } else if (templateName === "ecom") {
    packageJson.dependencies.stripe = "^14.0.0";
  }

  await fs.writeJson(path.join(templatePath, "package.json"), packageJson, {
    spaces: 2,
  });
}

/**
 * Get template-specific index.js content
 */
function getTemplateIndexContent(templateName) {
  const baseContent = `import Head from 'next/head'
import styles from '../styles/globals.css'

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>{{projectName}}</title>
        <meta name="description" content="Generated by create-titas-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
          Welcome to {{projectName}}
        </h1>

        <p className="description">
          ${getTemplateDescription(templateName)}
        </p>

        <p className="description">
          Get started by editing <code>pages/index.js</code>
        </p>
      </main>
    </div>
  )
}`;

  return baseContent;
}

/**
 * Get template-specific description
 */
function getTemplateDescription(templateName) {
  const descriptions = {
    portfolio: "A beautiful portfolio template to showcase your work",
    ecom: "An e-commerce template with shopping cart functionality",
    dashboard: "A dashboard template with charts and analytics",
    webapp: "A full-stack web application template",
  };

  return descriptions[templateName] || "A Next.js application template";
}

// Run validation if called directly
if (require.main === module) {
  validateTemplates().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { validateTemplates };
