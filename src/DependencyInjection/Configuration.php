<?php

namespace Amzs\CoreBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('amzs_core');

        $root = $treeBuilder->getRootNode();

        // optional bundle config here
        $root
            ->children()
                ->arrayNode('assets_manager')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->scalarNode('thumbnail_default')
                            ->defaultValue(null)
                            ->info('Đường dẫn mặc định cho thumbnail khi item render không có path')
                        ->end()
                    ->end()
                ->end() // kết thúc assets_manager
            ->end();
        return $treeBuilder;
    }
}