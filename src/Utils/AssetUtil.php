<?php

namespace Amzs\CoreBundle\Utils;

class AssetUtil
{
    private function __construct()
    {
    }

    public static function getPrefixBundle(): string
    {
        return 'bundles/amzscore/backend/';
    }
}