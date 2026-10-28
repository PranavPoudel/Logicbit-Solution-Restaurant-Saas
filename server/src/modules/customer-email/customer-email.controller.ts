import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerEmailService } from './customer-email.service';
import { SendCustomerEmailDto } from './dto/send-customer-email.dto';

@ApiTags('Customer Emails')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/customer-emails')
export class CustomerEmailController {
  constructor(private readonly service: CustomerEmailService) {}

  @Get('customers')
  @ApiOperation({ summary: 'Customers who have ordered from this restaurant' })
  customers(@Req() req, @Param('restaurantId', ParseUUIDPipe) restaurantId: string, @Query('q') q?: string) {
    return this.service.customers(req.user.tenantId, restaurantId, q);
  }

  @Get('customers/:customerId/orders')
  @ApiOperation({ summary: "A customer's recent orders at this restaurant" })
  orders(
    @Req() req,
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.service.orders(req.user.tenantId, restaurantId, customerId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Most recent orders at this restaurant, with the customer who placed each' })
  recentOrders(@Req() req, @Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.service.recentOrders(req.user.tenantId, restaurantId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Recently sent emails' })
  history(@Req() req, @Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.service.history(req.user.tenantId, restaurantId);
  }

  @Post('send')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Email all customers or one customer, optionally about an order' })
  send(@Req() req, @Param('restaurantId', ParseUUIDPipe) restaurantId: string, @Body() dto: SendCustomerEmailDto) {
    return this.service.send(req.user.tenantId, restaurantId, dto);
  }
}
