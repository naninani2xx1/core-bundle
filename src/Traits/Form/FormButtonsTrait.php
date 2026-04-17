<?php

namespace Amzs\CoreBundle\Traits\Form;

use Symfony\Component\Form\Extension\Core\Type\ButtonType;
use Symfony\Component\Form\Extension\Core\Type\FormType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;

trait FormButtonsTrait
{
    /**
     * Thêm cụm nút Cancel và Submit vào form
     */
    protected function addActionButtons(
        FormBuilderInterface $builder,
        array $options = []
    ): void {
        // Cấu hình mặc định
        $defaults = [
            'container_class' => 'd-flex gap-3 justify-content-center',
            'cancel_label'    => 'Close',
            'cancel_class'    => 'btn btn-sm btn-secondary hover-elevate-up',
            'cancel_attr'     => ['data-bs-dismiss' => 'modal'],
            'submit_label'    => 'Save',
            'submit_class'    => 'btn btn-sm btn-primary hover-elevate-up',
            'submit_attr'     => [],
        ];

        // Gộp cấu hình người dùng truyền vào
        $config = array_merge($defaults, $options);

        $builder->add('buttons', FormType::class, [
            'inherit_data' => true,
            'label'        => false,
            'attr'         => ['class' => $config['container_class']],
            'mapped'       => false,
        ])
            ->get('buttons')
            ->add('button_cancel', ButtonType::class, [
                'label' => $config['cancel_label'],
                'attr'  => array_merge(['class' => $config['cancel_class']], $config['cancel_attr']),
            ])
            ->add('button_submit', SubmitType::class, [
                'label' => $config['submit_label'],
                'attr' => array_merge(['class' => $config['submit_class']], $config['submit_attr']),
            ]);
    }
}