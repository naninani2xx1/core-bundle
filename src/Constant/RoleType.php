<?php

namespace Amzs\CoreBundle\Constant;

class RoleType
{
    private function __construct()
    {
    }

    public const ROLE_ADMIN = 'ROLE_ADMIN';
    public const ROLE_ROOT = 'ROLE_ROOT';

    public static function getReadable(string $roleType): string
    {
        switch ($roleType) {
            case self::ROLE_ADMIN:
                return 'Admin';
            case self::ROLE_ROOT:
                return 'Root';
                default:
                    return 'Unknown';
        }
    }
}