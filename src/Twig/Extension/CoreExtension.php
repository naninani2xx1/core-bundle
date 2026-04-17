<?php

namespace Amzs\CoreBundle\Twig\Extension;

use Amzs\CoreBundle\Utils\AssetUtil;
use Symfony\Component\HttpFoundation\RequestStack;
use Twig\Environment;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class CoreExtension extends AbstractExtension
{
    private $requestStack;
    private $twig;

    public function __construct(RequestStack $requestStack, Environment $twig)
    {
        $this->twig = $twig;
        $this->requestStack = $requestStack;
    }
    public function getFunctions(): array
    {
        return [
            new TwigFunction('get_path_core_cms_asset', [AssetUtil::class, 'getPrefixBundle']),
            new TwigFunction('is_route_active', [$this, 'isRouteActive']),
            new \Twig\TwigFunction('icon', [$this, 'renderIcon'], ['is_safe' => ['html']])
        ];
    }

    public function getFilters(): array
    {
        return [

        ];
    }

    public function isRouteActive($route): string
    {
        $request = $this->requestStack->getCurrentRequest();
        $currentRoute = $request->attributes->get('_route');
        if(is_array($route)){
            return in_array($currentRoute, $route) ? "active" : "";
        }
        return $currentRoute == $route ? "active" : "";
    }

    public function renderIcon(string $name, array $options = [])
    {
        return $this->twig->render("@AmzsCore/Components/Icons/{$name}.html.twig", $options);
    }
}
