import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guest-friendly version of CustomerJwtAuthGuard, used only by the chat widget.
//
// - Valid customer token  -> req.user = { id, email, name, type: 'customer' }
// - No token / bad token  -> req.user = null and the request carries on as a guest
//
// It never throws, so a visitor who is not logged in (or whose token expired)
// can still chat.
//
// NOTE: all login types share JWT_ACCESS_SECRET and the customer strategy does
// not check the token's `type`, so an owner/staff token also passes here. The
// chats service therefore confirms that req.user.id is a real Customer before
// storing it as customerId.
@Injectable()
export class OptionalCustomerJwtGuard extends AuthGuard('customer-jwt') {
  handleRequest<TUser = any>(_err: unknown, user: TUser | false | null): TUser {
    return (user || null) as TUser;
  }
}
