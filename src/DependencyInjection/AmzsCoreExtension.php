<?php

namespace Amzs\CoreBundle\DependencyInjection;

use Amzs\CoreBundle\Utils\AssetUtil;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;

class AmzsCoreExtension extends Extension implements PrependExtensionInterface
{
    public function load(array $configs, ContainerBuilder $container)
    {
        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);
//
        $loader = new YamlFileLoader(
            $container,
            new FileLocator(__DIR__.'/../Resources/config')
        );
        $loader->load('services.yaml');

        $container->setParameter('amzs_core.assets_manager.thumbnail_default',
            $config['assets_manager']['thumbnail_default'] ?? AssetUtil::getPrefixBundle().'assets/media/amzs/thumb_default.png');
    }

    public function prepend(ContainerBuilder $container)
    {
        $container->prependExtensionConfig('twig', [
            'globals' => [
                'app_site' => [
                    'name' => 'AMZS CMS',
                    'company_name' => 'AMZS solutions',
                ],
            ],
        ]);
    }
}