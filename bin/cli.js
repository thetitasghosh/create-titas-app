#!/usr/bin/env node

const { program } = require("commander");
const chalk = require("chalk");
const packageJson = require("../package.json");

// Import your create command
const { createApp } = require("../src/commands/create");

// Set up the program
program
  .name("create-titas-app")
  .description("Create a new Titas app with your preferred tech stack")
  .version(packageJson.version)
  .argument("<project-name>", "name of the project")
  .option("--portfolio", "create a portfolio template")
  .option("--ecom", "create an e-commerce template")
  .option("--dashboard", "create a dashboard template")
  .option("--webapp", "create a web app template")
  .option("--typescript", "use TypeScript")
  .option("--tailwind", "include Tailwind CSS")
  .option("--no-git", "skip Git initialization")
  .option("--no-install", "skip dependency installation")
  .option("--verbose", "show detailed output for debugging")
  .action(async (projectName, options) => {
    try {
      console.log(
        chalk.cyan(`\n🚀 Creating ${projectName} with create-titas-app...\n`)
      );
      await createApp(projectName, options);
    } catch (error) {
      console.error(chalk.red("\n❌ Error creating app:"), error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Add additional commands if needed
program
  .command("info")
  .description("Display environment information")
  .action(() => {
    console.log(chalk.blue("Environment Information:"));
    console.log(`Node.js version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);
    console.log(`create-titas-app version: ${packageJson.version}`);
  });

// Add environment check command
program
  .command("doctor")
  .description("Check system requirements and diagnose issues")
  .action(async () => {
    const { checkEnvironment } = require("../src/commands/create");
    await checkEnvironment();
  });

// Handle unknown commands
program.on("command:*", () => {
  console.error(
    chalk.red(
      "Invalid command: %s\nSee --help for a list of available commands."
    ),
    program.args.join(" ")
  );
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
