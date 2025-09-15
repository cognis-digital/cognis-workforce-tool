# Cognis Workforce Tool - GitHub Deployment Instructions

This document provides step-by-step instructions for deploying the Cognis Workforce Tool to production using GitHub and GitHub Pages.

## 1. Initialize GitHub Repository

```bash
# Navigate to your project directory
cd /Users/admin/Downloads/Cognis\ Workforce\ Tool

# Initialize Git repository if not already done
git init

# Add all files to the repository
git add .

# Create an initial commit
git commit -m "Initial commit of Cognis Workforce Tool"
```

## 2. Create GitHub Repository

1. Go to [GitHub](https://github.com) and log in to your account
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Fill in the repository details:
   - Repository name: `cognis-workforce-tool`
   - Description: `Cognis Digital - Blockchain AI Agency Workforce Platform`
   - Visibility: Choose either public or private based on your requirements
   - Initialize with: Do not initialize with README, .gitignore, or license
4. Click "Create repository"

## 3. Connect Local Repository to GitHub

```bash
# Add the GitHub repository as a remote
git remote add origin https://github.com/YOUR-USERNAME/cognis-workforce-tool.git

# Push your code to GitHub
git push -u origin main
```

## 4. Configure GitHub Pages (If Needed)

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Scroll down to "GitHub Pages" section
4. For Source, select "gh-pages" branch
5. Click "Save"
6. Note the URL where your site is published

## 5. Create Production Branch

To trigger the production deployment workflow:

```bash
# Create and checkout a production branch
git checkout -b production

# Push the production branch to GitHub
git push -u origin production
```

## 6. Monitor Deployment

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. You should see the "Production Deployment" workflow running
4. Wait for the workflow to complete
5. Once successful, your application will be deployed to:
   - GitHub Pages (accessible at https://YOUR-USERNAME.github.io/cognis-workforce-tool/)
   - A production release will be created with the deployment package

## 7. Access Production Build

After successful deployment:

1. **Option 1: GitHub Pages**
   - Access your application at `https://YOUR-USERNAME.github.io/cognis-workforce-tool/`

2. **Option 2: Download Deployment Package**
   - Go to the "Actions" tab in your GitHub repository
   - Click on the completed workflow run
   - Scroll down to the "Artifacts" section
   - Download the "production-build" artifact
   - Extract and deploy to your web server

3. **Option 3: Use Release Package**
   - Go to the "Releases" section in your GitHub repository
   - Download the `cognis-workforce-production.tar.gz` file
   - Deploy to your web server following standard procedures

## 8. Deploy to Web Server (If needed)

If you need to deploy to a traditional web server instead of GitHub Pages:

```bash
# Download the release package from GitHub
wget https://github.com/YOUR-USERNAME/cognis-workforce-tool/releases/download/production-X/cognis-workforce-production.tar.gz

# SSH into your web server
ssh user@your-server

# Extract and deploy
cd /var/www/html
mkdir -p cognis-workforce
tar -xzvf /path/to/cognis-workforce-production.tar.gz -C cognis-workforce
```

## 9. Verify Deployment

After deployment, verify that:
1. The application loads correctly
2. No console errors appear (especially check for "Crown is not defined" errors)
3. Authentication works properly
4. Blockchain integration functions correctly
5. All other features work as expected

## 10. Ongoing Deployments

For future updates:

```bash
# Make your changes
git add .
git commit -m "Description of changes"

# Push to production branch to trigger deployment
git push origin production
```

## Troubleshooting

1. **Workflow Failures**: Check the GitHub Actions logs for detailed error information
2. **GitHub Pages 404 Errors**: Ensure the branch setting is correct in repository settings
3. **Application Errors**: Check browser console and server logs for details
