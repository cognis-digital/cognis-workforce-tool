/**
 * GitOps Client for Cognis Workforce Tool
 * Handles git repository operations including branches, commits, and PRs
 */
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import { ENV } from '../../util/env';

const exec = promisify(execCallback);

// Get GitHub token from environment
const GITHUB_TOKEN = ENV.GITHUB_TOKEN || process.env.GITHUB_TOKEN || '';

/**
 * GitOps Client for repository operations
 */
export class GitOpsClient {
  private octokit: Octokit;
  private tempDir: string;
  
  constructor() {
    this.octokit = new Octokit({
      auth: GITHUB_TOKEN
    });
    
    // Create a temporary directory for git operations
    this.tempDir = path.join(process.cwd(), 'tmp', 'git-ops');
  }
  
  /**
   * Checkout a repository branch
   */
  async checkout(repoFullName: string, branch: string): Promise<void> {
    const [owner, repo] = repoFullName.split('/');
    
    // Ensure temp directory exists
    await this.ensureTempDir();
    
    const repoDir = path.join(this.tempDir, repo);
    
    try {
      // Check if repo directory already exists
      await fs.access(repoDir);
      
      // If exists, pull latest changes
      await exec(`cd ${repoDir} && git fetch origin && git checkout ${branch} && git pull origin ${branch}`);
    } catch (error) {
      // If not exists, clone the repo
      await exec(`git clone https://x-access-token:${GITHUB_TOKEN}@github.com/${owner}/${repo}.git ${repoDir} && cd ${repoDir} && git checkout ${branch}`);
    }
  }
  
  /**
   * Create a new branch from the current branch
   */
  async createBranch(branchName: string): Promise<void> {
    // Find the repo directory
    const repoDirs = await fs.readdir(this.tempDir);
    if (repoDirs.length === 0) {
      throw new Error('No repository checked out');
    }
    
    const repoDir = path.join(this.tempDir, repoDirs[0]);
    
    try {
      // Create branch if it doesn't exist
      await exec(`cd ${repoDir} && git checkout -b ${branchName}`);
    } catch (error) {
      // If branch already exists, just checkout
      await exec(`cd ${repoDir} && git checkout ${branchName}`);
    }
  }
  
  /**
   * Write a file to the repository
   */
  async writeFile(branch: string, filePath: string, content: string): Promise<void> {
    const repoDirs = await fs.readdir(this.tempDir);
    if (repoDirs.length === 0) {
      throw new Error('No repository checked out');
    }
    
    const repoDir = path.join(this.tempDir, repoDirs[0]);
    
    // Ensure the branch is checked out
    await exec(`cd ${repoDir} && git checkout ${branch}`);
    
    // Ensure directory exists
    const fileDir = path.dirname(path.join(repoDir, filePath));
    await fs.mkdir(fileDir, { recursive: true });
    
    // Write the file
    await fs.writeFile(path.join(repoDir, filePath), content);
  }
  
  /**
   * Commit changes to the repository
   */
  async commit(branch: string, message: string): Promise<string> {
    const repoDirs = await fs.readdir(this.tempDir);
    if (repoDirs.length === 0) {
      throw new Error('No repository checked out');
    }
    
    const repoDir = path.join(this.tempDir, repoDirs[0]);
    
    // Ensure the branch is checked out
    await exec(`cd ${repoDir} && git checkout ${branch}`);
    
    // Add all changes
    await exec(`cd ${repoDir} && git add -A`);
    
    // Commit changes
    await exec(`cd ${repoDir} && git commit -m "${message}"`);
    
    // Get commit hash
    const { stdout } = await exec(`cd ${repoDir} && git rev-parse HEAD`);
    return stdout.trim();
  }
  
  /**
   * Push changes to remote
   */
  async push(branch: string): Promise<void> {
    const repoDirs = await fs.readdir(this.tempDir);
    if (repoDirs.length === 0) {
      throw new Error('No repository checked out');
    }
    
    const repoDir = path.join(this.tempDir, repoDirs[0]);
    
    // Ensure the branch is checked out
    await exec(`cd ${repoDir} && git checkout ${branch}`);
    
    // Push changes
    await exec(`cd ${repoDir} && git push origin ${branch}`);
  }
  
  /**
   * Create a pull request
   */
  async createPR(repoFullName: string, head: string, base: string, title: string, body: string): Promise<string> {
    const [owner, repo] = repoFullName.split('/');
    
    const response = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base
    });
    
    return response.data.html_url;
  }
  
  /**
   * Check CI status for a branch
   */
  async checkCIStatus(repoFullName: string, branch: string): Promise<{
    status: 'pending' | 'success' | 'failure' | 'unknown';
    url?: string;
  }> {
    const [owner, repo] = repoFullName.split('/');
    
    try {
      // Get latest commit on branch
      const branchData = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch
      });
      
      const sha = branchData.data.commit.sha;
      
      // Get check runs for the commit
      const checkRuns = await this.octokit.checks.listForRef({
        owner,
        repo,
        ref: sha
      });
      
      // If no check runs, return unknown
      if (checkRuns.data.total_count === 0) {
        return { status: 'unknown' };
      }
      
      // Check if any check run is failing
      const failingRun = checkRuns.data.check_runs.find(run => 
        run.conclusion === 'failure' || run.conclusion === 'timed_out'
      );
      
      if (failingRun) {
        return { 
          status: 'failure',
          url: failingRun.html_url
        };
      }
      
      // Check if all check runs are complete
      const pendingRun = checkRuns.data.check_runs.find(run => 
        run.status !== 'completed'
      );
      
      if (pendingRun) {
        return { 
          status: 'pending',
          url: pendingRun.html_url 
        };
      }
      
      // All check runs complete and passing
      return { 
        status: 'success',
        url: checkRuns.data.check_runs[0]?.html_url
      };
    } catch (error) {
      console.error('Error checking CI status:', error);
      return { status: 'unknown' };
    }
  }
  
  /**
   * Merge a pull request
   */
  async mergePR(repoFullName: string, pullNumber: number): Promise<void> {
    const [owner, repo] = repoFullName.split('/');
    
    await this.octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber
    });
  }
  
  /**
   * Ensure temporary directory exists
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.tempDir);
    } catch (error) {
      // Create directory if it doesn't exist
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }
}
