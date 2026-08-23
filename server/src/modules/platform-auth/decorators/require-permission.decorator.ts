import { SetMetadata } from '@nestjs/common';

export const PLATFORM_PERMISSION_KEY = 'platformPermission';

/**
 * @RequirePlatformPermission('SUSPEND_RESTAURANT')
 * ---------------------------------------------------
 * यो decorator ले controller method मा "यो काम गर्न कुन permission
 * चाहिन्छ" भनेर तोक्छ। PlatformPermissionGuard ले यही metadata पढेर
 * logged-in staff को role मा त्यो permission छ कि छैन जाँच्छ।
 */
export const RequirePlatformPermission = (...permissions: string[]) => SetMetadata(PLATFORM_PERMISSION_KEY, permissions);
