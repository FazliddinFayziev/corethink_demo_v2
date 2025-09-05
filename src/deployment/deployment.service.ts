import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { DbService } from 'src/db/db.service';

@Injectable()
export class DeploymentService {
  private readonly logger = new Logger(DeploymentService.name);
  private readonly vercelToken = process.env.VERCEL_TOKEN;
  private readonly vercelTeamId = process.env.VERCEL_TEAM_ID; // Optional: if using team account

  constructor(
    private readonly db: DbService,
  ) {
    if (!this.vercelToken) {
      throw new Error('VERCEL_TOKEN environment variable is required');
    }
  }

  /**
   * Deploy HTML code to Vercel and return the deployment URL
   * @param htmlContent - HTML content to deploy
   * @param projectId - Project ID to get domain name and update URL
   * @returns Promise<string> - The deployment URL
   */
  async deployHtmlToVercel(htmlContent: string, projectId: string): Promise<string> {
    try {
      // Get project from database
      const project = await this.db.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Use domainName as deployment name
      const deploymentName = project.domainName;

      this.logger.log(`Starting deployment for project: ${deploymentName}`);

      // Prepare deployment payload - deploy HTML content directly
      const deploymentPayload = {
        name: deploymentName,
        files: [
          {
            file: 'index.html',
            data: htmlContent
          }
        ],
        projectSettings: {
          framework: null, // Static HTML
          buildCommand: null,
          outputDirectory: null
        },
        target: 'production'
      };

      // Add team ID to headers if provided
      const headers: any = {
        'Authorization': `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/json'
      };

      if (this.vercelTeamId) {
        headers['X-Vercel-Team-Id'] = this.vercelTeamId;
      }

      // Create deployment
      const deploymentResponse = await axios.post(
        'https://api.vercel.com/v13/deployments',
        deploymentPayload,
        { headers }
      );

      const deploymentData = deploymentResponse.data;
      this.logger.log(`Deployment created with ID: ${deploymentData.id}`);

      // Wait for deployment to be ready
      const deploymentUrl = await this.waitForDeployment(deploymentData.id, deploymentData.url);

      // Update project URL in database
      await this.db.project.update({
        where: { id: projectId },
        data: { url: deploymentUrl }
      });

      this.logger.log(`Deployment successful and project updated: ${deploymentUrl}`);
      return deploymentUrl;

    } catch (error) {
      this.logger.error('Deployment failed:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        throw new Error('Invalid Vercel token. Please check your VERCEL_TOKEN environment variable.');
      }

      if (error.response?.status === 403) {
        throw new Error('Insufficient permissions. Please check your Vercel token permissions.');
      }

      throw new Error(`Vercel deployment failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Wait for deployment to be ready and return the URL
   * @param deploymentId - Vercel deployment ID
   * @param deploymentUrl - Initial deployment URL
   * @returns Promise<string> - Ready deployment URL
   */
  private async waitForDeployment(deploymentId: string, deploymentUrl: string): Promise<string> {
    const maxAttempts = 30; // Maximum 5 minutes (30 * 10 seconds)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const headers: any = {
          'Authorization': `Bearer ${this.vercelToken}`
        };

        if (this.vercelTeamId) {
          headers['X-Vercel-Team-Id'] = this.vercelTeamId;
        }

        // Check deployment status
        const statusResponse = await axios.get(
          `https://api.vercel.com/v13/deployments/${deploymentId}`,
          { headers }
        );

        const deployment = statusResponse.data;

        this.logger.log(`Deployment status: ${deployment.readyState}`);

        if (deployment.readyState === 'READY') {
          // Return the clean URL without deployment ID and username
          const cleanUrl = this.getCleanUrl(deployment.name, deployment.alias);
          return cleanUrl;
        }

        if (deployment.readyState === 'ERROR') {
          throw new Error('Deployment failed on Vercel');
        }

        // Wait 10 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;

      } catch (error) {
        if (error.message === 'Deployment failed on Vercel') {
          throw error;
        }

        this.logger.warn(`Error checking deployment status: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
    }

    // If we reach here, deployment took too long
    this.logger.warn('Deployment is taking longer than expected, returning URL anyway');
    return `https://${deploymentUrl}`;
  }

  /**
   * Get clean accessible URL from deployment data
   * @param deploymentName - Name of the deployment
   * @param aliases - Deployment aliases if any
   * @returns string - Clean URL
   */
  private getCleanUrl(deploymentName: string, aliases?: string[]): string {
    // If there are aliases, use the first one (custom domain)
    if (aliases && aliases.length > 0) {
      return `https://${aliases[0]}`;
    }

    // Otherwise, use the clean deployment name format
    return `https://${deploymentName}.vercel.app`;
  }
}