import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../http-client';

/**
 * Example service demonstrating how to use HttpClientService
 */
@Injectable()
export class ExampleApiService {
    private readonly logger = new Logger(ExampleApiService.name);

    constructor(private readonly httpClient: HttpClientService) {
        // Set base URL for this service
        this.httpClient.setBaseURL('https://jsonplaceholder.typicode.com');
    }

    /**
     * Example: Fetch all posts
     */
    async getAllPosts(): Promise<any[]> {
        try {
            const posts = await this.httpClient.get<any[]>('/posts');
            this.logger.log(`Fetched ${posts.length} posts`);
            return posts;
        } catch (error) {
            this.logger.error('Failed to fetch posts', error);
            throw error;
        }
    }

    /**
     * Example: Fetch single post by ID
     */
    async getPostById(id: number): Promise<any> {
        try {
            const post = await this.httpClient.get(`/posts/${id}`, {

            });
            return post;
        } catch (error) {
            this.logger.error(`Failed to fetch post ${id}`, error);
            throw error;
        }
    }

    /**
     * Example: Create a new post
     */
    async createPost(data: { title: string; body: string; userId: number }): Promise<any> {
        try {
            const newPost = await this.httpClient.post('/posts', data);
            this.logger.log(`Created post with ID: ${newPost.id}`);
            return newPost;
        } catch (error) {
            this.logger.error('Failed to create post', error);
            throw error;
        }
    }

    /**
     * Example: Update a post
     */
    async updatePost(id: number, data: Partial<{ title: string; body: string }>): Promise<any> {
        try {
            const updatedPost = await this.httpClient.patch(`/posts/${id}`, data);
            return updatedPost;
        } catch (error) {
            this.logger.error(`Failed to update post ${id}`, error);
            throw error;
        }
    }

    /**
     * Example: Delete a post
     */
    async deletePost(id: number): Promise<void> {
        try {
            await this.httpClient.delete(`/posts/${id}`);
            this.logger.log(`Deleted post ${id}`);
        } catch (error) {
            this.logger.error(`Failed to delete post ${id}`, error);
            throw error;
        }
    }

    /**
     * Example: Using custom options
     */
    async getPostsWithCustomTimeout(): Promise<any[]> {
        return this.httpClient.get<any[]>('/posts', {
            customTimeout: 5000, // 5 seconds
            headers: {
                'Custom-Header': 'custom-value',
            },
        });
    }
}
