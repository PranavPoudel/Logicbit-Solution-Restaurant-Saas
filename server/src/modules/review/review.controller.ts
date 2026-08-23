import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerJwtAuthGuard } from '../customer-auth/guards/customer-jwt-auth.guard';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('Reviews')
@Controller('api/v1')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('reviews')
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  create(@Req() req, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(req.user.id, dto);
  }

  /** PUBLIC — customer ले login नगरी नै restaurant का review हेर्न पाउने */
  @Get('discovery/restaurants/:restaurantId/reviews')
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.reviewService.findAllForRestaurant(restaurantId);
  }
}
