import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ExampleApiService } from './modules/examples/example-api.service';

/**
 * Demo controller to test the HTTP Client
 */
@ApiTags('demo')
@Controller({ path: 'demo', version: '1' })
export class DemoController {
  constructor(private readonly exampleApi: ExampleApiService) {}

  @Get('posts')
  @ApiOperation({
    summary: 'Demo: Fetch posts from external API',
    description:
      'Demonstrates the HTTP client by fetching posts from JSONPlaceholder',
  })
  @ApiOkResponse({
    description: 'Successfully fetched posts',
  })
  async getPosts() {
    return this.exampleApi.getAllPosts();
  }

  @Get('posts/:id')
  @ApiOperation({
    summary: 'Demo: Fetch single post',
    description: 'Demonstrates the HTTP client by fetching a single post',
  })
  async getPost(@Param('id') id: string) {
    return this.exampleApi.getPostById(parseInt(id));
  }
}
